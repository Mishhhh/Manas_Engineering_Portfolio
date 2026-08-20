"""API routers for Phase 6/7/8 (retry engine, arrears simulator, SQL arena)."""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Any, List

from app.application import retry_engine as re_mod
from app.application import arrears_simulator as arr_mod
from app.application.sql_arena import SqlArenaService
from app.application.sql_challenges import (
    CHALLENGES,
    canonical_rows,
    get_challenge,
    public_challenge,
    public_challenge_full,
)


# ---- Retry Engine ---------------------------------------------------------
def build_retry_router() -> APIRouter:
    router = APIRouter(prefix="/api/retry-engine", tags=["retry-engine"])

    @router.post("/simulate", response_model=re_mod.RetrySimulationResult)
    async def simulate(req: re_mod.RetrySimulationRequest):
        return re_mod.simulate(req)

    @router.get("/preset-policies")
    async def preset_policies():
        return {
            "recommended": {
                "max_attempts": 4,
                "initial_delay_ms": 5_000,
                "backoff_multiplier": 2.0,
                "max_delay_ms": 60_000,
                "strategy": "Exponential",
            },
            "aggressive": {
                "max_attempts": 6,
                "initial_delay_ms": 1_000,
                "backoff_multiplier": 3.0,
                "max_delay_ms": 30_000,
                "strategy": "Exponential",
            },
            "fixed": {
                "max_attempts": 3,
                "initial_delay_ms": 10_000,
                "backoff_multiplier": 1.0,
                "max_delay_ms": 10_000,
                "strategy": "Fixed",
            },
        }

    return router


# ---- Arrears Simulator ---------------------------------------------------
def build_arrears_router() -> APIRouter:
    router = APIRouter(prefix="/api/arrears", tags=["arrears"])

    @router.post("/simulate", response_model=arr_mod.ArrearsResult)
    async def simulate(req: arr_mod.ArrearsRequest):
        return arr_mod.simulate_arrears(req)

    return router


# ---- SQL Arena ------------------------------------------------------------
class ExecuteRequest(BaseModel):
    sql: str = Field(..., min_length=1, max_length=5000)


class SubmitRequest(BaseModel):
    sql: str = Field(..., min_length=1, max_length=5000)


def build_sql_arena_router(service: SqlArenaService) -> APIRouter:
    router = APIRouter(prefix="/api/sql-arena", tags=["sql-arena"])

    @router.get("/schema")
    async def schema():
        return await service.schema()

    @router.get("/challenges")
    async def list_challenges():
        return [public_challenge(c) for c in CHALLENGES]

    @router.get("/challenges/{cid}")
    async def get_one(cid: str):
        c = get_challenge(cid)
        if not c:
            raise HTTPException(404, detail="challenge_not_found")
        return public_challenge_full(c)

    @router.post("/execute")
    async def execute(req: ExecuteRequest):
        result = await service.execute(req.sql)
        return _serialise_result(result)

    @router.post("/challenges/{cid}/submit")
    async def submit(cid: str, req: SubmitRequest):
        c = get_challenge(cid)
        if not c:
            raise HTTPException(404, detail="challenge_not_found")

        # Execute the user query.
        user_result = await service.execute(req.sql)
        if not user_result.ok:
            return {
                "correct": False,
                "reason": user_result.error,
                "hint": user_result.hint,
                "execution": _serialise_result(user_result),
            }

        # Execute the reference query.
        ref = await service.execute(c["check"]["sql"])
        if not ref.ok:  # defensive — should never happen
            return {"correct": False, "reason": "reference query failed", "execution": _serialise_result(user_result)}

        user_canon = canonical_rows(user_result.rows)
        ref_canon = canonical_rows(ref.rows)

        # Column-count shape check
        if len(user_result.columns) != len(ref.columns):
            return {
                "correct": False,
                "reason": f"expected {len(ref.columns)} columns, got {len(user_result.columns)}",
                "expected_columns": ref.columns,
                "expected_row_count": len(ref.rows),
                "user_row_count": len(user_result.rows),
                "execution": _serialise_result(user_result),
            }

        correct = user_canon == ref_canon
        return {
            "correct": correct,
            "reason": None if correct else "row-set mismatch",
            "expected_columns": ref.columns,
            "expected_row_count": len(ref.rows),
            "user_row_count": len(user_result.rows),
            "execution": _serialise_result(user_result),
        }

    @router.get("/challenges/{cid}/solution")
    async def solution(cid: str):
        c = get_challenge(cid)
        if not c:
            raise HTTPException(404, detail="challenge_not_found")
        return {
            "solution": c["solution"],
            "explanation": c["explanation"],
        }

    @router.get("/challenges/{cid}/hint")
    async def hint(cid: str, index: int = 0):
        c = get_challenge(cid)
        if not c:
            raise HTTPException(404, detail="challenge_not_found")
        if index < 0 or index >= len(c["hints"]):
            raise HTTPException(400, detail="hint_index_out_of_range")
        return {"index": index, "hint": c["hints"][index], "total": len(c["hints"])}

    return router


def _serialise_result(r) -> dict:
    return {
        "ok": r.ok,
        "columns": r.columns,
        "rows": r.rows,
        "rowCount": r.row_count,
        "executionMs": r.execution_ms,
        "error": r.error,
        "hint": r.hint,
    }
