"""Iteration-3 supplementary tests: event persistence, terminal guards, regressions."""
import os
import time

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE = base_url.rstrip("/") + "/api"
PS = BASE + "/payment-simulator"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _create(client, scenario="Success", **over):
    body = {
        "customerId": "TEST_DEMO-3001",
        "amount": 120.0,
        "currency": "GBP",
        "paymentMethod": "DirectDebit",
        "scenario": scenario,
    }
    body.update(over)
    r = client.post(f"{PS}/payments", json=body)
    assert r.status_code == 201, r.text
    return r.json()


def _run_to_terminal(client, pid, timeout=6.0):
    r = client.post(f"{PS}/payments/{pid}/process")
    assert r.status_code == 200, r.text
    deadline = time.time() + timeout
    last = None
    while time.time() < deadline:
        g = client.get(f"{PS}/payments/{pid}")
        assert g.status_code == 200
        last = g.json()
        if last["status"] in ("Settled", "Failed", "TimedOut"):
            return last
        time.sleep(0.3)
    pytest.fail(f"did not reach terminal in {timeout}s, last status={last and last['status']}")


# --- Scenarios endpoint contract -------------------------------------------
def test_scenarios_contract(client):
    r = client.get(f"{PS}/scenarios")
    assert r.status_code == 200
    d = r.json()
    assert d["paymentMethods"] == ["DirectDebit", "Card", "BankTransfer"]
    assert d["scenarios"] == ["Success", "Failure", "Timeout", "MandateFailure", "InsufficientFunds"]
    assert len(d["steps"]) == 7 and d["steps"][-1] == "Settlement"


# --- Create contract -------------------------------------------------------
def test_create_contract_and_no_mongo_id(client):
    sim = _create(client)
    assert sim["id"].startswith("PAY-DEMO-")
    assert sim["status"] == "Created"
    assert sim["current_step"] == "Request"
    assert len(sim["events"]) == 1
    assert "_id" not in sim


# --- Event history persists across re-GETs ---------------------------------
def test_event_history_persists_on_re_get(client):
    sim = _create(client, scenario="Success")
    final = _run_to_terminal(client, sim["id"])
    assert final["status"] == "Settled"
    assert final["processing_ms"] > 0
    types = [e["event_type"] for e in final["events"]]
    assert "SettlementCreated" in types
    n = len(final["events"])
    assert n >= 6, types
    # Re-GET twice — history must be identical and stable
    for _ in range(2):
        again = client.get(f"{PS}/payments/{sim['id']}").json()
        assert len(again["events"]) == n
        assert [e["event_type"] for e in again["events"]] == types
        assert again["status"] == "Settled"


def test_failure_scenario_no_settlement_event(client):
    sim = _create(client, scenario="Failure")
    final = _run_to_terminal(client, sim["id"])
    assert final["status"] == "Failed"
    assert final["failure_reason"] == "Processor declined the payment"
    assert final["retry_available"] is False
    types = [e["event_type"] for e in final["events"]]
    assert "SettlementCreated" not in types


def test_timeout_scenario(client):
    sim = _create(client, scenario="Timeout")
    final = _run_to_terminal(client, sim["id"])
    assert final["status"] == "TimedOut"
    assert final["retry_available"] is True
    assert "ProcessingTimedOut" in [e["event_type"] for e in final["events"]]


def test_mandate_failure_no_processing_started(client):
    sim = _create(client, scenario="MandateFailure")
    final = _run_to_terminal(client, sim["id"])
    assert final["status"] == "Failed"
    assert final["failure_reason"] == "Mandate inactive or missing"
    types = [e["event_type"] for e in final["events"]]
    assert "ProcessingStarted" not in types


def test_insufficient_funds_retry_scheduled(client):
    sim = _create(client, scenario="InsufficientFunds")
    final = _run_to_terminal(client, sim["id"])
    assert final["status"] == "Failed"
    assert final["retry_available"] is True
    assert "RetryScheduled" in [e["event_type"] for e in final["events"]]


# --- Guards ---------------------------------------------------------------
def test_second_process_after_terminal_returns_422(client):
    sim = _create(client)
    _run_to_terminal(client, sim["id"])
    r = client.post(f"{PS}/payments/{sim['id']}/process")
    assert r.status_code == 422, r.text
    assert r.json().get("code") == "invalid_state"


def test_reset_then_reprocess_works(client):
    sim = _create(client)
    _run_to_terminal(client, sim["id"])
    r = client.post(f"{PS}/payments/{sim['id']}/reset")
    assert r.status_code == 200
    d = r.json()
    assert d["status"] == "Created" and len(d["events"]) == 1
    assert d["failure_reason"] is None and d["retry_available"] is False
    # Reset must be persisted
    g = client.get(f"{PS}/payments/{sim['id']}").json()
    assert g["status"] == "Created" and len(g["events"]) == 1
    # Should be re-processable
    final = _run_to_terminal(client, sim["id"])
    assert final["status"] == "Settled"


def test_process_nonexistent_returns_404(client):
    r = client.post(f"{PS}/payments/does-not-exist/process")
    assert r.status_code == 404, r.text
    assert r.json().get("code") == "payment_not_found"


def test_get_nonexistent_404_shape(client):
    r = client.get(f"{PS}/payments/does-not-exist")
    assert r.status_code == 404
    body = r.json()
    assert body.get("ok") is False and body.get("code") == "payment_not_found"


@pytest.mark.parametrize(
    "payload",
    [
        {"amount": 120, "currency": "GBP", "paymentMethod": "DirectDebit", "scenario": "Success"},
        {"customerId": "T", "amount": 0, "currency": "GBP", "paymentMethod": "DirectDebit", "scenario": "Success"},
        {"customerId": "T", "amount": -5, "currency": "GBP", "paymentMethod": "DirectDebit", "scenario": "Success"},
        {"customerId": "T", "amount": 5, "currency": "", "paymentMethod": "DirectDebit", "scenario": "Success"},
        {"customerId": "T", "amount": 5, "currency": "GBP", "paymentMethod": "Crypto", "scenario": "Success"},
        {"customerId": "T", "amount": 5, "currency": "GBP", "paymentMethod": "DirectDebit", "scenario": "Rebate"},
    ],
)
def test_validation_422(client, payload):
    r = client.post(f"{PS}/payments", json=payload)
    assert r.status_code == 422, f"{payload} -> {r.status_code} {r.text[:200]}"


def test_list_limit(client):
    r = client.get(f"{PS}/payments", params={"limit": 5})
    assert r.status_code == 200
    d = r.json()
    assert isinstance(d, list) and len(d) <= 5


# --- Phase 1-4 regression smoke -------------------------------------------
@pytest.mark.parametrize(
    "path",
    ["/health", "/profile", "/experience", "/skills", "/projects", "/projects/safesend-sdk"],
)
def test_existing_get_endpoints(client, path):
    r = client.get(BASE + path)
    assert r.status_code == 200, f"{path} -> {r.status_code}"
    assert r.json() is not None


def test_contact_still_works(client):
    r = client.post(
        BASE + "/contact",
        json={
            "name": "TEST_QA Iter3",
            "email": "qa.iter3@example.com",
            "subject": "TEST_regression",
            "message": "Regression smoke from iteration 3 testing agent.",
        },
    )
    assert r.status_code in (200, 201), r.text
