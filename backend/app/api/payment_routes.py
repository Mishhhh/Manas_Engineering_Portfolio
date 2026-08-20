"""Payment simulator routes — thin controllers over the service.

Nested under /api/payment-simulator/* so the URL scheme is discoverable in the
existing API Playground and matches the spec.
"""
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field
from app.application.payment_simulator import PaymentSimulatorService
from app.core.payment_models import PaymentMethod, Scenario, PaymentSimulation


class CreatePaymentRequest(BaseModel):
    customerId: str = Field(..., min_length=1, max_length=120, description="Demo customer id")
    amount: float = Field(..., gt=0, description="Positive decimal amount")
    currency: str = Field(..., min_length=3, max_length=3, description="ISO-4217 3-letter currency")
    paymentMethod: PaymentMethod
    scenario: Scenario


class PaymentAck(BaseModel):
    paymentId: str
    status: str
    currentStep: str

    @classmethod
    def from_sim(cls, sim: PaymentSimulation) -> "PaymentAck":
        return cls(
            paymentId=sim.id,
            status=sim.status.value,
            currentStep=sim.current_step.value,
        )


def build_payment_router() -> APIRouter:
    router = APIRouter(prefix="/api/payment-simulator", tags=["payment-simulator"])
    service = PaymentSimulatorService()

    @router.post(
        "/payments",
        response_model=PaymentSimulation,
        status_code=status.HTTP_201_CREATED,
    )
    async def create_payment(payload: CreatePaymentRequest) -> PaymentSimulation:
        sim = await service.create(
            customer_id=payload.customerId,
            amount=payload.amount,
            currency=payload.currency,
            payment_method=payload.paymentMethod,
            scenario=payload.scenario,
        )
        return sim

    @router.get("/payments", response_model=list[PaymentSimulation])
    async def list_payments(limit: int = Query(default=20, ge=1, le=100)) -> list[PaymentSimulation]:
        return await service.list(limit=limit)

    @router.get("/payments/{payment_id}", response_model=PaymentSimulation)
    async def get_payment(payment_id: str) -> PaymentSimulation:
        return await service.get(payment_id)

    @router.post("/payments/{payment_id}/process", response_model=PaymentAck)
    async def process_payment(payment_id: str) -> PaymentAck:
        sim = await service.start_processing(payment_id)
        return PaymentAck.from_sim(sim)

    @router.post("/payments/{payment_id}/reset", response_model=PaymentSimulation)
    async def reset_payment(payment_id: str) -> PaymentSimulation:
        return await service.reset(payment_id)

    @router.get("/scenarios")
    async def list_scenarios() -> dict:
        """Discovery endpoint — used by the frontend to render the scenario picker."""
        return {
            "paymentMethods": [pm.value for pm in PaymentMethod],
            "scenarios": [s.value for s in Scenario],
            "steps": [
                "Request", "Validation", "MandateCheck",
                "PaymentProcessing", "PaymentResult", "RetryFailure", "Settlement",
            ],
        }

    return router
