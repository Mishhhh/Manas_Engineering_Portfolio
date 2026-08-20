"""Curated SQL challenges + result-shape evaluator."""
from __future__ import annotations
from typing import Any, Dict, List


CHALLENGES: List[Dict[str, Any]] = [
    {
        "id": "c01",
        "title": "Failed Payments",
        "difficulty": "Easy",
        "category": "Filtering",
        "description": "Find all payments whose Status is 'Failed'. Return every column.",
        "hints": [
            "Think about which table contains payment status.",
            "You need a WHERE clause.",
            "Try: SELECT * FROM Payments WHERE Status = 'Failed'.",
        ],
        "solution": "SELECT * FROM Payments WHERE Status = 'Failed'",
        "explanation": (
            "Filter the Payments table using a WHERE clause. String comparisons "
            "are exact — 'Failed' must match the stored value."
        ),
        "check": {"type": "row_set", "sql": "SELECT * FROM Payments WHERE Status = 'Failed'"},
    },
    {
        "id": "c02",
        "title": "Customer Payment History",
        "difficulty": "Easy",
        "category": "JOINs",
        "description": "Return the customer Name, payment Amount and Status for every payment.",
        "hints": [
            "Customer names live in Customers; payments live in Payments.",
            "Use JOIN on CustomerId.",
        ],
        "solution": (
            "SELECT c.Name, p.Amount, p.Status "
            "FROM Customers c JOIN Payments p ON c.Id = p.CustomerId"
        ),
        "explanation": "Inner join Customers to Payments on the foreign key and project the fields you need.",
        "check": {
            "type": "row_set",
            "sql": (
                "SELECT c.Name, p.Amount, p.Status "
                "FROM Customers c JOIN Payments p ON c.Id = p.CustomerId"
            ),
        },
    },
    {
        "id": "c03",
        "title": "Customers With Failed Payments",
        "difficulty": "Easy",
        "category": "JOINs",
        "description": "List the distinct names of customers who have had at least one failed payment.",
        "hints": ["Join Customers to Payments.", "Filter for Status='Failed'.", "SELECT DISTINCT c.Name …"],
        "solution": (
            "SELECT DISTINCT c.Name FROM Customers c "
            "JOIN Payments p ON c.Id = p.CustomerId WHERE p.Status = 'Failed'"
        ),
        "explanation": "JOIN + WHERE + DISTINCT removes duplicate rows for repeat offenders.",
        "check": {
            "type": "row_set",
            "sql": (
                "SELECT DISTINCT c.Name FROM Customers c "
                "JOIN Payments p ON c.Id = p.CustomerId WHERE p.Status = 'Failed'"
            ),
        },
    },
    {
        "id": "c04",
        "title": "Total Successful Payments By Customer",
        "difficulty": "Medium",
        "category": "Aggregation",
        "description": "For each customer, return the total value of their successful payments. Columns: Name, TotalAmount.",
        "hints": ["Use SUM.", "GROUP BY the customer.", "Only Status='Successful'."],
        "solution": (
            "SELECT c.Name, SUM(p.Amount) AS TotalAmount FROM Customers c "
            "JOIN Payments p ON c.Id = p.CustomerId WHERE p.Status = 'Successful' GROUP BY c.Name"
        ),
        "explanation": "Aggregate with SUM, group by the customer, filter to Successful before grouping.",
        "check": {
            "type": "row_set",
            "sql": (
                "SELECT c.Name, SUM(p.Amount) AS TotalAmount FROM Customers c "
                "JOIN Payments p ON c.Id = p.CustomerId WHERE p.Status = 'Successful' GROUP BY c.Name"
            ),
        },
    },
    {
        "id": "c05",
        "title": "Customers With More Than 2 Failed Payments",
        "difficulty": "Medium",
        "category": "Aggregation",
        "description": "Return customer names with strictly more than 2 failed payments. Columns: Name, FailCount.",
        "hints": ["Count Failed rows per customer.", "Filter with HAVING."],
        "solution": (
            "SELECT c.Name, COUNT(*) AS FailCount FROM Customers c "
            "JOIN Payments p ON c.Id = p.CustomerId WHERE p.Status='Failed' "
            "GROUP BY c.Name HAVING COUNT(*) > 2"
        ),
        "explanation": "HAVING filters after aggregation; WHERE filters before.",
        "check": {
            "type": "row_set",
            "sql": (
                "SELECT c.Name, COUNT(*) AS FailCount FROM Customers c "
                "JOIN Payments p ON c.Id = p.CustomerId WHERE p.Status='Failed' "
                "GROUP BY c.Name HAVING COUNT(*) > 2"
            ),
        },
    },
    {
        "id": "c06",
        "title": "Outstanding Arrears By Customer",
        "difficulty": "Medium",
        "category": "Arrears",
        "description": "Return the total outstanding arrears amount per customer. Columns: Name, Outstanding.",
        "hints": ["Sum Arrears.Amount grouped by customer.", "LEFT JOIN if you want zero-arrears rows too — but the answer here uses a JOIN."],
        "solution": (
            "SELECT c.Name, SUM(a.Amount) AS Outstanding FROM Customers c "
            "JOIN Arrears a ON c.Id = a.CustomerId GROUP BY c.Name"
        ),
        "explanation": "Join Arrears to Customers, sum by customer.",
        "check": {
            "type": "row_set",
            "sql": (
                "SELECT c.Name, SUM(a.Amount) AS Outstanding FROM Customers c "
                "JOIN Arrears a ON c.Id = a.CustomerId GROUP BY c.Name"
            ),
        },
    },
    {
        "id": "c07",
        "title": "Latest Payment Per Customer",
        "difficulty": "Hard",
        "category": "Window Functions",
        "description": "For each customer, return their most recent payment (by CreatedAt). Columns: CustomerId, Id, Amount, Status, CreatedAt.",
        "hints": [
            "Use ROW_NUMBER() OVER (PARTITION BY CustomerId ORDER BY CreatedAt DESC).",
            "Wrap in a CTE and filter rn = 1.",
        ],
        "solution": (
            "WITH ranked AS ( "
            "SELECT p.*, ROW_NUMBER() OVER (PARTITION BY CustomerId ORDER BY CreatedAt DESC) AS rn "
            "FROM Payments p) SELECT CustomerId, Id, Amount, Status, CreatedAt FROM ranked WHERE rn = 1"
        ),
        "explanation": "Window functions rank within a group. Filter rn=1 for the latest per group.",
        "check": {
            "type": "row_set",
            "sql": (
                "WITH ranked AS ( SELECT p.*, ROW_NUMBER() OVER (PARTITION BY CustomerId ORDER BY CreatedAt DESC) AS rn "
                "FROM Payments p) SELECT CustomerId, Id, Amount, Status, CreatedAt FROM ranked WHERE rn = 1"
            ),
        },
    },
    {
        "id": "c08",
        "title": "Failed Then Recovered",
        "difficulty": "Hard",
        "category": "Payments",
        "description": "Find customers who had a Failed payment followed by a Successful one (any date after). Columns: DISTINCT CustomerId.",
        "hints": [
            "Self-join Payments to itself on CustomerId.",
            "Filter earlier row Status='Failed' and later row Status='Successful'.",
        ],
        "solution": (
            "SELECT DISTINCT f.CustomerId FROM Payments f "
            "JOIN Payments s ON f.CustomerId = s.CustomerId "
            "WHERE f.Status='Failed' AND s.Status='Successful' AND s.CreatedAt > f.CreatedAt"
        ),
        "explanation": "Self-join to correlate rows within the same table on the same key.",
        "check": {
            "type": "row_set",
            "sql": (
                "SELECT DISTINCT f.CustomerId FROM Payments f "
                "JOIN Payments s ON f.CustomerId = s.CustomerId "
                "WHERE f.Status='Failed' AND s.Status='Successful' AND s.CreatedAt > f.CreatedAt"
            ),
        },
    },
    {
        "id": "c09",
        "title": "Payment Success Rate",
        "difficulty": "Hard",
        "category": "Payments",
        "description": "Return payment success rate per customer as a percentage rounded to the nearest integer. Columns: Name, SuccessRate.",
        "hints": [
            "Conditional aggregation: SUM(CASE WHEN Status='Successful' THEN 1 ELSE 0 END).",
            "Divide by COUNT(*) and multiply by 100.",
        ],
        "solution": (
            "SELECT c.Name, "
            "CAST(ROUND(100.0 * SUM(CASE WHEN p.Status='Successful' THEN 1 ELSE 0 END) / COUNT(*)) AS INTEGER) AS SuccessRate "
            "FROM Customers c JOIN Payments p ON c.Id = p.CustomerId GROUP BY c.Name"
        ),
        "explanation": "Conditional aggregation lets you compute proportions with a single pass.",
        "check": {
            "type": "row_set",
            "sql": (
                "SELECT c.Name, "
                "CAST(ROUND(100.0 * SUM(CASE WHEN p.Status='Successful' THEN 1 ELSE 0 END) / COUNT(*)) AS INTEGER) AS SuccessRate "
                "FROM Customers c JOIN Payments p ON c.Id = p.CustomerId GROUP BY c.Name"
            ),
        },
    },
    {
        "id": "c10",
        "title": "Successful Payments By Month",
        "difficulty": "Medium",
        "category": "Aggregation",
        "description": "Return the count of successful payments grouped by month (YYYY-MM). Columns: Month, Count.",
        "hints": ["Use SUBSTR(CreatedAt, 1, 7) for the month.", "Filter Status='Successful'."],
        "solution": (
            "SELECT SUBSTR(CreatedAt,1,7) AS Month, COUNT(*) AS Count "
            "FROM Payments WHERE Status='Successful' GROUP BY SUBSTR(CreatedAt,1,7)"
        ),
        "explanation": "SQLite doesn't have full date parts but SUBSTR on ISO dates is enough for month buckets.",
        "check": {
            "type": "row_set",
            "sql": (
                "SELECT SUBSTR(CreatedAt,1,7) AS Month, COUNT(*) AS Count "
                "FROM Payments WHERE Status='Successful' GROUP BY SUBSTR(CreatedAt,1,7)"
            ),
        },
    },
    {
        "id": "c11",
        "title": "Reconciliation Drift",
        "difficulty": "Medium",
        "category": "Reconciliation",
        "description": "Find payments where the recorded Status does not match the ExpectedStatus. Return Id, Status, ExpectedStatus.",
        "hints": [
            "Use a WHERE clause comparing two columns.",
            "Beware NULLs on ExpectedStatus — filter them out if needed.",
        ],
        "solution": (
            "SELECT Id, Status, ExpectedStatus FROM Payments "
            "WHERE ExpectedStatus IS NOT NULL AND Status <> ExpectedStatus"
        ),
        "explanation": "Reconciliation asks: does our record reflect reality? A mismatch means investigation is needed.",
        "check": {
            "type": "row_set",
            "sql": (
                "SELECT Id, Status, ExpectedStatus FROM Payments "
                "WHERE ExpectedStatus IS NOT NULL AND Status <> ExpectedStatus"
            ),
        },
    },
    {
        "id": "c12",
        "title": "Optimize Me — SELECT *",
        "difficulty": "Expert",
        "category": "Optimization",
        "description": (
            "This query returns the same result as `SELECT Id, Amount FROM Payments "
            "WHERE Status='Failed'`. Rewrite it to be efficient: project only what you "
            "need, filter early, and take advantage of the idx_payments_status index."
        ),
        "hints": [
            "SELECT * forces every column to be read — projection matters.",
            "The Status column is indexed (idx_payments_status).",
            "Filter with WHERE Status='Failed' before joining.",
        ],
        "solution": "SELECT Id, Amount FROM Payments WHERE Status = 'Failed'",
        "explanation": (
            "Best practices: (1) project only the columns you need; (2) push filters to "
            "the earliest possible operator; (3) prefer indexed predicates; (4) avoid "
            "SELECT * because it inflates I/O and defeats covering indexes."
        ),
        "check": {"type": "row_set", "sql": "SELECT Id, Amount FROM Payments WHERE Status = 'Failed'"},
    },
]


def public_challenge(c: Dict[str, Any]) -> Dict[str, Any]:
    """Sanitised challenge (no solution, no check) safe to send to the browser."""
    return {
        "id": c["id"],
        "title": c["title"],
        "difficulty": c["difficulty"],
        "category": c["category"],
        "description": c["description"],
        "hintCount": len(c["hints"]),
    }


def public_challenge_full(c: Dict[str, Any]) -> Dict[str, Any]:
    """As above but includes hints (for Learning Mode)."""
    return {**public_challenge(c), "hints": c["hints"]}


def get_challenge(cid: str) -> Dict[str, Any] | None:
    return next((c for c in CHALLENGES if c["id"] == cid), None)


def canonical_rows(rows: list[list]) -> list[tuple]:
    """Normalise result rows for order-insensitive comparison."""
    def norm(v):
        if isinstance(v, float):
            return round(v, 4)
        return v
    return sorted(tuple(norm(v) for v in r) for r in rows)


def evaluate(challenge: Dict[str, Any], user_columns: list[str], user_rows: list[list]) -> Dict[str, Any]:
    """Compares row-sets. Column-name order is checked for shape only.

    Returns a dict with {correct, reason?, expected_row_count, user_row_count}
    but never leaks the expected result set values.
    """
    from app.application.sql_arena import SqlArenaService  # local import to avoid cycles
    return {}  # replaced below by evaluator injected in the router; kept for typing.
