"""Focused security + engine checks for Phase 6/7/8 lab routes (curl-equivalent)."""
import os
import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- SQL Arena security guard ---
class TestSqlArenaSecurity:
    def test_drop_table_blocked(self, client):
        r = client.post(f"{BASE_URL}/api/sql-arena/execute", json={"sql": "DROP TABLE Payments"}, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is False
        assert d["error"]

    def test_multi_statement_blocked(self, client):
        r = client.post(f"{BASE_URL}/api/sql-arena/execute", json={"sql": "SELECT 1; SELECT 2"}, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is False
        assert "single" in (d["error"] or "").lower()

    def test_comment_blocked(self, client):
        r = client.post(f"{BASE_URL}/api/sql-arena/execute", json={"sql": "SELECT 1 -- ; DROP"}, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is False
        assert "comment" in (d["error"] or "").lower()

    def test_valid_select_ok(self, client):
        r = client.post(f"{BASE_URL}/api/sql-arena/execute",
                        json={"sql": "SELECT * FROM Payments WHERE Status = 'Failed'"}, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is True
        assert d["rowCount"] > 0

    def test_schema_has_six_tables(self, client):
        r = client.get(f"{BASE_URL}/api/sql-arena/schema", timeout=30)
        assert r.status_code == 200
        assert len(r.json()) == 6

    def test_challenges_at_least_12(self, client):
        r = client.get(f"{BASE_URL}/api/sql-arena/challenges", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 12
        assert all("solution" not in c for c in data), "solution leaked in list endpoint"

    def test_submit_c01_correct(self, client):
        r = client.post(f"{BASE_URL}/api/sql-arena/challenges/c01/submit",
                        json={"sql": "SELECT * FROM Payments WHERE Status = 'Failed'"}, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["correct"] is True, d

    def test_submit_unknown_challenge_404(self, client):
        r = client.post(f"{BASE_URL}/api/sql-arena/challenges/zzz/submit",
                        json={"sql": "SELECT 1"}, timeout=30)
        assert r.status_code == 404


# --- Retry engine ---
class TestRetryEngine:
    def test_simulate_success_at_4(self, client):
        payload = {
            "policy": {"max_attempts": 4, "initial_delay_ms": 5000,
                       "backoff_multiplier": 2, "max_delay_ms": 60000},
            "success_at_attempt": 4,
        }
        r = client.post(f"{BASE_URL}/api/retry-engine/simulate", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["outcome"] == "Success", d
        delays = [a["delay_before_ms"] for a in d["attempts"]]
        assert delays == [0, 5000, 10000, 20000], delays

    def test_preset_policies(self, client):
        r = client.get(f"{BASE_URL}/api/retry-engine/preset-policies", timeout=30)
        assert r.status_code == 200
        assert "recommended" in r.json()


# --- Arrears ---
class TestArrears:
    def test_simulate_in_arrears(self, client):
        payload = {
            "subscription_amount": 12.99,
            "currency": "GBP",
            "attempts": ["Fail", "Fail", "Fail"],
            "retry_policy": {"max_attempts": 3, "initial_delay_ms": 5000,
                             "backoff_multiplier": 2, "max_delay_ms": 60000},
        }
        r = client.post(f"{BASE_URL}/api/arrears/simulate", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["final_state"] == "InArrears", d
        assert d["arrears_amount"] == 12.99, d
