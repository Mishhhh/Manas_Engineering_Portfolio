"""FastAPI routes — thin controllers delegating to application services."""
from fastapi import APIRouter, Query, HTTPException, status
from typing import Optional
from app.api import dtos
from app.application.services import (
    ProfileService, ExperienceService, SkillsService,
    ProjectsService, ContactService, HealthService,
)
from app.core.config import get_settings

settings = get_settings()


def build_router(health: HealthService) -> APIRouter:
    router = APIRouter(prefix="/api")

    profile_svc = ProfileService()
    exp_svc = ExperienceService()
    skills_svc = SkillsService()
    projects_svc = ProjectsService()
    contact_svc = ContactService()

    # --- meta ---------------------------------------------------------------
    @router.get("/", tags=["meta"])
    async def root():
        return {"service": settings.app_name, "version": settings.app_version, "docs": "/docs"}

    @router.get("/health", response_model=dtos.HealthReport, tags=["meta"])
    async def health_endpoint():
        return await health.report()

    @router.get("/resume", response_model=dtos.ResumeResponse, tags=["meta"])
    async def resume():
        return dtos.ResumeResponse(url=settings.resume_url)

    # --- portfolio ----------------------------------------------------------
    @router.get("/profile", response_model=dtos.Profile, tags=["portfolio"])
    async def get_profile():
        return await profile_svc.get()

    @router.get("/experience", response_model=dtos.ExperienceList, tags=["portfolio"])
    async def list_experience():
        return await exp_svc.list()

    @router.get("/skills", response_model=dtos.SkillsList, tags=["portfolio"])
    async def list_skills():
        return await skills_svc.list()

    @router.get("/projects", response_model=dtos.ProjectsList, tags=["portfolio"])
    async def list_projects(kind: Optional[str] = Query(
        default=None, pattern="^(professional|personal|experiment)$"
    )):
        return await projects_svc.list(kind)

    @router.get("/projects/{project_id}", response_model=dtos.Project, tags=["portfolio"])
    async def get_project(project_id: str):
        return await projects_svc.get(project_id)

    # --- contact ------------------------------------------------------------
    @router.post(
        "/contact",
        response_model=dtos.ContactAck,
        status_code=status.HTTP_201_CREATED,
        tags=["portfolio"],
    )
    async def contact(payload: dtos.ContactRequest):
        msg = await contact_svc.submit(
            name=payload.name.strip(),
            email=payload.email,
            subject=payload.subject.strip(),
            message=payload.message.strip(),
        )
        return dtos.ContactAck(id=msg.id)

    # --- admin (Phase 9 will lock this down) --------------------------------
    @router.post("/admin/seed", response_model=dtos.SeedResponse, tags=["admin"])
    async def reseed(token: Optional[str] = Query(default=None)):
        if token != settings.admin_password:
            raise HTTPException(status_code=401, detail="admin token required")
        from app.infrastructure.seed import seed_if_needed
        counts = await seed_if_needed()
        return dtos.SeedResponse(counts=counts)

    return router
