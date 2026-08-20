"""SQL Arena — sandboxed SQLite payment domain.

Security model:
- Isolated aiosqlite in-memory DB (no touch to Mongo). Seeded from scratch on
  service init.
- A parser guard rejects anything that isn't a single, comment-free SELECT / WITH
  statement, and blocks a hard-coded destructive keyword list.
- Uses .execute() (single-statement) and .fetchall() with a row limit.
"""
from __future__ import annotations
import asyncio
import re
import time
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

import aiosqlite

_MAX_ROWS = 200
_MAX_QUERY_MS = 3000

BLOCKED_KEYWORDS = (
    "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE",
    "CREATE", "EXEC", "EXECUTE", "MERGE", "ATTACH", "DETACH", "REINDEX",
    "REPLACE", "VACUUM", "PRAGMA",
)


class QueryValidationError(Exception):
    def __init__(self, message: str, hint: Optional[str] = None):
        super().__init__(message)
        self.hint = hint


def validate_query(raw: str) -> str:
    """Return a cleaned single-statement query or raise QueryValidationError."""
    if not raw or not raw.strip():
        raise QueryValidationError("query cannot be empty")
    q = raw.strip()

    # Reject SQL comments outright — they're a common bypass vector.
    if "--" in q or "/*" in q or "*/" in q:
        raise QueryValidationError(
            "SQL comments are not allowed in the arena",
            hint="Remove '--' and /* */ before running.",
        )

    # Single statement only. Allow one optional trailing semicolon.
    stripped = q.rstrip(";").strip()
    if ";" in stripped:
        raise QueryValidationError(
            "only a single SQL statement is allowed",
            hint="Remove intermediate semicolons.",
        )

    # Must start with SELECT or WITH (a CTE).
    head = stripped.split(None, 1)[0].upper()
    if head not in ("SELECT", "WITH"):
        raise QueryValidationError(
            f"only read-only SELECT/WITH statements are allowed (got '{head}')",
        )

    # Block destructive keywords as whole words anywhere in the query.
    upper = stripped.upper()
    for kw in BLOCKED_KEYWORDS:
        if re.search(rf"\b{kw}\b", upper):
            raise QueryValidationError(
                f"blocked keyword '{kw}' — the arena is read-only",
            )

    return stripped


# ---------- Schema definition (used both for creating and for the explorer) ------------

SCHEMA_TABLES: List[Dict[str, Any]] = [
    {
        "name": "Customers",
        "description": "Fictional customers subscribing to the demo product.",
        "columns": [
            {"name": "Id", "type": "INTEGER", "nullable": False, "description": "Primary key"},
            {"name": "Name", "type": "TEXT", "nullable": False, "description": "Full name"},
            {"name": "Country", "type": "TEXT", "nullable": False, "description": "ISO-3166 alpha-2"},
            {"name": "CreatedAt", "type": "TEXT", "nullable": False, "description": "ISO date"},
        ],
    },
    {
        "name": "Subscriptions",
        "description": "One row per active subscription.",
        "columns": [
            {"name": "Id", "type": "INTEGER", "nullable": False, "description": "PK"},
            {"name": "CustomerId", "type": "INTEGER", "nullable": False, "description": "FK → Customers.Id"},
            {"name": "Plan", "type": "TEXT", "nullable": False, "description": "monthly / annual"},
            {"name": "Amount", "type": "REAL", "nullable": False, "description": "GBP"},
            {"name": "Status", "type": "TEXT", "nullable": False, "description": "Active / Cancelled / InArrears"},
            {"name": "StartedAt", "type": "TEXT", "nullable": False, "description": ""},
        ],
    },
    {
        "name": "Mandates",
        "description": "Direct Debit mandates authorising collection.",
        "columns": [
            {"name": "Id", "type": "INTEGER", "nullable": False, "description": "PK"},
            {"name": "CustomerId", "type": "INTEGER", "nullable": False, "description": "FK → Customers.Id"},
            {"name": "Status", "type": "TEXT", "nullable": False, "description": "Active / Cancelled"},
            {"name": "SignedAt", "type": "TEXT", "nullable": False, "description": ""},
        ],
    },
    {
        "name": "Payments",
        "description": "One row per payment cycle attempt against a subscription.",
        "columns": [
            {"name": "Id", "type": "INTEGER", "nullable": False, "description": "PK"},
            {"name": "SubscriptionId", "type": "INTEGER", "nullable": False, "description": "FK → Subscriptions.Id"},
            {"name": "CustomerId", "type": "INTEGER", "nullable": False, "description": "denormalised for reporting"},
            {"name": "Amount", "type": "REAL", "nullable": False, "description": ""},
            {"name": "Currency", "type": "TEXT", "nullable": False, "description": ""},
            {"name": "Status", "type": "TEXT", "nullable": False, "description": "Successful / Failed / Retrying"},
            {"name": "ExpectedStatus", "type": "TEXT", "nullable": True, "description": "for reconciliation challenge"},
            {"name": "CreatedAt", "type": "TEXT", "nullable": False, "description": ""},
            {"name": "ProcessedAt", "type": "TEXT", "nullable": True, "description": ""},
        ],
    },
    {
        "name": "PaymentAttempts",
        "description": "Individual retry attempts for a Payment.",
        "columns": [
            {"name": "Id", "type": "INTEGER", "nullable": False, "description": "PK"},
            {"name": "PaymentId", "type": "INTEGER", "nullable": False, "description": "FK → Payments.Id"},
            {"name": "AttemptNo", "type": "INTEGER", "nullable": False, "description": "1-based"},
            {"name": "Status", "type": "TEXT", "nullable": False, "description": "Success / Failed"},
            {"name": "Reason", "type": "TEXT", "nullable": True, "description": ""},
            {"name": "AttemptedAt", "type": "TEXT", "nullable": False, "description": ""},
        ],
    },
    {
        "name": "Arrears",
        "description": "Outstanding balance per customer.",
        "columns": [
            {"name": "Id", "type": "INTEGER", "nullable": False, "description": "PK"},
            {"name": "CustomerId", "type": "INTEGER", "nullable": False, "description": "FK → Customers.Id"},
            {"name": "Amount", "type": "REAL", "nullable": False, "description": "outstanding"},
            {"name": "CreatedAt", "type": "TEXT", "nullable": False, "description": ""},
        ],
    },
]


_DDL = [
    """CREATE TABLE Customers (
        Id INTEGER PRIMARY KEY, Name TEXT NOT NULL, Country TEXT NOT NULL, CreatedAt TEXT NOT NULL
    )""",
    """CREATE TABLE Subscriptions (
        Id INTEGER PRIMARY KEY, CustomerId INTEGER NOT NULL, Plan TEXT NOT NULL,
        Amount REAL NOT NULL, Status TEXT NOT NULL, StartedAt TEXT NOT NULL,
        FOREIGN KEY(CustomerId) REFERENCES Customers(Id)
    )""",
    """CREATE TABLE Mandates (
        Id INTEGER PRIMARY KEY, CustomerId INTEGER NOT NULL, Status TEXT NOT NULL, SignedAt TEXT NOT NULL,
        FOREIGN KEY(CustomerId) REFERENCES Customers(Id)
    )""",
    """CREATE TABLE Payments (
        Id INTEGER PRIMARY KEY, SubscriptionId INTEGER NOT NULL, CustomerId INTEGER NOT NULL,
        Amount REAL NOT NULL, Currency TEXT NOT NULL, Status TEXT NOT NULL,
        ExpectedStatus TEXT, CreatedAt TEXT NOT NULL, ProcessedAt TEXT,
        FOREIGN KEY(SubscriptionId) REFERENCES Subscriptions(Id),
        FOREIGN KEY(CustomerId) REFERENCES Customers(Id)
    )""",
    """CREATE TABLE PaymentAttempts (
        Id INTEGER PRIMARY KEY, PaymentId INTEGER NOT NULL, AttemptNo INTEGER NOT NULL,
        Status TEXT NOT NULL, Reason TEXT, AttemptedAt TEXT NOT NULL,
        FOREIGN KEY(PaymentId) REFERENCES Payments(Id)
    )""",
    """CREATE TABLE Arrears (
        Id INTEGER PRIMARY KEY, CustomerId INTEGER NOT NULL, Amount REAL NOT NULL, CreatedAt TEXT NOT NULL,
        FOREIGN KEY(CustomerId) REFERENCES Customers(Id)
    )""",
    "CREATE INDEX idx_payments_customer ON Payments(CustomerId)",
    "CREATE INDEX idx_payments_status ON Payments(Status)",
    "CREATE INDEX idx_attempts_payment ON PaymentAttempts(PaymentId)",
    "CREATE INDEX idx_arrears_customer ON Arrears(CustomerId)",
]

# Deterministic seed (larger than a toy dataset).
def _seed_rows() -> Dict[str, List[Tuple]]:
    customers = [
        (1, "Alex Doe",     "GB", "2025-01-15"),
        (2, "Priya Nair",   "IN", "2025-02-04"),
        (3, "Jonas Weber",  "DE", "2025-01-20"),
        (4, "Marta Silva",  "PT", "2025-03-01"),
        (5, "Yuki Tanaka",  "JP", "2025-01-11"),
        (6, "Sam O'Neill",  "IE", "2025-02-27"),
        (7, "Aisha Khan",   "PK", "2025-03-14"),
        (8, "Rob Martinez", "ES", "2025-04-02"),
    ]
    subs = [
        (100, 1, "monthly", 12.99, "Active",     "2025-01-16"),
        (101, 2, "monthly", 12.99, "InArrears",  "2025-02-05"),
        (102, 3, "annual", 129.99, "Active",     "2025-01-21"),
        (103, 4, "monthly", 12.99, "Active",     "2025-03-02"),
        (104, 5, "monthly", 12.99, "InArrears",  "2025-01-12"),
        (105, 6, "monthly", 24.99, "Active",     "2025-02-28"),
        (106, 7, "monthly", 12.99, "Cancelled",  "2025-03-15"),
        (107, 8, "monthly", 24.99, "Active",     "2025-04-03"),
    ]
    mandates = [
        (1, 1, "Active",    "2025-01-15"),
        (2, 2, "Active",    "2025-02-04"),
        (3, 3, "Active",    "2025-01-20"),
        (4, 4, "Active",    "2025-03-01"),
        (5, 5, "Cancelled", "2025-01-11"),  # mandate cancellation → payments will fail
        (6, 6, "Active",    "2025-02-27"),
        (7, 7, "Cancelled", "2025-04-01"),
        (8, 8, "Active",    "2025-04-02"),
    ]
    payments = [
        # id, sub_id, cust_id, amount, curr, status, expected, created, processed
        (1000, 100, 1, 12.99, "GBP", "Successful", "Successful", "2025-02-16", "2025-02-16"),
        (1001, 100, 1, 12.99, "GBP", "Successful", "Successful", "2025-03-16", "2025-03-16"),
        (1002, 100, 1, 12.99, "GBP", "Failed",     "Successful", "2025-04-16", None),   # reconciliation drift
        (1003, 100, 1, 12.99, "GBP", "Successful", "Successful", "2025-04-19", "2025-04-19"),

        (1010, 101, 2, 12.99, "GBP", "Failed",     "Failed",     "2025-03-05", None),
        (1011, 101, 2, 12.99, "GBP", "Failed",     "Failed",     "2025-04-05", None),
        (1012, 101, 2, 12.99, "GBP", "Failed",     "Failed",     "2025-05-05", None),

        (1020, 102, 3, 129.99, "EUR", "Successful", "Successful", "2025-01-22", "2025-01-22"),

        (1030, 103, 4, 12.99, "GBP", "Successful", "Successful", "2025-04-02", "2025-04-02"),
        (1031, 103, 4, 12.99, "GBP", "Failed",     "Failed",     "2025-05-02", None),
        (1032, 103, 4, 12.99, "GBP", "Successful", "Successful", "2025-05-05", "2025-05-05"),

        (1040, 104, 5, 12.99, "JPY", "Failed",     "Failed",     "2025-02-12", None),
        (1041, 104, 5, 12.99, "JPY", "Failed",     "Failed",     "2025-03-12", None),

        (1050, 105, 6, 24.99, "EUR", "Successful", "Successful", "2025-03-28", "2025-03-28"),
        (1051, 105, 6, 24.99, "EUR", "Successful", "Successful", "2025-04-28", "2025-04-28"),

        (1060, 106, 7, 12.99, "GBP", "Failed",     "Failed",     "2025-04-15", None),

        (1070, 107, 8, 24.99, "USD", "Successful", "Successful", "2025-05-03", "2025-05-03"),
        (1071, 107, 8, 24.99, "USD", "Successful", "Successful", "2025-06-03", "2025-06-03"),
    ]
    attempts = []
    aid = 1
    for pid, *_ in payments:
        # every payment has 1..N attempts; failed ones get 3 attempts, successful 1 or 2.
        status = next(p[5] for p in payments if p[0] == pid)
        n = 3 if status == "Failed" else (2 if pid % 3 == 0 else 1)
        for j in range(1, n + 1):
            outcome = "Success" if (status == "Successful" and j == n) else "Failed"
            attempts.append((aid, pid, j, outcome, "processor_declined" if outcome == "Failed" else None, "2025-04-16"))
            aid += 1

    arrears = [
        (1, 2, 38.97, "2025-05-10"),  # 3 failed months
        (2, 5, 25.98, "2025-04-01"),
    ]
    return {
        "Customers": customers,
        "Subscriptions": subs,
        "Mandates": mandates,
        "Payments": payments,
        "PaymentAttempts": attempts,
        "Arrears": arrears,
    }


@dataclass
class ExecutionResult:
    ok: bool
    columns: List[str]
    rows: List[List[Any]]
    row_count: int
    execution_ms: int
    error: Optional[str] = None
    hint: Optional[str] = None


class SqlArenaService:
    """Owns a single in-memory aiosqlite DB seeded once."""

    def __init__(self) -> None:
        self._db: Optional[aiosqlite.Connection] = None
        self._lock = asyncio.Lock()

    async def _ensure(self) -> aiosqlite.Connection:
        if self._db is not None:
            return self._db
        async with self._lock:
            if self._db is not None:
                return self._db
            db = await aiosqlite.connect(":memory:")
            for sql in _DDL:
                await db.execute(sql)
            rows = _seed_rows()
            await db.executemany(
                "INSERT INTO Customers VALUES (?,?,?,?)", rows["Customers"]
            )
            await db.executemany(
                "INSERT INTO Subscriptions VALUES (?,?,?,?,?,?)", rows["Subscriptions"]
            )
            await db.executemany(
                "INSERT INTO Mandates VALUES (?,?,?,?)", rows["Mandates"]
            )
            await db.executemany(
                "INSERT INTO Payments VALUES (?,?,?,?,?,?,?,?,?)", rows["Payments"]
            )
            await db.executemany(
                "INSERT INTO PaymentAttempts VALUES (?,?,?,?,?,?)", rows["PaymentAttempts"]
            )
            await db.executemany(
                "INSERT INTO Arrears VALUES (?,?,?,?)", rows["Arrears"]
            )
            await db.commit()
            # Enforce read-only via query_only pragma. Executed BEFORE we hand
            # out the connection, so any query hitting it can't mutate.
            await db.execute("PRAGMA query_only = 1")
            self._db = db
            return db

    async def execute(self, sql: str) -> ExecutionResult:
        try:
            cleaned = validate_query(sql)
        except QueryValidationError as e:
            return ExecutionResult(
                ok=False, columns=[], rows=[], row_count=0, execution_ms=0,
                error=str(e), hint=e.hint,
            )

        db = await self._ensure()
        t0 = time.perf_counter()
        try:
            async with db.execute(cleaned) as cur:
                cols = [d[0] for d in cur.description or []]
                fetched = await cur.fetchmany(_MAX_ROWS + 1)
        except Exception as exc:  # noqa: BLE001
            ms = int((time.perf_counter() - t0) * 1000)
            return ExecutionResult(
                ok=False, columns=[], rows=[], row_count=0, execution_ms=ms,
                error=f"SQL error: {exc}", hint=None,
            )
        ms = int((time.perf_counter() - t0) * 1000)
        if ms > _MAX_QUERY_MS:
            return ExecutionResult(
                ok=False, columns=[], rows=[], row_count=0, execution_ms=ms,
                error="query exceeded execution time budget", hint=None,
            )
        truncated = len(fetched) > _MAX_ROWS
        rows = [list(r) for r in fetched[:_MAX_ROWS]]
        return ExecutionResult(
            ok=True, columns=cols, rows=rows, row_count=len(rows),
            execution_ms=ms,
            error=None,
            hint="result truncated at 200 rows" if truncated else None,
        )

    async def schema(self) -> List[Dict[str, Any]]:
        return SCHEMA_TABLES
