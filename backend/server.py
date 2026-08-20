"""Application entrypoint — factory that wires config, DB, services and routes."""
import logging
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware

from app.api.routes import build_router
from app.application.services import HealthService
from app.core.config import get_settings
from app.core.errors import DomainError, ErrorResponse
from app.infrastructure.db import get_client
from app.infrastructure.seed import seed_if_needed

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("portfolio")


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="Manas Mishra Portfolio API",
        version=settings.app_version,
        description=(
            "Portfolio-OS backend. Layered architecture:\n\n"
            "- **api/** — FastAPI controllers + DTOs (this is 'Portfolio.API')\n"
            "- **application/** — services with business logic ('Portfolio.Application')\n"
            "- **core/** — domain models, errors, settings ('Portfolio.Core')\n"
            "- **infrastructure/** — Mongo access + seed ('Portfolio.Infrastructure')\n"
        ),
        openapi_tags=[
            {"name": "meta", "description": "Service info, health, resume URL."},
            {"name": "portfolio", "description": "Data-driven portfolio content."},
            {"name": "admin", "description": "Admin operations (token-guarded)."},
        ],
    )

    start_time = datetime.now(timezone.utc)
    health_service = HealthService(
        start_time=start_time,
        version=settings.app_version,
        service=settings.app_name,
    )

    app.include_router(build_router(health_service))

    # Feature module: Payment Simulator (Phase 5) — mounted under its own prefix.
    from app.api.payment_routes import build_payment_router
    app.include_router(build_payment_router())

    # Feature modules: Retry engine, arrears simulator, SQL arena (Phase 6-8).
    from app.api.lab_routes import build_retry_router, build_arrears_router, build_sql_arena_router
    from app.application.sql_arena import SqlArenaService

    sql_arena_service = SqlArenaService()
    app.include_router(build_retry_router())
    app.include_router(build_arrears_router())
    app.include_router(build_sql_arena_router(sql_arena_service))

    app.add_middleware(
        CORSMiddleware,
        allow_credentials=True,
        allow_origins=settings.cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ---- exception handlers ------------------------------------------------
    @app.exception_handler(DomainError)
    async def _domain_err(_: Request, exc: DomainError):
        return JSONResponse(
            status_code=exc.status_code,
            content=ErrorResponse(code=exc.code, message=exc.message).model_dump(),
        )

    # ---- lifecycle ---------------------------------------------------------
    @app.on_event("startup")
    async def _on_startup() -> None:
        try:
            counts = await seed_if_needed()
            logger.info("seed complete: %s", counts)
        except Exception as exc:  # noqa: BLE001
            logger.exception("seed failed at startup: %s", exc)

    @app.on_event("shutdown")
    async def _on_shutdown() -> None:
        get_client().close()

    return app


app = create_app()
