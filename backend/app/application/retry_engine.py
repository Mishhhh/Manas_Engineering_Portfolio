"""Retry Engine — pure business logic (no real sleeps).

Computes the schedule of retry attempts for a configurable policy and a
prescribed failure pattern. Used by /api/retry-engine/simulate and (optionally)
by the payment simulator's "Retry Payment" flow.

The engine intentionally does NOT sleep — it emits simulated timestamps so
demos stay snappy while remaining educationally accurate.
"""
from __future__ import annotations
from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

from app.core.errors import ValidationDomainError


class AttemptStatus(str, Enum):
    SUCCESS = "Success"
    FAILED = "Failed"
    GAVE_UP = "GaveUp"          # terminal — exhausted max_attempts
    PERMANENT_FAILURE = "PermanentFailure"  # non-retryable


class RetryStrategy(str, Enum):
    EXPONENTIAL = "Exponential"
    FIXED = "Fixed"


class RetryPolicy(BaseModel):
    max_attempts: int = Field(..., ge=1, le=10)
    initial_delay_ms: int = Field(..., ge=0, le=600_000)
    backoff_multiplier: float = Field(..., ge=1.0, le=10.0)
    max_delay_ms: int = Field(..., ge=0, le=3_600_000)
    strategy: RetryStrategy = RetryStrategy.EXPONENTIAL


class RetrySimulationRequest(BaseModel):
    policy: RetryPolicy
    # First attempt is attempt 1. Value N means attempt N is the first SUCCESS.
    # Use 0 to fail every attempt; -1 to model a permanent failure at attempt 1.
    success_at_attempt: int = Field(default=0, ge=-1, le=10)
    request_id: str = Field(default="REQ-DEMO-1", min_length=1, max_length=64)


class RetryAttempt(BaseModel):
    n: int
    status: AttemptStatus
    delay_before_ms: int   # delay AFTER previous attempt, before this one
    at_offset_ms: int      # simulated cumulative offset from t0
    timestamp: str         # ISO string derived from t0 + at_offset_ms
    reason: str
    request_id: str        # idempotency key — same across all attempts


class RetrySimulationResult(BaseModel):
    policy: RetryPolicy
    request_id: str
    attempts: List[RetryAttempt]
    total_duration_ms: int
    outcome: AttemptStatus
    exhausted: bool
    idempotent: bool = True


def compute_delay(policy: RetryPolicy, attempt_index: int) -> int:
    """attempt_index is 1-based. Returns delay in ms BEFORE attempt N.

    Delay before attempt 1 is 0 (first attempt is immediate).
    Delay before attempt N>1 is initial * multiplier^(N-2), capped at max_delay.
    """
    if attempt_index <= 1:
        return 0
    if policy.strategy == RetryStrategy.FIXED:
        return min(policy.initial_delay_ms, policy.max_delay_ms)
    # Exponential
    raw = policy.initial_delay_ms * (policy.backoff_multiplier ** (attempt_index - 2))
    return int(min(raw, policy.max_delay_ms))


def simulate(req: RetrySimulationRequest) -> RetrySimulationResult:
    p = req.policy
    if req.success_at_attempt > p.max_attempts:
        raise ValidationDomainError(
            "success_at_attempt cannot exceed max_attempts",
            code="invalid_success_attempt",
        )

    t0 = datetime.now(timezone.utc)
    attempts: List[RetryAttempt] = []
    cumulative = 0
    outcome = AttemptStatus.GAVE_UP
    exhausted = True

    for n in range(1, p.max_attempts + 1):
        delay = compute_delay(p, n)
        cumulative += delay

        # Permanent failure short-circuit — no further retries.
        if req.success_at_attempt == -1 and n == 1:
            attempts.append(
                RetryAttempt(
                    n=n,
                    status=AttemptStatus.PERMANENT_FAILURE,
                    delay_before_ms=delay,
                    at_offset_ms=cumulative,
                    timestamp=_iso(t0, cumulative),
                    reason="Permanent failure — not retryable",
                    request_id=req.request_id,
                )
            )
            outcome = AttemptStatus.PERMANENT_FAILURE
            exhausted = False
            break

        # Success at this attempt?
        if req.success_at_attempt == n:
            attempts.append(
                RetryAttempt(
                    n=n,
                    status=AttemptStatus.SUCCESS,
                    delay_before_ms=delay,
                    at_offset_ms=cumulative,
                    timestamp=_iso(t0, cumulative),
                    reason="Payment succeeded",
                    request_id=req.request_id,
                )
            )
            outcome = AttemptStatus.SUCCESS
            exhausted = False
            break

        # Otherwise it's a transient failure and we keep going.
        attempts.append(
            RetryAttempt(
                n=n,
                status=AttemptStatus.FAILED,
                delay_before_ms=delay,
                at_offset_ms=cumulative,
                timestamp=_iso(t0, cumulative),
                reason=_reason_for(n, p.max_attempts),
                request_id=req.request_id,
            )
        )

    return RetrySimulationResult(
        policy=p,
        request_id=req.request_id,
        attempts=attempts,
        total_duration_ms=cumulative,
        outcome=outcome,
        exhausted=exhausted,
    )


def _iso(t0: datetime, offset_ms: int) -> str:
    from datetime import timedelta
    return (t0 + timedelta(milliseconds=offset_ms)).isoformat()


def _reason_for(n: int, max_attempts: int) -> str:
    if n >= max_attempts:
        return "Attempt failed — max retries exhausted"
    return "Transient failure — will retry"
