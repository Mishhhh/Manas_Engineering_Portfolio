"""Application services — read-through Mongo, return domain models."""
from datetime import datetime, timezone
from typing import List
from app.core import models as M
from app.core.errors import NotFoundError
from app.infrastructure.db import get_db, Collections


def _strip_id(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


class ProfileService:
    async def get(self) -> M.Profile:
        db = get_db()
        doc = await db[Collections.PROFILE].find_one({"_id": "me"})
        if not doc:
            raise NotFoundError("profile not seeded", code="profile_missing")
        return M.Profile(**_strip_id(doc))


class ExperienceService:
    async def list(self) -> List[M.ExperienceEntry]:
        db = get_db()
        docs = await db[Collections.EXPERIENCE].find().sort("order", 1).to_list(200)
        return [M.ExperienceEntry(**_strip_id(d)) for d in docs]


class SkillsService:
    async def list(self) -> List[M.SkillGroup]:
        db = get_db()
        docs = await db[Collections.SKILLS].find().sort("order", 1).to_list(200)
        return [M.SkillGroup(**_strip_id(d)) for d in docs]


class ProjectsService:
    async def list(self, kind: str | None = None) -> List[M.Project]:
        db = get_db()
        q: dict = {}
        if kind:
            q["kind"] = kind
        docs = await db[Collections.PROJECTS].find(q).sort("order", 1).to_list(500)
        return [M.Project(**_strip_id(d)) for d in docs]

    async def get(self, project_id: str) -> M.Project:
        db = get_db()
        doc = await db[Collections.PROJECTS].find_one({"_id": project_id})
        if not doc:
            raise NotFoundError(f"project '{project_id}' not found", code="project_not_found")
        return M.Project(**_strip_id(doc))


class ContactService:
    async def submit(self, name: str, email: str, subject: str, message: str) -> M.ContactMessage:
        msg = M.ContactMessage(name=name, email=email, subject=subject, message=message)
        db = get_db()
        await db[Collections.CONTACT].insert_one({**msg.model_dump(), "_id": msg.id})
        return msg


class HealthService:
    def __init__(self, start_time: datetime, version: str, service: str) -> None:
        self.start_time = start_time
        self.version = version
        self.service = service

    async def report(self) -> M.HealthReport:
        now = datetime.now(timezone.utc)
        db_status = "OPERATIONAL"
        db_detail = "mongo ping ok"
        try:
            await get_db().command("ping")
        except Exception as exc:  # noqa: BLE001
            db_status = "DOWN"
            db_detail = f"ping failed: {exc.__class__.__name__}"

        indicators = [
            M.StatusIndicator(key="api", label="API", status="OPERATIONAL", detail="fastapi up"),
            M.StatusIndicator(key="db", label="DATABASE", status=db_status, detail=db_detail),
            M.StatusIndicator(key="payments", label="PAYMENT ENGINE",
                              status="OPERATIONAL", detail="simulator ready"),
            M.StatusIndicator(key="cicd", label="CI/CD", status="OPERATIONAL", detail="hot reload"),
            M.StatusIndicator(key="coffee", label="COFFEE", status="REQUIRED", detail="brew in progress"),
        ]
        return M.HealthReport(
            ok=(db_status == "OPERATIONAL"),
            service=self.service,
            version=self.version,
            time=now.isoformat(),
            uptime_seconds=int((now - self.start_time).total_seconds()),
            indicators=indicators,
        )
