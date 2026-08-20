"""API DTOs — thin wrappers over domain models with request payloads."""
from typing import List
from pydantic import BaseModel, EmailStr, Field
from app.core import models as M


class ContactRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr
    subject: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=5, max_length=4000)


class ContactAck(BaseModel):
    ok: bool = True
    id: str
    message: str = "Thanks — I'll get back to you shortly."


class ResumeResponse(BaseModel):
    url: str


class SeedResponse(BaseModel):
    ok: bool = True
    counts: dict


# Re-export domain models as response schemas (FastAPI serialises them just fine)
Profile = M.Profile
ExperienceEntry = M.ExperienceEntry
SkillGroup = M.SkillGroup
Project = M.Project
HealthReport = M.HealthReport
ExperienceList = List[M.ExperienceEntry]
SkillsList = List[M.SkillGroup]
ProjectsList = List[M.Project]
