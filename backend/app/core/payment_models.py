"""Payment simulator domain models (Portfolio.Core analog).

The state machine is intentionally explicit. All fields are demo-only —
no real financial systems are ever touched.
"""
from __future__ import annotations
from datetime import datetime, timezone
from enum import Enum
from typing import Any, List, Optional
from pydantic import BaseModel, Field
import uuid


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class PaymentMethod(str, Enum):
    DIRECT_DEBIT = "DirectDebit"
    CARD = "Card"
    BANK_TRANSFER = "BankTransfer"


class Scenario(str, Enum):
    SUCCESS = "Success"
    FAILURE = "Failure"
    TIMEOUT = "Timeout"
    MANDATE_FAILURE = "MandateFailure"
    INSUFFICIENT_FUNDS = "InsufficientFunds"


class PaymentStatus(str, Enum):
    CREATED = "Created"
    VALIDATED = "Validated"
    MANDATE_CHECKED = "MandateChecked"
    PROCESSING = "Processing"
    SUCCEEDED = "Succeeded"
    FAILED = "Failed"
    TIMED_OUT = "TimedOut"
    RETRY_SCHEDULED = "RetryScheduled"
    SETTLED = "Settled"


class PaymentStep(str, Enum):
    """The high-level visualization steps (7 blocks in the UI)."""
    REQUEST = "Request"
    VALIDATION = "Validation"
    MANDATE_CHECK = "MandateCheck"
    PAYMENT_PROCESSING = "PaymentProcessing"
    PAYMENT_RESULT = "PaymentResult"
    RETRY_FAILURE = "RetryFailure"
    SETTLEMENT = "Settlement"


class PaymentEventType(str, Enum):
    CREATED = "PaymentCreated"
    VALIDATION_STARTED = "ValidationStarted"
    VALIDATION_SUCCEEDED = "ValidationSucceeded"
    VALIDATION_FAILED = "ValidationFailed"
    MANDATE_CHECK_STARTED = "MandateCheckStarted"
    MANDATE_CHECK_SUCCEEDED = "MandateCheckSucceeded"
    MANDATE_CHECK_FAILED = "MandateCheckFailed"
    PROCESSING_STARTED = "ProcessingStarted"
    PROCESSING_SUCCEEDED = "ProcessingSucceeded"
    PROCESSING_FAILED = "ProcessingFailed"
    PROCESSING_TIMED_OUT = "ProcessingTimedOut"
    RETRY_SCHEDULED = "RetryScheduled"
    SETTLEMENT_CREATED = "SettlementCreated"


class PaymentSimulationEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: PaymentEventType
    message: str
    step: PaymentStep
    outcome: str  # "info" | "success" | "failed" | "warning"
    metadata: dict[str, Any] = Field(default_factory=dict)
    timestamp: str = Field(default_factory=_iso_now)


class PaymentSimulation(BaseModel):
    id: str
    customer_id: str
    amount: float
    currency: str
    payment_method: PaymentMethod
    scenario: Scenario
    status: PaymentStatus = PaymentStatus.CREATED
    current_step: PaymentStep = PaymentStep.REQUEST
    failure_reason: Optional[str] = None
    retry_available: bool = False
    processing_ms: int = 0
    created_at: str = Field(default_factory=_iso_now)
    updated_at: str = Field(default_factory=_iso_now)
    events: List[PaymentSimulationEvent] = Field(default_factory=list)


class TERMINAL:
    """Terminal statuses — no outgoing transitions."""
    values = {
        PaymentStatus.SETTLED,
        PaymentStatus.FAILED,
        PaymentStatus.TIMED_OUT,
    }
