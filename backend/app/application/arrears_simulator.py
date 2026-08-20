"""Subscription Arrears Simulator — pure business logic.

Models a fictional monthly-billed subscription. Given an initial amount,
retry policy and a scripted list of payment outcomes, computes the state
transitions and outstanding balance.
"""
from __future__ import annotations
from datetime import datetime, timezone, timedelta
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

from app.application.retry_engine import RetryPolicy


class SubscriptionState(str, Enum):
    ACTIVE = "Active"
    PAYMENT_DUE = "PaymentDue"
    PAYMENT_FAILED = "PaymentFailed"
    RETRYING = "Retrying"
    IN_ARREARS = "InArrears"
    RECOVERED = "Recovered"
    CANCELLED = "Cancelled"


class PaymentOutcome(str, Enum):
    SUCCESS = "Success"
    FAIL = "Fail"


class ArrearsRequest(BaseModel):
    subscription_amount: float = Field(..., gt=0)
    currency: str = Field(default="GBP", min_length=3, max_length=3)
    # ISO date; will be normalized. If missing, uses now.
    payment_due_date: Optional[str] = None
    # Sequence of scripted attempts across multiple billing cycles.
    # Each entry is a single attempt outcome. Example: ["Fail","Fail","Success"]
    attempts: List[PaymentOutcome] = Field(..., min_length=1, max_length=24)
    retry_policy: RetryPolicy


class ArrearsEvent(BaseModel):
    ts: str
    step: str          # "Due" | "Attempt" | "ArrearsCreated" | "Recovery" | "Cancelled"
    outcome: str       # "info" | "success" | "failed" | "warning"
    message: str
    attempt_index: int
    balance_after: float
    arrears_after: float


class ArrearsResult(BaseModel):
    request: ArrearsRequest
    events: List[ArrearsEvent]
    final_state: SubscriptionState
    outstanding_balance: float
    arrears_amount: float
    retry_count: int
    payments_recovered: int
    partial_recovery: bool
    total_missed_cycles: int


def simulate_arrears(req: ArrearsRequest) -> ArrearsResult:
    t0 = _parse_or_now(req.payment_due_date)
    events: List[ArrearsEvent] = []
    balance = 0.0             # what customer owes right now (unpaid amounts)
    arrears = 0.0             # amount that has aged past the retry window
    state = SubscriptionState.PAYMENT_DUE
    retry_count = 0
    recovered = 0
    consecutive_failures = 0
    missed_cycles = 0

    # Bill for the first cycle.
    balance += req.subscription_amount
    events.append(
        _event(
            t0, 0, "Due", "info",
            f"Payment of {req.currency} {req.subscription_amount:.2f} is due",
            0, balance, arrears,
        )
    )

    for i, outcome in enumerate(req.attempts, start=1):
        # Each subsequent attempt is a retry inside the same cycle unless the
        # policy has been exhausted, in which case we start a new billing cycle.
        offset_ms = _cumulative_delay_ms(req.retry_policy, i)

        if outcome == PaymentOutcome.SUCCESS:
            paid = min(req.subscription_amount, balance) if balance > 0 else req.subscription_amount
            balance = round(balance - paid, 2)
            # Recovery reduces arrears first (oldest debt).
            if arrears > 0:
                take = min(arrears, paid)
                arrears = round(arrears - take, 2)
            recovered += 1
            consecutive_failures = 0
            state = (
                SubscriptionState.RECOVERED
                if arrears == 0 and balance == 0
                else SubscriptionState.ACTIVE
            )
            events.append(
                _event(
                    t0, offset_ms, "Attempt", "success",
                    f"Attempt {i} succeeded — collected {req.currency} {paid:.2f}",
                    i, balance, arrears,
                )
            )
            # After a successful attempt in an existing cycle, we do NOT bill again
            # unless another attempt (i.e. next iteration) is provided. This lets
            # a script like [Fail, Success, Fail, Success] model two cycles.
            continue

        # FAIL
        retry_count += 1
        consecutive_failures += 1
        state = SubscriptionState.RETRYING if i < req.retry_policy.max_attempts else SubscriptionState.PAYMENT_FAILED
        events.append(
            _event(
                t0, offset_ms, "Attempt", "failed",
                f"Attempt {i} failed",
                i, balance, arrears,
            )
        )

        # Escalation: retry policy exhausted inside a cycle — move balance to arrears.
        if consecutive_failures >= req.retry_policy.max_attempts:
            arrears = round(arrears + balance, 2)
            missed_cycles += 1
            state = SubscriptionState.IN_ARREARS
            events.append(
                _event(
                    t0, offset_ms, "ArrearsCreated", "warning",
                    f"Retry policy exhausted — {req.currency} {balance:.2f} moved to arrears",
                    i, balance, arrears,
                )
            )
            # Start a new billing cycle: new amount added to balance (customer keeps subscribing).
            balance = round(balance + 0, 2)  # arrears already captured; keep balance as-is; the failed cycle stays in arrears.
            consecutive_failures = 0

    partial_recovery = arrears > 0 and recovered > 0 and balance >= 0 and state != SubscriptionState.RECOVERED
    if state == SubscriptionState.RECOVERED and arrears == 0 and balance == 0:
        events.append(
            _event(
                t0, offset_ms, "Recovery", "success",
                "Subscription fully recovered — no outstanding arrears",
                len(req.attempts), balance, arrears,
            )
        )

    return ArrearsResult(
        request=req,
        events=events,
        final_state=state,
        outstanding_balance=round(balance + arrears, 2),
        arrears_amount=arrears,
        retry_count=retry_count,
        payments_recovered=recovered,
        partial_recovery=partial_recovery,
        total_missed_cycles=missed_cycles,
    )


def _cumulative_delay_ms(policy: RetryPolicy, attempt_index: int) -> int:
    if attempt_index <= 1:
        return 0
    total = 0
    for n in range(2, attempt_index + 1):
        raw = policy.initial_delay_ms * (policy.backoff_multiplier ** (n - 2))
        total += int(min(raw, policy.max_delay_ms))
    return total


def _parse_or_now(iso: Optional[str]) -> datetime:
    if not iso:
        return datetime.now(timezone.utc)
    try:
        d = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        if d.tzinfo is None:
            d = d.replace(tzinfo=timezone.utc)
        return d
    except ValueError:
        return datetime.now(timezone.utc)


def _event(
    t0: datetime,
    offset_ms: int,
    step: str,
    outcome: str,
    message: str,
    attempt_index: int,
    balance_after: float,
    arrears_after: float,
) -> ArrearsEvent:
    ts = (t0 + timedelta(milliseconds=offset_ms)).isoformat()
    return ArrearsEvent(
        ts=ts,
        step=step,
        outcome=outcome,
        message=message,
        attempt_index=attempt_index,
        balance_after=round(balance_after, 2),
        arrears_after=round(arrears_after, 2),
    )
