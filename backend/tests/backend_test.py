"""Backend API tests for Manas Mishra Portfolio-OS (Phase 2)."""
import os
import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
backend_env = dotenv_values("/app/backend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")
ADMIN_PASSWORD = backend_env.get("ADMIN_PASSWORD")


@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- meta: health / resume ---------------------------------------------------
class TestMeta:
    def test_health(self, api):
        r = api.get(f"{BASE_URL}/api/health", timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is True
        keys = [i["key"] for i in d["indicators"]]
        assert keys == ["api", "db", "payments", "cicd", "coffee"], keys
        assert d["indicators"][1]["status"] == "OPERATIONAL"

    def test_resume(self, api):
        r = api.get(f"{BASE_URL}/api/resume", timeout=30)
        assert r.status_code == 200, r.text
        assert isinstance(r.json()["url"], str) and len(r.json()["url"]) > 0


# --- portfolio content -------------------------------------------------------
class TestProfile:
    def test_profile(self, api):
        r = api.get(f"{BASE_URL}/api/profile", timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["name"] == "Manas Mishra"
        assert d["title"] == "Backend Software Engineer"
        assert d["contact"]["email"] == "manasmishra0801@gmail.com"
        assert "_id" not in d


class TestExperience:
    def test_experience_order(self, api):
        r = api.get(f"{BASE_URL}/api/experience", timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert len(d) == 3, d
        assert [e["id"] for e in d] == ["xplore-2024", "safesend-2022", "safesend-intern-2022"]
        assert "Xplore" in d[0]["company"]


class TestSkills:
    def test_skills_groups(self, api):
        r = api.get(f"{BASE_URL}/api/skills", timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert len(d) >= 5, len(d)
        for g in d:
            assert isinstance(g["items"], list) and len(g["items"]) > 0
        labels = [g["category"] for g in d]
        assert "Languages & Frameworks" in labels, labels
        assert "Domain — Payments" in labels, labels


class TestProjects:
    def test_list_all(self, api):
        r = api.get(f"{BASE_URL}/api/projects", timeout=30)
        assert r.status_code == 200, r.text
        ids = [p["id"] for p in r.json()]
        assert sorted(ids) == sorted(["safesend-sdk", "bulletin-board", "portfolio-os"]), ids

    def test_list_professional(self, api):
        r = api.get(f"{BASE_URL}/api/projects", params={"kind": "professional"}, timeout=30)
        assert r.status_code == 200, r.text
        ids = sorted(p["id"] for p in r.json())
        assert ids == sorted(["safesend-sdk", "bulletin-board"]), ids

    def test_list_bad_kind(self, api):
        r = api.get(f"{BASE_URL}/api/projects", params={"kind": "bogus"}, timeout=30)
        assert r.status_code == 422, r.status_code

    def test_project_detail(self, api):
        r = api.get(f"{BASE_URL}/api/projects/safesend-sdk", timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert len(d["architecture_nodes"]) >= 5, d["architecture_nodes"]
        assert len(d["architecture_edges"]) >= 4, d["architecture_edges"]
        for field in ["problem", "context", "role", "implementation", "challenges", "decisions", "lessons"]:
            assert d.get(field), f"empty field: {field}"

    def test_project_not_found(self, api):
        r = api.get(f"{BASE_URL}/api/projects/does-not-exist", timeout=30)
        assert r.status_code == 404, r.status_code
        d = r.json()
        assert d["ok"] is False
        assert d["code"] == "project_not_found"
        assert d.get("message")


# --- contact -----------------------------------------------------------------
class TestContact:
    created_ids = []

    def test_contact_valid(self, api):
        payload = {
            "name": "TEST_QA",
            "email": "qa_test@example.com",
            "subject": "TEST_subject",
            "message": "TEST hello there this is long enough",
        }
        r = api.post(f"{BASE_URL}/api/contact", json=payload, timeout=30)
        assert r.status_code == 201, r.text
        d = r.json()
        assert d["ok"] is True
        assert isinstance(d["id"], str) and d["id"]
        assert d.get("message")
        TestContact.created_ids.append(d["id"])

    def test_contact_invalid_email(self, api):
        r = api.post(f"{BASE_URL}/api/contact", json={
            "name": "TEST_QA", "email": "not-an-email",
            "subject": "s", "message": "long enough message"}, timeout=30)
        assert r.status_code == 422, r.status_code

    def test_contact_short_message(self, api):
        r = api.post(f"{BASE_URL}/api/contact", json={
            "name": "TEST_QA", "email": "qa_test@example.com",
            "subject": "subject", "message": "hi"}, timeout=30)
        assert r.status_code == 422, r.status_code

    def test_contact_missing_fields(self, api):
        r = api.post(f"{BASE_URL}/api/contact", json={"name": "x"}, timeout=30)
        assert r.status_code == 422, r.status_code

    def test_contact_persisted_in_mongo(self, api):
        assert TestContact.created_ids, "no contact created"
        import asyncio
        from motor.motor_asyncio import AsyncIOMotorClient

        async def check(doc_id):
            client = AsyncIOMotorClient(backend_env["MONGO_URL"])
            db = client[backend_env["DB_NAME"]]
            doc = await db["portfolio_contact_messages"].find_one({"_id": doc_id})
            client.close()
            return doc

        doc = asyncio.get_event_loop().run_until_complete(check(TestContact.created_ids[0]))
        assert doc is not None, "contact message not persisted"
        assert doc["email"] == "qa_test@example.com"
        assert doc["name"] == "TEST_QA"


# --- admin -------------------------------------------------------------------
class TestAdmin:
    def test_seed_no_token(self, api):
        r = api.post(f"{BASE_URL}/api/admin/seed", timeout=60)
        assert r.status_code == 401, r.status_code

    def test_seed_wrong_token(self, api):
        r = api.post(f"{BASE_URL}/api/admin/seed", params={"token": "nope"}, timeout=60)
        assert r.status_code == 401, r.status_code

    def test_seed_ok(self, api):
        r = api.post(f"{BASE_URL}/api/admin/seed", params={"token": ADMIN_PASSWORD}, timeout=60)
        assert r.status_code == 200, r.text
        d = r.json()
        assert isinstance(d["counts"], dict) and d["counts"]


def test_cleanup_contact_messages():
    import asyncio
    from motor.motor_asyncio import AsyncIOMotorClient

    async def clean():
        client = AsyncIOMotorClient(backend_env["MONGO_URL"])
        db = client[backend_env["DB_NAME"]]
        await db["portfolio_contact_messages"].delete_many({"name": "TEST_QA"})
        client.close()

    asyncio.new_event_loop().run_until_complete(clean())
