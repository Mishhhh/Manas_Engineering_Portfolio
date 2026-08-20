"""
Manas Mishra Portfolio API — Phase 1
FastAPI backend exposing profile, health/system-status, resume, and skills endpoints.

The database layer (Mongo) is wired but Phase 1 only serves static-shape read endpoints
so the frontend can render the hero, system-status panel and terminal shell.
Later phases will add: projects CRUD, payment simulator, retry engine, SQL arena,
incident sim, observability, RAG (Ask Manas), admin CMS.
"""
from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Dict, Any
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# ---- Mongo ----
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# ---- App ----
app = FastAPI(title="Manas Mishra Portfolio API", version="0.1.0")
api_router = APIRouter(prefix="/api")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("portfolio")

# ============================================================
# Models
# ============================================================
class Contact(BaseModel):
    email: str
    phone: str
    linkedin: str
    github: str


class Profile(BaseModel):
    name: str
    title: str
    tagline: str
    location: str
    stack_tags: List[str]
    summary: str
    contact: Contact


class StatusIndicator(BaseModel):
    key: str
    label: str
    status: str  # OPERATIONAL | DEGRADED | DOWN | REQUIRED
    detail: str


class HealthResponse(BaseModel):
    ok: bool
    service: str
    version: str
    time: str
    uptime_seconds: int
    indicators: List[StatusIndicator]


class ExperienceEntry(BaseModel):
    id: str
    company: str
    title: str
    dates: str
    location: str
    bullets: List[str]


class SkillGroup(BaseModel):
    category: str
    items: List[str]


class ProjectSummary(BaseModel):
    id: str
    name: str
    kind: str  # professional | personal | experiment
    summary: str
    tags: List[str]


# ============================================================
# Source-of-truth content (from resume PDF)
# ============================================================
_START_TIME = datetime.now(timezone.utc)

PROFILE = Profile(
    name="Manas Mishra",
    title="Backend Software Engineer",
    tagline="I build reliable backend systems, payment workflows and APIs.",
    location="Pune, India",
    stack_tags=[".NET", "C#", "SQL Server", "APIs", "Payments", "Cloud"],
    summary=(
        "Backend Software Engineer with around 4 years of experience building and supporting "
        "high-transaction payment and subscription systems in enterprise SaaS platforms. "
        "Experienced in Direct Debit workflows, payment retries, arrears management, and "
        "financial business logic implementation using ASP.NET, C#, and SQL Server. Hands-on "
        "experience modernizing legacy Classic ASP payment services into modern C# backend "
        "handlers, improving system reliability and maintainability. Strong production "
        "support background with proven ability to diagnose complex payment failures, "
        "optimize backend workflows, and collaborate across global teams to ensure "
        "high-availability financial systems."
    ),
    contact=Contact(
        email="manasmishra0801@gmail.com",
        phone="+91 8200 733936",
        linkedin="https://www.linkedin.com/in/mishra-manas270801/",
        github="https://github.com/",
    ),
)

EXPERIENCE: List[ExperienceEntry] = [
    ExperienceEntry(
        id="xplore-2024",
        company="Xplore Technologies Pvt. Ltd",
        title="Software Engineer — Backend & Payments Systems",
        dates="Sep 2024 — Present",
        location="Pune, Maharashtra",
        bullets=[
            "Developed and supported backend payment workflows for subscription-based SaaS platforms including Direct Debit collection, payment scheduling, and arrears handling.",
            "Investigated and resolved production payment failures across regions, minimizing disruption to customer billing and improving system stability.",
            "Diagnosed and resolved high-priority production incidents affecting payment processing and customer billing communications.",
            "Provided backend engineering support for customer-specific payment configurations and subscription promotions.",
            "Modernized legacy Classic ASP payment APIs into structured C# handler architecture, improving maintainability and backend performance.",
            "Contributed to payment orchestration logic involving mandates, retries, settlement workflows, and subscription lifecycle management.",
            "Designed and optimized complex SQL Server queries for payment reconciliation, arrears reporting, and transactional data processing.",
            "Supported live financial systems by debugging scheduled tasks, messaging flows, and payment retry logic.",
            "Collaborated with SRE and platform teams to improve backend observability using structured logging and OpenTelemetry proof-of-concept implementations.",
        ],
    ),
    ExperienceEntry(
        id="safesend-2022",
        company="SafeSend Technologies Private Limited",
        title="Associate Software Engineer L1",
        dates="Sep 2022 — Jun 2024",
        location="Bengaluru, Karnataka",
        bullets=[
            "Developed and maintained ASP.NET web APIs, increasing document collection efficiency by 30%.",
            "Implemented Agile methodologies, CI/CD pipelines on Azure, and collaborated on client-facing websites using ReactJS and Redux.",
            "Optimized data retrieval processes using Microsoft SQL Server for backend management.",
        ],
    ),
    ExperienceEntry(
        id="safesend-intern-2022",
        company="SafeSend Technologies Private Limited",
        title="Software Engineering Intern",
        dates="Jun 2022 — Sep 2022",
        location="Bengaluru, Karnataka",
        bullets=[
            "Worked on the same technologies as the full-time role — ASP.NET Web APIs, SQL Server, ReactJS.",
        ],
    ),
]

SKILLS: List[SkillGroup] = [
    SkillGroup(
        category="Languages & Frameworks",
        items=[
            "C#", ".NET", "ASP.NET", "VB.NET", "TypeScript", "JavaScript",
            "Node.js", "ReactJS", "Redux", "Python", "Java", "C++", "HTML", "XML",
        ],
    ),
    SkillGroup(
        category="Databases",
        items=["Microsoft SQL Server", "PostgreSQL", "MySQL", "MongoDB", "MS Access"],
    ),
    SkillGroup(
        category="Cloud, CI/CD & Tooling",
        items=["Azure", "Azure DevOps", "Git", "GitHub", "OpenTelemetry (PoC)"],
    ),
    SkillGroup(
        category="Domain",
        items=[
            "Direct Debit",
            "Payment Retries",
            "Arrears Management",
            "Subscription Lifecycle",
            "Payment Reconciliation",
            "Legacy Modernization",
            "Production Support",
        ],
    ),
    SkillGroup(
        category="Architecture & Patterns",
        items=["Clean Architecture", "SOLID", "CQRS", "SAGA", "Repository Pattern", "DI"],
    ),
]

PROJECTS: List[ProjectSummary] = [
    ProjectSummary(
        id="safesend-sdk",
        name="SafeSend API SDK",
        kind="professional",
        summary="Robust SDK for SafeSend Outsourced APIs, packaged as a NuGet library. Built with SOLID, CQRS and SAGA patterns.",
        tags=["C#", ".NET", "SDK", "NuGet", "CQRS", "SAGA", "SOLID"],
    ),
    ProjectSummary(
        id="bulletin-board",
        name="Bulletin Board",
        kind="professional",
        summary="Live web app with user auth, image uploading and CRUD, using ASP.NET + AngularJS on SQL Server & Azure.",
        tags=["ASP.NET", "AngularJS", "SQL Server", "Azure"],
    ),
    ProjectSummary(
        id="payment-simulator",
        name="Payment Processing Simulator",
        kind="experiment",
        summary="Interactive visualization of a Direct Debit style payment flow — mandate → validation → processing → retries → settlement.",
        tags=["Payments", "Simulation", "State Machine"],
    ),
    ProjectSummary(
        id="retry-lab",
        name="Retry Engine Lab",
        kind="experiment",
        summary="Exponential backoff + jitter playground illustrating retry storms, idempotency and max-retry cutoffs.",
        tags=["Retries", "Backoff", "Idempotency"],
    ),
    ProjectSummary(
        id="sql-arena",
        name="SQL Arena",
        kind="experiment",
        summary="Progressive SQL challenges against a sandboxed subscriptions/payments schema.",
        tags=["SQL", "Sandbox", "Learning"],
    ),
]


# ============================================================
# Routes
# ============================================================
@api_router.get("/")
async def root() -> Dict[str, Any]:
    return {
        "service": "manas-portfolio-api",
        "version": app.version,
        "docs": "/docs",
    }


@api_router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    now = datetime.now(timezone.utc)
    # Ping mongo
    db_status = "OPERATIONAL"
    db_detail = "mongo ping ok"
    try:
        await db.command("ping")
    except Exception as exc:  # noqa: BLE001
        db_status = "DOWN"
        db_detail = f"ping failed: {exc.__class__.__name__}"

    indicators = [
        StatusIndicator(key="api", label="API", status="OPERATIONAL", detail="fastapi up"),
        StatusIndicator(key="db", label="DATABASE", status=db_status, detail=db_detail),
        StatusIndicator(
            key="payments",
            label="PAYMENT ENGINE",
            status="OPERATIONAL",
            detail="simulator ready",
        ),
        StatusIndicator(key="cicd", label="CI/CD", status="OPERATIONAL", detail="hot reload"),
        StatusIndicator(key="coffee", label="COFFEE", status="REQUIRED", detail="brew in progress"),
    ]
    return HealthResponse(
        ok=True,
        service="manas-portfolio-api",
        version=app.version,
        time=now.isoformat(),
        uptime_seconds=int((now - _START_TIME).total_seconds()),
        indicators=indicators,
    )


@api_router.get("/profile", response_model=Profile)
async def get_profile() -> Profile:
    return PROFILE


@api_router.get("/experience", response_model=List[ExperienceEntry])
async def get_experience() -> List[ExperienceEntry]:
    return EXPERIENCE


@api_router.get("/skills", response_model=List[SkillGroup])
async def get_skills() -> List[SkillGroup]:
    return SKILLS


@api_router.get("/projects", response_model=List[ProjectSummary])
async def get_projects() -> List[ProjectSummary]:
    return PROJECTS


@api_router.get("/resume")
async def get_resume() -> Dict[str, str]:
    return {"url": os.environ.get("RESUME_URL", "")}


# ---- Wire router & middleware ----
app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client() -> None:
    client.close()
