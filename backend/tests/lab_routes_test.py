"""Phase 6-8 backend tests — retry engine, arrears simulator, SQL arena."""
import os
from pathlib import Path
import httpx
import pytest

_FRONTEND_ENV = Path(__file__).resolve().parents[2] / "frontend" / ".env"
BACKEND_URL = ""
if _FRONTEND_ENV.exists():
    for line in _FRONTEND_ENV.read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            BACKEND_URL = line.split("=", 1)[1].strip().strip('"')
            break
BACKEND_URL = BACKEND_URL or "http://localhost:8001"
API = f"{BACKEND_URL}/api"


# ============================================================
# Phase 6 — Retry Engine
# ============================================================
def _policy(**overrides):
    p = {"max_attempts": 4, "initial_delay_ms": 5000, "backoff_multiplier": 2.0, "max_delay_ms": 60000, "strategy": "Exponential"}
    p.update(overrides)
    return p


def test_retry_success_first_attempt():
    with httpx.Client(timeout=15) as c:
        r = c.post(f"{API}/retry-engine/simulate", json={"policy": _policy(), "success_at_attempt": 1, "request_id": "REQ-1"})
        assert r.status_code == 200
        d = r.json()
        assert d["outcome"] == "Success"
        assert len(d["attempts"]) == 1
        assert d["total_duration_ms"] == 0
        assert d["attempts"][0]["request_id"] == "REQ-1"


def test_retry_success_after_retries_exponential_delay():
    with httpx.Client(timeout=15) as c:
        r = c.post(f"{API}/retry-engine/simulate", json={"policy": _policy(), "success_at_attempt": 4})
        d = r.json()
        assert d["outcome"] == "Success"
        assert len(d["attempts"]) == 4
        assert [a["delay_before_ms"] for a in d["attempts"]] == [0, 5000, 10000, 20000]
        assert [a["status"] for a in d["attempts"]] == ["Failed", "Failed", "Failed", "Success"]


def test_retry_all_fail_gives_up_at_max_attempts():
    with httpx.Client(timeout=15) as c:
        r = c.post(f"{API}/retry-engine/simulate", json={"policy": _policy(max_attempts=3), "success_at_attempt": 0})
        d = r.json()
        assert d["outcome"] == "GaveUp"
        assert d["exhausted"] is True
        assert len(d["attempts"]) == 3
        assert all(a["status"] == "Failed" for a in d["attempts"])


def test_retry_max_delay_caps_backoff():
    with httpx.Client(timeout=15) as c:
        r = c.post(f"{API}/retry-engine/simulate", json={
            "policy": _policy(max_attempts=5, initial_delay_ms=10000, backoff_multiplier=3.0, max_delay_ms=15000),
            "success_at_attempt": 5,
        })
        d = r.json()
        # attempt2 delay=10000, attempt3=30000 capped to 15000, attempt4=15000, attempt5=15000
        assert [a["delay_before_ms"] for a in d["attempts"]] == [0, 10000, 15000, 15000, 15000]


def test_retry_fixed_strategy():
    with httpx.Client(timeout=15) as c:
        r = c.post(f"{API}/retry-engine/simulate", json={
            "policy": _policy(max_attempts=3, initial_delay_ms=7000, backoff_multiplier=5.0, max_delay_ms=999999, strategy="Fixed"),
            "success_at_attempt": 3,
        })
        d = r.json()
        assert [a["delay_before_ms"] for a in d["attempts"]] == [0, 7000, 7000]


def test_retry_permanent_failure_short_circuits():
    with httpx.Client(timeout=15) as c:
        r = c.post(f"{API}/retry-engine/simulate", json={"policy": _policy(), "success_at_attempt": -1})
        d = r.json()
        assert d["outcome"] == "PermanentFailure"
        assert len(d["attempts"]) == 1
        assert d["attempts"][0]["status"] == "PermanentFailure"


def test_retry_idempotency_key_preserved_across_attempts():
    with httpx.Client(timeout=15) as c:
        r = c.post(f"{API}/retry-engine/simulate", json={"policy": _policy(), "success_at_attempt": 3, "request_id": "REQ-IDEMP-42"})
        d = r.json()
        assert all(a["request_id"] == "REQ-IDEMP-42" for a in d["attempts"])
        assert d["idempotent"] is True


# ============================================================
# Phase 7 — Arrears Simulator
# ============================================================
def _arr_req(attempts, **over):
    body = {
        "subscription_amount": 12.99,
        "currency": "GBP",
        "attempts": attempts,
        "retry_policy": _policy(max_attempts=3, initial_delay_ms=5000, backoff_multiplier=2.0, max_delay_ms=60000),
    }
    body.update(over)
    return body


def test_arrears_successful_first_payment():
    with httpx.Client(timeout=15) as c:
        r = c.post(f"{API}/arrears/simulate", json=_arr_req(["Success"]))
        d = r.json()
        assert d["final_state"] == "Recovered"
        assert d["arrears_amount"] == 0
        assert d["outstanding_balance"] == 0
        assert d["payments_recovered"] == 1


def test_arrears_fail_then_recover():
    with httpx.Client(timeout=15) as c:
        r = c.post(f"{API}/arrears/simulate", json=_arr_req(["Fail", "Fail", "Success"]))
        d = r.json()
        assert d["final_state"] == "Recovered"
        assert d["retry_count"] == 2
        assert d["payments_recovered"] == 1


def test_arrears_creates_after_exhausted_retries():
    with httpx.Client(timeout=15) as c:
        r = c.post(f"{API}/arrears/simulate", json=_arr_req(["Fail", "Fail", "Fail"]))
        d = r.json()
        assert d["final_state"] == "InArrears"
        assert d["arrears_amount"] == 12.99
        assert d["total_missed_cycles"] == 1


def test_arrears_partial_recovery():
    with httpx.Client(timeout=15) as c:
        r = c.post(f"{API}/arrears/simulate", json=_arr_req(["Fail", "Fail", "Fail", "Success"]))
        d = r.json()
        # After the arrears escalation, a subsequent Success cleans up the debt.
        assert d["payments_recovered"] == 1
        assert d["retry_count"] == 3


def test_arrears_multiple_missed_cycles():
    with httpx.Client(timeout=15) as c:
        r = c.post(f"{API}/arrears/simulate", json=_arr_req(["Fail"] * 6))  # 2 full cycles fail
        d = r.json()
        assert d["total_missed_cycles"] == 2
        assert d["arrears_amount"] > 0


def test_arrears_validation_amount():
    with httpx.Client(timeout=15) as c:
        r = c.post(f"{API}/arrears/simulate", json=_arr_req(["Success"], subscription_amount=0))
        assert r.status_code == 422


# ============================================================
# Phase 8 — SQL Arena
# ============================================================
def test_sql_schema_shape():
    with httpx.Client(timeout=15) as c:
        r = c.get(f"{API}/sql-arena/schema")
        assert r.status_code == 200
        names = {t["name"] for t in r.json()}
        assert names == {"Customers", "Subscriptions", "Mandates", "Payments", "PaymentAttempts", "Arrears"}


def test_sql_list_challenges_public_shape():
    with httpx.Client(timeout=15) as c:
        r = c.get(f"{API}/sql-arena/challenges")
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 12
        for it in items:
            # Solution must not leak.
            assert "solution" not in it
            assert "check" not in it
            assert set(it) >= {"id", "title", "difficulty", "category", "description", "hintCount"}


def test_sql_execute_valid_select():
    with httpx.Client(timeout=15) as c:
        r = c.post(f"{API}/sql-arena/execute", json={"sql": "SELECT COUNT(*) AS n FROM Payments"})
        d = r.json()
        assert d["ok"] is True
        assert d["columns"] == ["n"]
        assert d["rows"][0][0] >= 1


def test_sql_execute_with_cte_allowed():
    with httpx.Client(timeout=15) as c:
        sql = "WITH x AS (SELECT * FROM Payments WHERE Status='Failed') SELECT COUNT(*) FROM x"
        r = c.post(f"{API}/sql-arena/execute", json={"sql": sql})
        assert r.json()["ok"] is True


@pytest.mark.parametrize("bad", [
    "DROP TABLE Payments",
    "DELETE FROM Payments",
    "UPDATE Payments SET Status='X'",
    "INSERT INTO Payments (Id) VALUES (99)",
    "ALTER TABLE Payments ADD COLUMN X TEXT",
    "TRUNCATE TABLE Payments",
    "CREATE TABLE Evil(x INT)",
    "PRAGMA schema.query_only=0",
])
def test_sql_execute_blocks_destructive(bad):
    with httpx.Client(timeout=15) as c:
        d = c.post(f"{API}/sql-arena/execute", json={"sql": bad}).json()
        assert d["ok"] is False, bad
        assert "SELECT" in d["error"] or "read-only" in d["error"] or "blocked" in d["error"] or "not allowed" in d["error"]


def test_sql_execute_blocks_multiple_statements():
    with httpx.Client(timeout=15) as c:
        d = c.post(f"{API}/sql-arena/execute", json={"sql": "SELECT 1; SELECT 2"}).json()
        assert d["ok"] is False
        assert "single" in d["error"]


def test_sql_execute_blocks_comment_bypass():
    with httpx.Client(timeout=15) as c:
        d = c.post(f"{API}/sql-arena/execute", json={"sql": "SELECT 1 -- ; DROP TABLE Payments"}).json()
        assert d["ok"] is False
        assert "comment" in d["error"].lower()


def test_sql_execute_blocks_block_comment_bypass():
    with httpx.Client(timeout=15) as c:
        d = c.post(f"{API}/sql-arena/execute", json={"sql": "SELECT /* hi */ 1"}).json()
        assert d["ok"] is False


def test_sql_syntax_error_friendly():
    with httpx.Client(timeout=15) as c:
        d = c.post(f"{API}/sql-arena/execute", json={"sql": "SELECT WHERE Payments"}).json()
        assert d["ok"] is False
        assert d["error"].lower().startswith("sql error")


def test_sql_submit_correct_solution():
    with httpx.Client(timeout=15) as c:
        r = c.post(f"{API}/sql-arena/challenges/c01/submit", json={"sql": "SELECT * FROM Payments WHERE Status = 'Failed'"})
        d = r.json()
        assert d["correct"] is True


def test_sql_submit_wrong_result():
    with httpx.Client(timeout=15) as c:
        d = c.post(f"{API}/sql-arena/challenges/c01/submit", json={"sql": "SELECT * FROM Payments WHERE Status = 'Successful'"}).json()
        assert d["correct"] is False
        assert d["expected_row_count"] != d["user_row_count"] or d["reason"] == "row-set mismatch"


def test_sql_submit_destructive_rejected():
    with httpx.Client(timeout=15) as c:
        d = c.post(f"{API}/sql-arena/challenges/c01/submit", json={"sql": "DROP TABLE Payments"}).json()
        assert d["correct"] is False


def test_sql_hints_endpoint():
    with httpx.Client(timeout=15) as c:
        r = c.get(f"{API}/sql-arena/challenges/c01/hint", params={"index": 0})
        assert r.status_code == 200
        assert "hint" in r.json()
        r2 = c.get(f"{API}/sql-arena/challenges/c01/hint", params={"index": 99})
        assert r2.status_code == 400


def test_sql_solution_endpoint():
    with httpx.Client(timeout=15) as c:
        r = c.get(f"{API}/sql-arena/challenges/c01/solution")
        assert r.status_code == 200
        assert "SELECT" in r.json()["solution"]


def test_sql_unknown_challenge_404():
    with httpx.Client(timeout=15) as c:
        r = c.get(f"{API}/sql-arena/challenges/nope")
        assert r.status_code == 404


# ============================================================
# Regression — Phase 1-5 quick smoke
# ============================================================
def test_regression_health_and_profile_still_work():
    with httpx.Client(timeout=15) as c:
        assert c.get(f"{API}/health").status_code == 200
        assert c.get(f"{API}/profile").status_code == 200
        assert c.get(f"{API}/payment-simulator/scenarios").status_code == 200
