"""Payment simulator service — backend-owned state machine.

Runs the state machine as a background asyncio task so the client can poll
GET /payments/{id} for live progress. All transitions and events are persisted
to Mongo — the frontend never fabricates status.
"""
from __future__ import annotations
import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from app.core.errors import NotFoundError, ValidationDomainError
from app.core.payment_models import (
    PaymentEventType,
    PaymentMethod,
    PaymentSimulation,
    PaymentSimulationEvent,
    PaymentStatus,
    PaymentStep,
    Scenario,
    TERMINAL,
)
from app.infrastructure.db import Collections, get_db

logger = logging.getLogger("payment-sim")

# Timing (kept short so demos are snappy but visibly staged).
STEP_DELAY_MS = 260

# Transitions matrix — used both for validation AND documentation.
ALLOWED: dict[PaymentStatus, set[PaymentStatus]] = {
    PaymentStatus.CREATED: {PaymentStatus.VALIDATED, PaymentStatus.FAILED},
    PaymentStatus.VALIDATED: {
        PaymentStatus.MANDATE_CHECKED,
        PaymentStatus.PROCESSING,
        PaymentStatus.FAILED,
    },
    PaymentStatus.MANDATE_CHECKED: {PaymentStatus.PROCESSING, PaymentStatus.FAILED},
    PaymentStatus.PROCESSING: {
        PaymentStatus.SUCCEEDED,
        PaymentStatus.FAILED,
        PaymentStatus.TIMED_OUT,
        PaymentStatus.RETRY_SCHEDULED,
    },
    PaymentStatus.RETRY_SCHEDULED: {PaymentStatus.PROCESSING, PaymentStatus.FAILED},
    PaymentStatus.SUCCEEDED: {PaymentStatus.SETTLED},
    # Terminal
    PaymentStatus.SETTLED: set(),
    PaymentStatus.FAILED: set(),
    PaymentStatus.TIMED_OUT: set(),
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class PaymentSimulatorService:
    """Orchestrates payment simulations and their state machine."""

    def __init__(self) -> None:
        self._running: dict[str, asyncio.Task] = {}

    # ---- CRUD ---------------------------------------------------------------
    async def create(
        self,
        *,
        customer_id: str,
        amount: float,
        currency: str,
        payment_method: PaymentMethod,
        scenario: Scenario,
    ) -> PaymentSimulation:
        # Domain validation beyond Pydantic (business rules).
        if amount <= 0:
            raise ValidationDomainError("amount must be greater than zero", code="amount_invalid")
        if not customer_id.strip():
            raise ValidationDomainError("customerId is required", code="customer_required")
        if not currency.strip():
            raise ValidationDomainError("currency is required", code="currency_required")

        pid = f"PAY-DEMO-{uuid.uuid4().hex[:8].upper()}"
        sim = PaymentSimulation(
            id=pid,
            customer_id=customer_id.strip(),
            amount=round(float(amount), 2),
            currency=currency.strip().upper()[:3],
            payment_method=payment_method,
            scenario=scenario,
        )
        sim.events.append(
            PaymentSimulationEvent(
                event_type=PaymentEventType.CREATED,
                message=f"Payment created — {sim.currency} {sim.amount:.2f}",
                step=PaymentStep.REQUEST,
                outcome="info",
                metadata={
                    "customerId": sim.customer_id,
                    "paymentMethod": sim.payment_method.value,
                    "scenario": sim.scenario.value,
                },
            )
        )
        await self._persist(sim, insert=True)
        return sim

    async def get(self, payment_id: str) -> PaymentSimulation:
        db = get_db()
        doc = await db[Collections.PAYMENTS].find_one({"_id": payment_id})
        if not doc:
            raise NotFoundError(
                f"payment '{payment_id}' not found", code="payment_not_found"
            )
        doc.pop("_id", None)
        return PaymentSimulation(**doc)

    async def list(self, limit: int = 20) -> List[PaymentSimulation]:
        db = get_db()
        cursor = db[Collections.PAYMENTS].find().sort("created_at", -1).limit(limit)
        out: List[PaymentSimulation] = []
        async for doc in cursor:
            doc.pop("_id", None)
            out.append(PaymentSimulation(**doc))
        return out

    async def reset(self, payment_id: str) -> PaymentSimulation:
        sim = await self.get(payment_id)
        # Cancel a running task for the same id (idempotent).
        task = self._running.get(payment_id)
        if task and not task.done():
            task.cancel()
        sim.status = PaymentStatus.CREATED
        sim.current_step = PaymentStep.REQUEST
        sim.failure_reason = None
        sim.retry_available = False
        sim.processing_ms = 0
        sim.events = [
            PaymentSimulationEvent(
                event_type=PaymentEventType.CREATED,
                message=f"Payment reset — {sim.currency} {sim.amount:.2f}",
                step=PaymentStep.REQUEST,
                outcome="info",
                metadata={"reset": True},
            )
        ]
        sim.updated_at = _now()
        await self._persist(sim)
        return sim

    # ---- Processing ---------------------------------------------------------
    async def start_processing(self, payment_id: str) -> PaymentSimulation:
        sim = await self.get(payment_id)
        if sim.status != PaymentStatus.CREATED:
            raise ValidationDomainError(
                f"cannot start processing from status '{sim.status.value}' — reset first",
                code="invalid_state",
            )

        # Kick off the state machine in the background.
        task = asyncio.create_task(self._run(sim.id))
        self._running[sim.id] = task

        # Immediately reflect PROCESSING to the caller (but persist the transition too).
        sim.status = PaymentStatus.VALIDATED  # nudged so caller sees state change
        sim.current_step = PaymentStep.VALIDATION
        sim.updated_at = _now()
        # Note: the background task will overwrite from CREATED → VALIDATED with its own events.
        # We do NOT persist here to avoid double-writing; the task owns the machine.
        return sim

    # ---- State machine runner (owns all transitions) ------------------------
    async def _run(self, payment_id: str) -> None:
        try:
            t0 = datetime.now(timezone.utc)
            sim = await self.get(payment_id)

            # Step: VALIDATION
            await self._transition(
                sim,
                to=PaymentStatus.VALIDATED,
                step=PaymentStep.VALIDATION,
                event_type=PaymentEventType.VALIDATION_STARTED,
                message="Validation started",
                outcome="info",
            )
            await asyncio.sleep(STEP_DELAY_MS / 1000)
            await self._append_event(
                sim,
                PaymentEventType.VALIDATION_SUCCEEDED,
                "Validation successful",
                PaymentStep.VALIDATION,
                "success",
            )

            # Step: MANDATE CHECK
            await self._transition(
                sim,
                to=PaymentStatus.MANDATE_CHECKED,
                step=PaymentStep.MANDATE_CHECK,
                event_type=PaymentEventType.MANDATE_CHECK_STARTED,
                message="Mandate check started",
                outcome="info",
            )
            await asyncio.sleep(STEP_DELAY_MS / 1000)

            if sim.scenario == Scenario.MANDATE_FAILURE:
                await self._append_event(
                    sim,
                    PaymentEventType.MANDATE_CHECK_FAILED,
                    "Mandate check failed — mandate inactive",
                    PaymentStep.MANDATE_CHECK,
                    "failed",
                )
                await self._finalize_failed(
                    sim,
                    reason="Mandate inactive or missing",
                    retry_available=False,
                    t0=t0,
                )
                return

            await self._append_event(
                sim,
                PaymentEventType.MANDATE_CHECK_SUCCEEDED,
                "Mandate check successful",
                PaymentStep.MANDATE_CHECK,
                "success",
            )

            # Step: PROCESSING
            await self._transition(
                sim,
                to=PaymentStatus.PROCESSING,
                step=PaymentStep.PAYMENT_PROCESSING,
                event_type=PaymentEventType.PROCESSING_STARTED,
                message="Payment processing started",
                outcome="info",
            )
            await asyncio.sleep(STEP_DELAY_MS / 1000)

            if sim.scenario == Scenario.SUCCESS:
                await self._append_event(
                    sim,
                    PaymentEventType.PROCESSING_SUCCEEDED,
                    "Processing successful",
                    PaymentStep.PAYMENT_PROCESSING,
                    "success",
                )
                await self._transition(
                    sim,
                    to=PaymentStatus.SUCCEEDED,
                    step=PaymentStep.PAYMENT_RESULT,
                    event_type=None,
                    message="Payment succeeded",
                    outcome="success",
                )
                await asyncio.sleep(STEP_DELAY_MS / 1000)
                await self._settle(sim, t0)
                return

            if sim.scenario == Scenario.TIMEOUT:
                await self._append_event(
                    sim,
                    PaymentEventType.PROCESSING_TIMED_OUT,
                    "Processing timed out waiting for processor response",
                    PaymentStep.PAYMENT_PROCESSING,
                    "failed",
                )
                await self._finalize_failed(
                    sim,
                    reason="Upstream processor timeout",
                    retry_available=True,
                    to_status=PaymentStatus.TIMED_OUT,
                    t0=t0,
                )
                return

            # FAILURE + INSUFFICIENT_FUNDS
            reason = (
                "Insufficient funds in payer account"
                if sim.scenario == Scenario.INSUFFICIENT_FUNDS
                else "Processor declined the payment"
            )
            retry_available = sim.scenario == Scenario.INSUFFICIENT_FUNDS

            await self._append_event(
                sim,
                PaymentEventType.PROCESSING_FAILED,
                f"Processing failed — {reason}",
                PaymentStep.PAYMENT_PROCESSING,
                "failed",
                metadata={"code": sim.scenario.value},
            )

            if retry_available:
                await self._append_event(
                    sim,
                    PaymentEventType.RETRY_SCHEDULED,
                    "Retry scheduled with exponential backoff",
                    PaymentStep.RETRY_FAILURE,
                    "warning",
                    metadata={"backoff_ms": 5000, "attempt": 1},
                )

            await self._finalize_failed(
                sim,
                reason=reason,
                retry_available=retry_available,
                t0=t0,
            )
        except asyncio.CancelledError:
            logger.info("payment %s: run cancelled", payment_id)
            raise
        except Exception as exc:  # noqa: BLE001
            logger.exception("payment %s: unhandled error: %s", payment_id, exc)

    # ---- Transition helpers -------------------------------------------------
    async def _transition(
        self,
        sim: PaymentSimulation,
        *,
        to: PaymentStatus,
        step: PaymentStep,
        event_type: PaymentEventType | None,
        message: str,
        outcome: str,
    ) -> None:
        if to not in ALLOWED.get(sim.status, set()) and sim.status != to:
            raise ValidationDomainError(
                f"illegal transition {sim.status.value} → {to.value}",
                code="illegal_transition",
            )
        sim.status = to
        sim.current_step = step
        sim.updated_at = _now()
        if event_type is not None:
            sim.events.append(
                PaymentSimulationEvent(
                    event_type=event_type, message=message, step=step, outcome=outcome
                )
            )
        await self._persist(sim)

    async def _append_event(
        self,
        sim: PaymentSimulation,
        et: PaymentEventType,
        msg: str,
        step: PaymentStep,
        outcome: str,
        metadata: dict | None = None,
    ) -> None:
        sim.events.append(
            PaymentSimulationEvent(
                event_type=et,
                message=msg,
                step=step,
                outcome=outcome,
                metadata=metadata or {},
            )
        )
        sim.updated_at = _now()
        await self._persist(sim)

    async def _settle(self, sim: PaymentSimulation, t0: datetime) -> None:
        await self._transition(
            sim,
            to=PaymentStatus.SETTLED,
            step=PaymentStep.SETTLEMENT,
            event_type=PaymentEventType.SETTLEMENT_CREATED,
            message=f"Settlement created for {sim.currency} {sim.amount:.2f}",
            outcome="success",
        )
        sim.processing_ms = int(
            (datetime.now(timezone.utc) - t0).total_seconds() * 1000
        )
        await self._persist(sim)

    async def _finalize_failed(
        self,
        sim: PaymentSimulation,
        *,
        reason: str,
        retry_available: bool,
        t0: datetime,
        to_status: PaymentStatus = PaymentStatus.FAILED,
    ) -> None:
        sim.status = to_status
        sim.failure_reason = reason
        sim.retry_available = retry_available
        sim.current_step = PaymentStep.PAYMENT_RESULT
        sim.processing_ms = int(
            (datetime.now(timezone.utc) - t0).total_seconds() * 1000
        )
        sim.updated_at = _now()
        await self._persist(sim)

    # ---- Persistence --------------------------------------------------------
    async def _persist(self, sim: PaymentSimulation, insert: bool = False) -> None:
        db = get_db()
        payload = {**sim.model_dump(mode="json"), "_id": sim.id}
        if insert:
            try:
                await db[Collections.PAYMENTS].insert_one(payload)
                return
            except Exception:  # e.g. duplicate id — fall through to upsert
                pass
        await db[Collections.PAYMENTS].update_one(
            {"_id": sim.id}, {"$set": payload}, upsert=True
        )
