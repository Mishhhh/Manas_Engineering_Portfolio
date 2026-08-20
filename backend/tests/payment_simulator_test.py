"""Phase 5 — Payment simulator regression tests.

Exercises: create, all 5 scenarios end-to-end, validation errors, 404, reset,
state-machine terminal invariants, and event history persistence.

Uses the external REACT_APP_BACKEND_URL if set (matches the platform contract),
otherwise localhost:8001.
"""
import os
import time
from pathlib import Path

import httpx
import pytest

# Prefer the external URL from frontend/.env so we go through the ingress.
_FRONTEND_ENV = Path(__file__).resolve().parents[2] / "frontend" / ".env"
BACKEND_URL = ""
if _FRONTEND_ENV.exists():
    for line in _FRONTEND_ENV.read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            BACKEND_URL = line.split("=", 1)[1].strip().strip('"')
            break
BACKEND_URL = BACKEND_URL or "http://localhost:8001"
API = f"{BACKEND_URL}/api/payment-simulator"

TERMINAL_STATUSES = {"Settled", "Failed", "TimedOut"}


def _poll_until_terminal(client: httpx.Client, pid: str, timeout: float = 6.0) -> dict:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        r = client.get(f"{API}/payments/{pid}")
        assert r.status_code == 200, r.text
        body = r.json()
        if body["status"] in TERMINAL_STATUSES:
            return body
        time.sleep(0.25)
    raise AssertionError(f"payment {pid} never reached terminal state; last={body!r}")


def _create_and_process(client, scenario: str, **overrides) -> dict:
    payload = {
        "customerId": "DEMO-1001",
        "amount": 120.0,
        "currency": "GBP",
        "paymentMethod": "DirectDebit",
        "scenario": scenario,
        **overrides,
    }
    r = client.post(f"{API}/payments", json=payload)
    assert r.status_code == 201, r.text
    sim = r.json()
    assert sim["status"] == "Created"
    assert sim["current_step"] == "Request"
    assert sim["id"].startswith("PAY-DEMO-")
    assert len(sim["events"]) == 1  # PaymentCreated

    r = client.post(f"{API}/payments/{sim['id']}/process")
    assert r.status_code == 200, r.text

    return _poll_until_terminal(client, sim["id"])


# ---------------------------------------------------------------- happy paths
def test_scenario_success_settles():
    with httpx.Client(timeout=15) as c:
        sim = _create_and_process(c, "Success")
        assert sim["status"] == "Settled"
        assert sim["current_step"] == "Settlement"
        assert sim["failure_reason"] is None
        assert sim["processing_ms"] > 0
        # Event order sanity
        types = [e["event_type"] for e in sim["events"]]
        assert "SettlementCreated" in types
        assert types.index("ValidationSucceeded") < types.index("MandateCheckSucceeded") < types.index("ProcessingSucceeded") < types.index("SettlementCreated")


def test_scenario_failure_terminal_failed():
    with httpx.Client(timeout=15) as c:
        sim = _create_and_process(c, "Failure")
        assert sim["status"] == "Failed"
        assert sim["failure_reason"] == "Processor declined the payment"
        assert sim["retry_available"] is False
        assert "SettlementCreated" not in [e["event_type"] for e in sim["events"]]


def test_scenario_timeout_terminal_timedout_retryable():
    with httpx.Client(timeout=15) as c:
        sim = _create_and_process(c, "Timeout")
        assert sim["status"] == "TimedOut"
        assert sim["retry_available"] is True
        types = [e["event_type"] for e in sim["events"]]
        assert "ProcessingTimedOut" in types


def test_scenario_mandate_failure_no_processing():
    with httpx.Client(timeout=15) as c:
        sim = _create_and_process(c, "MandateFailure")
        assert sim["status"] == "Failed"
        assert sim["failure_reason"] == "Mandate inactive or missing"
        types = [e["event_type"] for e in sim["events"]]
        assert "MandateCheckFailed" in types
        assert "ProcessingStarted" not in types  # never entered processing


def test_scenario_insufficient_funds_flags_retry():
    with httpx.Client(timeout=15) as c:
        sim = _create_and_process(c, "InsufficientFunds")
        assert sim["status"] == "Failed"
        assert "Insufficient" in sim["failure_reason"]
        assert sim["retry_available"] is True
        types = [e["event_type"] for e in sim["events"]]
        assert "RetryScheduled" in types


# ---------------------------------------------------------------- validation
def test_missing_customer_id_returns_422():
    with httpx.Client(timeout=15) as c:
        r = c.post(
            f"{API}/payments",
            json={
                "customerId": "",
                "amount": 10,
                "currency": "GBP",
                "paymentMethod": "DirectDebit",
                "scenario": "Success",
            },
        )
        assert r.status_code == 422, r.text


def test_negative_amount_returns_422():
    with httpx.Client(timeout=15) as c:
        r = c.post(
            f"{API}/payments",
            json={
                "customerId": "C1",
                "amount": -5,
                "currency": "GBP",
                "paymentMethod": "DirectDebit",
                "scenario": "Success",
            },
        )
        assert r.status_code == 422, r.text


def test_zero_amount_returns_422():
    with httpx.Client(timeout=15) as c:
        r = c.post(
            f"{API}/payments",
            json={
                "customerId": "C1",
                "amount": 0,
                "currency": "GBP",
                "paymentMethod": "DirectDebit",
                "scenario": "Success",
            },
        )
        assert r.status_code == 422, r.text


def test_invalid_payment_method_returns_422():
    with httpx.Client(timeout=15) as c:
        r = c.post(
            f"{API}/payments",
            json={
                "customerId": "C1",
                "amount": 10,
                "currency": "GBP",
                "paymentMethod": "Crypto",
                "scenario": "Success",
            },
        )
        assert r.status_code == 422, r.text


def test_invalid_scenario_returns_422():
    with httpx.Client(timeout=15) as c:
        r = c.post(
            f"{API}/payments",
            json={
                "customerId": "C1",
                "amount": 10,
                "currency": "GBP",
                "paymentMethod": "DirectDebit",
                "scenario": "Rebate",
            },
        )
        assert r.status_code == 422, r.text


def test_missing_currency_returns_422():
    with httpx.Client(timeout=15) as c:
        r = c.post(
            f"{API}/payments",
            json={
                "customerId": "C1",
                "amount": 10,
                "currency": "",
                "paymentMethod": "DirectDebit",
                "scenario": "Success",
            },
        )
        assert r.status_code == 422, r.text


# ---------------------------------------------------------------- 404 + reset
def test_get_nonexistent_returns_404():
    with httpx.Client(timeout=15) as c:
        r = c.get(f"{API}/payments/nope")
        assert r.status_code == 404
        body = r.json()
        assert body["ok"] is False
        assert body["code"] == "payment_not_found"


def test_reset_after_terminal_returns_to_created():
    with httpx.Client(timeout=15) as c:
        sim = _create_and_process(c, "Failure")
        assert sim["status"] == "Failed"
        r = c.post(f"{API}/payments/{sim['id']}/reset")
        assert r.status_code == 200, r.text
        after = r.json()
        assert after["status"] == "Created"
        assert after["current_step"] == "Request"
        assert after["failure_reason"] is None
        assert len(after["events"]) == 1


def test_double_process_rejects_with_illegal_state():
    with httpx.Client(timeout=15) as c:
        # Create + process + wait for terminal, then try to process again → 422.
        payload = {
            "customerId": "C-X",
            "amount": 42,
            "currency": "GBP",
            "paymentMethod": "Card",
            "scenario": "Success",
        }
        r = c.post(f"{API}/payments", json=payload)
        assert r.status_code == 201
        pid = r.json()["id"]
        c.post(f"{API}/payments/{pid}/process")
        _poll_until_terminal(c, pid)
        r = c.post(f"{API}/payments/{pid}/process")
        assert r.status_code == 422, r.text
        body = r.json()
        assert body["code"] == "invalid_state"


# ---------------------------------------------------------------- discovery
def test_scenarios_endpoint_lists_options():
    with httpx.Client(timeout=15) as c:
        r = c.get(f"{API}/scenarios")
        assert r.status_code == 200
        body = r.json()
        assert set(body["paymentMethods"]) == {"DirectDebit", "Card", "BankTransfer"}
        assert set(body["scenarios"]) == {
            "Success", "Failure", "Timeout", "MandateFailure", "InsufficientFunds",
        }
        assert body["steps"][0] == "Request"
        assert body["steps"][-1] == "Settlement"


def test_list_payments_returns_recent():
    with httpx.Client(timeout=15) as c:
        r = c.get(f"{API}/payments?limit=5")
        assert r.status_code == 200
        body = r.json()
        assert isinstance(body, list)
        # We've created many in previous tests so this should be non-empty.
        assert len(body) >= 1
