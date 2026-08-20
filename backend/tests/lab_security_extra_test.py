"""Iteration 5 — extra SQL Arena security / hardening tests through ingress."""
from pathlib import Path
import httpx
import pytest

_FRONTEND_ENV = Path(__file__).resolve().parents[2] / "frontend" / ".env"
BACKEND_URL = ""
for line in _FRONTEND_ENV.read_text().splitlines():
    if line.startswith("REACT_APP_BACKEND_URL="):
        BACKEND_URL = line.split("=", 1)[1].strip().strip('"')
        break
assert BACKEND_URL, "REACT_APP_BACKEND_URL missing"
API = f"{BACKEND_URL}/api"

MALICIOUS = [
    "DrOp TaBlE Payments",
    "dElEtE FROM Payments",
    "ATTACH DATABASE '/tmp/x.db' AS x",
    "VACUUM",
    "SELECT * FROM Payments;\nDROP TABLE Payments",
    "SELECT * FROM Payments /* comment */ WHERE 1=1",
    "WITH x AS (SELECT 1) DELETE FROM Payments",
    "REPLACE INTO Payments VALUES (1)",
    "SELECT load_extension('evil')",
    "  ;DROP TABLE Payments",
    "SELECT 1 -- ; DROP TABLE Payments",
    "INSERT INTO Payments (Id) VALUES ('x')",
    "UPDATE Payments SET Status='Settled'",
    "TRUNCATE TABLE Payments",
    "CREATE TABLE evil (a int)",
    "PRAGMA table_info(Payments)",
    "ALTER TABLE Payments ADD COLUMN x int",
]


@pytest.mark.parametrize("q", MALICIOUS)
def test_malicious_queries_rejected(q):
    with httpx.Client(timeout=20) as c:
        r = c.post(f"{API}/sql-arena/execute", json={"sql": q})
        assert r.status_code in (200, 400), r.text
        if r.status_code == 200:
            body = r.json()
            assert body.get("ok") is False, f"query allowed: {q} -> {body}"
            assert body.get("error"), body


@pytest.mark.parametrize("q", ["DROP TABLE Payments", "DELETE FROM Payments"])
def test_malicious_submit_rejected(q):
    with httpx.Client(timeout=20) as c:
        r = c.post(f"{API}/sql-arena/challenges/c01/submit", json={"sql": q})
        assert r.status_code == 200, r.text
        assert r.json()["correct"] is False


def test_data_intact_after_attack_attempts():
    with httpx.Client(timeout=20) as c:
        r = c.post(f"{API}/sql-arena/execute", json={"sql": "SELECT COUNT(*) AS n FROM Payments"})
        assert r.status_code == 200
        body = r.json()
        assert body["ok"] is True, body
        assert body["rows"][0][0] > 0


def test_schema_six_tables_with_columns():
    with httpx.Client(timeout=20) as c:
        r = c.get(f"{API}/sql-arena/schema")
        assert r.status_code == 200
        tables = r.json()
        names = {t["name"] for t in tables}
        assert names == {"Customers", "Subscriptions", "Mandates", "Payments", "PaymentAttempts", "Arrears"}
        for t in tables:
            assert len(t["columns"]) > 0


def test_challenges_hide_answers():
    with httpx.Client(timeout=20) as c:
        r = c.get(f"{API}/sql-arena/challenges")
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 12
        for it in items:
            assert "solution" not in it and "check" not in it, it


def test_health_reports_v040():
    with httpx.Client(timeout=20) as c:
        r = c.get(f"{API}/health")
        assert r.status_code == 200
        assert r.json().get("version") == "0.4.0", r.json()


# --- retry engine / arrears spec checks from the review request ---------------
def test_retry_spec_exponential_delays():
    payload = {
        "policy": {"max_attempts": 4, "initial_delay_ms": 5000, "backoff_multiplier": 2.0,
                   "max_delay_ms": 60000, "strategy": "Exponential"},
        "success_at_attempt": 4,
    }
    with httpx.Client(timeout=20) as c:
        r = c.post(f"{API}/retry-engine/simulate", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["outcome"] == "Success"
        assert [a["delay_before_ms"] for a in d["attempts"]] == [0, 5000, 10000, 20000]
        assert len({a["request_id"] for a in d["attempts"]}) == 1


def test_retry_spec_gaveup_and_permanent():
    with httpx.Client(timeout=20) as c:
        pol = {"max_attempts": 4, "initial_delay_ms": 5000, "backoff_multiplier": 2.0,
               "max_delay_ms": 60000, "strategy": "Exponential"}
        r = c.post(f"{API}/retry-engine/simulate", json={"policy": pol, "success_at_attempt": 0})
        assert r.json()["outcome"] == "GaveUp" and r.json()["exhausted"] is True
        r2 = c.post(f"{API}/retry-engine/simulate", json={"policy": pol, "success_at_attempt": -1})
        assert r2.json()["outcome"] == "PermanentFailure" and len(r2.json()["attempts"]) == 1


def test_arrears_spec_states():
    with httpx.Client(timeout=20) as c:
        pol = {"max_attempts": 3, "initial_delay_ms": 5000, "backoff_multiplier": 2.0,
               "max_delay_ms": 60000, "strategy": "Exponential"}
        base = {"subscription_amount": 12.99, "currency": "GBP", "retry_policy": pol}
        r = c.post(f"{API}/arrears/simulate", json={**base, "attempts": ["Fail", "Fail", "Fail"]})
        d = r.json()
        assert d["final_state"] == "InArrears" and d["arrears_amount"] == 12.99 and d["total_missed_cycles"] == 1
        r = c.post(f"{API}/arrears/simulate", json={**base, "attempts": ["Fail", "Fail", "Success"]})
        assert r.json()["final_state"] == "Recovered"
        r = c.post(f"{API}/arrears/simulate", json={**base, "attempts": ["Fail"] * 6})
        assert r.json()["total_missed_cycles"] == 2
