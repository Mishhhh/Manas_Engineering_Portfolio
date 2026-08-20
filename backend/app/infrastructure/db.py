"""Mongo client + collection accessors — infrastructure layer."""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import get_settings

_settings = get_settings()
_client = AsyncIOMotorClient(_settings.mongo_url)
_db: AsyncIOMotorDatabase = _client[_settings.db_name]


def get_db() -> AsyncIOMotorDatabase:
    return _db


def get_client() -> AsyncIOMotorClient:
    return _client


class Collections:
    PROJECTS = "portfolio_projects"
    EXPERIENCE = "portfolio_experience"
    SKILLS = "portfolio_skills"
    PROFILE = "portfolio_profile"
    CONTACT = "portfolio_contact_messages"
    PAYMENTS = "payment_simulations"
