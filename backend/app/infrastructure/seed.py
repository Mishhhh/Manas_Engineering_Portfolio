"""Idempotent Mongo seed from resume source-of-truth.

Rerunning is safe: uses upsert on stable ids. Contact messages are never touched.
"""
from typing import List
from app.core import models as M
from app.core.config import get_settings
from app.infrastructure.db import get_db, Collections

_settings = get_settings()


PROFILE = M.Profile(
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
    contact=M.Contact(
        email="manasmishra0801@gmail.com",
        phone="+91 8200 733936",
        linkedin="https://www.linkedin.com/in/mishra-manas270801/",
        github="https://github.com/",
    ),
)


EXPERIENCE: List[M.ExperienceEntry] = [
    M.ExperienceEntry(
        id="xplore-2024",
        company="Xplore Technologies Pvt. Ltd",
        title="Software Engineer — Backend & Payments Systems",
        dates="Sep 2024 — Present",
        location="Pune, Maharashtra",
        order=0,
        tech=["C#", ".NET", "ASP.NET", "SQL Server", "Azure", "OpenTelemetry"],
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
    M.ExperienceEntry(
        id="safesend-2022",
        company="SafeSend Technologies Private Limited",
        title="Associate Software Engineer L1",
        dates="Sep 2022 — Jun 2024",
        location="Bengaluru, Karnataka",
        order=1,
        tech=["ASP.NET", "C#", "SQL Server", "ReactJS", "Redux", "Azure DevOps"],
        bullets=[
            "Developed and maintained ASP.NET web APIs, increasing document collection efficiency by 30%.",
            "Implemented Agile methodologies, CI/CD pipelines on Azure, and collaborated on client-facing websites using ReactJS and Redux.",
            "Optimized data retrieval processes using Microsoft SQL Server for backend management.",
        ],
    ),
    M.ExperienceEntry(
        id="safesend-intern-2022",
        company="SafeSend Technologies Private Limited",
        title="Software Engineering Intern",
        dates="Jun 2022 — Sep 2022",
        location="Bengaluru, Karnataka",
        order=2,
        tech=["ASP.NET", "SQL Server", "ReactJS"],
        bullets=[
            "Contributed to ASP.NET Web APIs and React front-end alongside the full-time engineering team as a summer intern before converting to a full-time role.",
        ],
    ),
]


SKILLS: List[M.SkillGroup] = [
    M.SkillGroup(
        category="Languages & Frameworks",
        items=["C#", ".NET", "ASP.NET", "VB.NET", "TypeScript", "JavaScript",
               "Node.js", "ReactJS", "Redux", "Python", "Java", "C++", "HTML", "XML"],
    ),
    M.SkillGroup(
        category="Databases",
        items=["Microsoft SQL Server", "PostgreSQL", "MySQL", "MongoDB", "MS Access"],
    ),
    M.SkillGroup(
        category="Cloud, CI/CD & Tooling",
        items=["Azure", "Azure DevOps", "Git", "GitHub", "OpenTelemetry (PoC)"],
    ),
    M.SkillGroup(
        category="Domain — Payments",
        items=["Direct Debit", "Payment Retries", "Arrears Management",
               "Subscription Lifecycle", "Payment Reconciliation",
               "Legacy Modernization", "Production Support"],
    ),
    M.SkillGroup(
        category="Architecture & Patterns",
        items=["Clean Architecture", "SOLID", "CQRS", "SAGA", "Repository Pattern",
               "Dependency Injection"],
    ),
]


PROJECTS: List[M.Project] = [
    M.Project(
        id="safesend-sdk",
        name="SafeSend API SDK",
        kind="professional",
        year="2023",
        order=0,
        summary="Robust SDK for SafeSend Outsourced APIs, packaged as a NuGet library and built with SOLID, CQRS and SAGA patterns.",
        problem=(
            "Downstream teams and partners integrating with SafeSend's outsourced APIs "
            "wrote repetitive HTTP glue, inconsistent error handling and diverging retry "
            "logic. Onboarding a new consumer took days."
        ),
        context=(
            "Internal .NET consumers and external partners needed a stable, versioned "
            "way to call SafeSend endpoints without leaking transport concerns into "
            "business code."
        ),
        role="Backend engineer — designed and implemented the SDK end-to-end.",
        architecture_nodes=[
            M.ProjectArchitectureNode(id="client", label="Consumer App", role="client",
                description="Any .NET consumer that installs the NuGet package."),
            M.ProjectArchitectureNode(id="sdk", label="SafeSend SDK", role="library",
                description="Facade + command/query handlers + typed clients."),
            M.ProjectArchitectureNode(id="cqrs", label="CQRS Handlers", role="pattern",
                description="Commands (mutations) and Queries (reads) dispatched independently."),
            M.ProjectArchitectureNode(id="saga", label="SAGA Orchestrator", role="pattern",
                description="Coordinates multi-step API workflows with compensations."),
            M.ProjectArchitectureNode(id="http", label="Typed HTTP Client", role="transport",
                description="Retries, auth, correlation ids, telemetry."),
            M.ProjectArchitectureNode(id="api", label="SafeSend Outsourced API", role="external",
                description="Remote API surface for document + user workflows."),
        ],
        architecture_edges=[
            M.ProjectArchitectureEdge.model_validate({"from": "client", "to": "sdk"}),
            M.ProjectArchitectureEdge.model_validate({"from": "sdk", "to": "cqrs"}),
            M.ProjectArchitectureEdge.model_validate({"from": "cqrs", "to": "saga"}),
            M.ProjectArchitectureEdge.model_validate({"from": "saga", "to": "http"}),
            M.ProjectArchitectureEdge.model_validate({"from": "http", "to": "api"}),
        ],
        technology=["C#", ".NET", "NuGet", "HttpClient", "Polly", "xUnit"],
        implementation=(
            "Package exposes a small facade; commands and queries are dispatched to "
            "handlers; a SAGA coordinates multi-call workflows with compensating actions. "
            "Cross-cutting concerns (retries, auth, correlation) live inside a typed "
            "HttpClient so consumer code stays clean."
        ),
        challenges=[
            "Balancing SDK ergonomics vs. exposing enough hooks for advanced consumers.",
            "Deciding when to retry vs. surface errors to the caller.",
            "Backwards-compatible versioning as APIs evolved.",
        ],
        decisions=[
            "CQRS to keep read/write concerns separate and testable.",
            "SAGA for multi-call flows that need compensations, not distributed transactions.",
            "Ship as a NuGet package so consumers pin versions.",
        ],
        lessons=[
            "SDKs live and die by their default behaviours — retries, timeouts, logging.",
            "SOLID pays back tenfold once external partners consume your library.",
        ],
        tags=["C#", ".NET", "SDK", "NuGet", "CQRS", "SAGA", "SOLID"],
    ),
    M.Project(
        id="bulletin-board",
        name="Bulletin Board",
        kind="professional",
        year="2022",
        order=1,
        summary="Live web app with user auth, image uploading and CRUD, using ASP.NET + AngularJS on SQL Server & Azure.",
        problem=(
            "Team needed a lightweight internal board for posting announcements, "
            "images and short notes with sessioned access and audit trail."
        ),
        context="Delivered during my time at SafeSend Technologies.",
        role="Full-stack — auth, CRUD APIs, image upload path and front-end.",
        architecture_nodes=[
            M.ProjectArchitectureNode(id="browser", label="Browser (AngularJS)", role="client",
                description="Single-page UI making REST calls."),
            M.ProjectArchitectureNode(id="api", label="ASP.NET Web API", role="api",
                description="Auth + CRUD endpoints for posts and uploads."),
            M.ProjectArchitectureNode(id="db", label="SQL Server", role="database",
                description="Posts, users, sessions."),
            M.ProjectArchitectureNode(id="azure", label="Azure Blob Storage", role="external",
                description="Uploaded images."),
        ],
        architecture_edges=[
            M.ProjectArchitectureEdge.model_validate({"from": "browser", "to": "api"}),
            M.ProjectArchitectureEdge.model_validate({"from": "api", "to": "db"}),
            M.ProjectArchitectureEdge.model_validate({"from": "api", "to": "azure"}),
        ],
        technology=["ASP.NET", "AngularJS", "SQL Server", "Azure"],
        implementation=(
            "ASP.NET Web API with session-based auth, image uploads to Azure blob "
            "storage, AngularJS front-end talking to REST endpoints."
        ),
        challenges=[
            "Session handling across page reloads.",
            "Efficient image upload without blocking the request pipeline.",
        ],
        decisions=[
            "Server-side sessions for simplicity given the internal user base.",
            "Blob storage for images so DB stays small and query-hot.",
        ],
        lessons=[
            "Separating file storage from the relational store keeps a small app snappy.",
        ],
        tags=["ASP.NET", "AngularJS", "SQL Server", "Azure"],
    ),
    M.Project(
        id="portfolio-os",
        name="Portfolio OS (this site)",
        kind="personal",
        year="2026",
        order=2,
        summary="An engineer's personal operating system — the site itself is the project. Interactive terminal, live status, project explorer, and later: payment simulator, SQL arena, RAG, incident sim, observability, admin CMS.",
        problem=(
            "Static portfolios don't demonstrate engineering; they demonstrate a "
            "designer's Figma file. I wanted a portfolio that a hiring engineer could "
            "click through and probe."
        ),
        context="Built on Emergent platform: FastAPI + React + MongoDB, dark-first UI, all data-driven.",
        role="Sole engineer — architecture, backend, frontend, design system.",
        architecture_nodes=[
            M.ProjectArchitectureNode(id="visitor", label="Visitor", role="client",
                description="Recruiter / engineer / curious visitor."),
            M.ProjectArchitectureNode(id="react", label="React + Tailwind", role="frontend",
                description="Portfolio UI + Engineering labs + AI assistant."),
            M.ProjectArchitectureNode(id="api", label="FastAPI (layered)", role="api",
                description="Portfolio.API, Application, Core, Infrastructure — Python analog to spec."),
            M.ProjectArchitectureNode(id="mongo", label="MongoDB", role="database",
                description="Portfolio data, demo data, admin CMS store."),
            M.ProjectArchitectureNode(id="llm", label="Emergent LLM", role="external",
                description="Ask Manas RAG assistant (Phase 8)."),
        ],
        architecture_edges=[
            M.ProjectArchitectureEdge.model_validate({"from": "visitor", "to": "react"}),
            M.ProjectArchitectureEdge.model_validate({"from": "react", "to": "api"}),
            M.ProjectArchitectureEdge.model_validate({"from": "api", "to": "mongo"}),
            M.ProjectArchitectureEdge.model_validate({"from": "api", "to": "llm"}),
        ],
        technology=["FastAPI", "Python", "React", "Tailwind", "MongoDB", "Motor"],
        implementation=(
            "Backend split into api/application/core/infrastructure. Content is loaded "
            "from Mongo via an idempotent seeder derived from the resume. Frontend "
            "renders a hero, live-polling system status, and an interactive terminal."
        ),
        challenges=[
            "Making the site feel like an engineering tool without becoming gimmicky.",
            "Keeping the terminal responsive with real backend calls.",
        ],
        decisions=[
            "Data-driven content — no facts hardcoded in the JSX.",
            "Layered backend so admin CMS + RAG land cleanly in later phases.",
        ],
        lessons=[
            "A portfolio that behaves like a product is far more convincing than one that describes it.",
        ],
        tags=["FastAPI", "React", "MongoDB", "Portfolio", "Dev Tools"],
    ),
]


async def seed_if_needed() -> dict:
    """Idempotent seed: upserts profile / experience / skills / projects by stable ids."""
    db = get_db()
    counts = {"profile": 0, "experience": 0, "skills": 0, "projects": 0}

    # Profile (single doc, id="me")
    await db[Collections.PROFILE].update_one(
        {"_id": "me"},
        {"$set": {**PROFILE.model_dump(), "_id": "me"}},
        upsert=True,
    )
    counts["profile"] = 1

    # Experience
    for entry in EXPERIENCE:
        await db[Collections.EXPERIENCE].update_one(
            {"_id": entry.id},
            {"$set": {**entry.model_dump(), "_id": entry.id}},
            upsert=True,
        )
        counts["experience"] += 1

    # Skills — store as ordered docs keyed by category slug
    for i, group in enumerate(SKILLS):
        slug = group.category.lower().replace(" ", "-").replace("—", "").replace("&", "and")
        await db[Collections.SKILLS].update_one(
            {"_id": slug},
            {"$set": {**group.model_dump(), "_id": slug, "order": i}},
            upsert=True,
        )
        counts["skills"] += 1

    # Projects
    for p in PROJECTS:
        await db[Collections.PROJECTS].update_one(
            {"_id": p.id},
            {"$set": {**p.model_dump(by_alias=True), "_id": p.id}},
            upsert=True,
        )
        counts["projects"] += 1

    # Indexes
    await db[Collections.PROJECTS].create_index("order")
    await db[Collections.EXPERIENCE].create_index("order")
    await db[Collections.SKILLS].create_index("order")
    await db[Collections.CONTACT].create_index("created_at")

    return counts
