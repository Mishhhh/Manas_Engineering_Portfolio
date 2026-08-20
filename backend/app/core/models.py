"""Core domain models (Pydantic) — used by services and DTO conversions."""
from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field, EmailStr
import uuid


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


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


class ExperienceEntry(BaseModel):
    id: str
    company: str
    title: str
    dates: str
    location: str
    bullets: List[str]
    tech: List[str] = Field(default_factory=list)
    order: int = 0


class SkillGroup(BaseModel):
    category: str
    items: List[str]


class ProjectArchitectureNode(BaseModel):
    id: str
    label: str
    role: str  # e.g. controller / service / repo / external
    description: str


class ProjectArchitectureEdge(BaseModel):
    from_: str = Field(..., alias="from")
    to: str

    model_config = {"populate_by_name": True}


class Project(BaseModel):
    id: str
    name: str
    kind: str  # professional | personal | experiment
    summary: str
    problem: str
    context: str
    role: str
    architecture_nodes: List[ProjectArchitectureNode] = Field(default_factory=list)
    architecture_edges: List[ProjectArchitectureEdge] = Field(default_factory=list)
    technology: List[str] = Field(default_factory=list)
    implementation: str = ""
    challenges: List[str] = Field(default_factory=list)
    decisions: List[str] = Field(default_factory=list)
    lessons: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    year: str = ""
    order: int = 0


class ContactMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    subject: str
    message: str
    created_at: str = Field(default_factory=_iso_now)


class StatusIndicator(BaseModel):
    key: str
    label: str
    status: str
    detail: str


class HealthReport(BaseModel):
    ok: bool
    service: str
    version: str
    time: str
    uptime_seconds: int
    indicators: List[StatusIndicator]
