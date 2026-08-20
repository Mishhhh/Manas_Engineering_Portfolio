# Manas Mishra Portfolio OS — PRD

## Original problem statement
Build a production-quality **interactive developer portfolio** for Manas Mishra — a
Backend Software Engineer focused on Payments (.NET / C# / SQL Server / APIs / Cloud).
Not a static portfolio. The site itself must be the project — combining professional
portfolio + interactive engineering demonstrations + interview playground +
technical learning dashboard + AI/RAG assistant + admin CMS.

## Users
1. Recruiter — quick intro, experience, skills, projects, resume, contact
2. Engineer / Interviewer — architecture, tradeoffs, code, DB design, debugging
3. Curious visitor — terminal, simulations, easter eggs, AI Q&A

## Architecture
- Frontend: React 19 (CRA + craco), Tailwind, shadcn/ui, lucide-react, react-router
- Backend: FastAPI 0.110 in a layered package `/app/backend/app/{core,application,infrastructure,api}`
  - `core/` — Pydantic domain models + config + errors
  - `infrastructure/` — Mongo client + idempotent seeder
  - `application/` — services (Profile/Experience/Skills/Projects/Contact/Health)
  - `api/` — FastAPI routers + DTOs
- DB: MongoDB (motor async) — collections: `portfolio_profile`, `portfolio_experience`,
  `portfolio_skills`, `portfolio_projects`, `portfolio_contact_messages`
- LLM (Phase 8): Emergentintegrations chat via Universal Key (GPT-5.6 planned)
- Auth (Phase 9): JWT for admin CMS

## Design language
IBM Plex Sans + JetBrains Mono, dark base #050505, sharp 1px zinc-800 borders,
no purple gradients, no glassmorphism. Accents used *functionally only*: Volt
Blue #007AFF, Cyan #00E5FF, Alert Yellow #FFBF00, Error Red #FF3B30, Terminal
Green #00FF41. See `/app/design_guidelines.json`.

## Implemented so far (Feb 2026)

### Phase 1 — Foundation
- Hero, System Status (5-cell live poll of `/api/health`), Interactive Terminal shell
- `/api/{health,profile,experience,skills,projects,resume}`
- Design tokens, fonts, engineering grid backdrop

### Phase 2 — Portfolio layer + engineering skeleton + backend refactor
- Backend refactored into layered `app/` package (see Architecture)
- Idempotent Mongo seed populates profile/experience/skills/projects on startup
- New routes: single-project detail `GET /api/projects/{id}`, `GET /api/projects?kind=`,
  contact `POST /api/contact` (with Pydantic validation → 422 & 201),
  `POST /api/admin/seed?token=…` (401 without token) — full OpenAPI tags at `/docs`
- New pages: `/about`, `/experience`, `/projects`, `/skills`, `/resume`, `/contact`, `/labs`, `*`
- Portfolio sections: About, Experience (timeline), Projects (filter + detail overlay),
  Skills matrix, Resume viewer (embedded PDF + download), Contact form (POST /api/contact)
- Command palette (Cmd/Ctrl+K) with route navigation + terminal deep-links
- Engineering layer: Terminal (unchanged), Project Architecture Explorer (clickable node graph),
  API Playground (endpoint list + execute + status/time/response inspector)
- Mobile hamburger drawer; all filters wrap on mobile; footer contrast bumped
- Test suite: `/app/backend/tests/backend_test.py` (19/19 pytest) + Playwright e2e via testing_agent

## Backlog (in priority order)
- **P0 · Phase 3** Payment Processing Simulator (mandate → validation → processing → retries → settlement, scenario switcher)
- **P0 · Phase 4** Retry Engine Lab (exponential backoff + jitter, retry storm demo)
- **P0 · Phase 5** SQL Arena (sandboxed challenges on subscriptions/payments schema)
- **P1 · Phase 6** Production Incident Simulator (logs/metrics/traces + RCA prompts)
- **P1 · Phase 7** Observability Dashboard (recharts panels)
- **P0 · Phase 8** "Ask Manas" — RAG assistant grounded in resume/projects (GPT-5.6)
- **P1 · Phase 9** Admin CMS (JWT auth) editing projects/skills/journal/KB
- **P2 · Phase 10** Engineering Journal + Coding Challenges
- **P2 · Phase 11** Legacy Modernization Lab + SDK Showcase
- **P2 · Phase 12** SEO polish · Health JSON schema · Dockerfile · CI/CD docs

## Contact (source-of-truth)
- Email: manasmishra0801@gmail.com
- Phone: +91 8200 733936
- LinkedIn: https://www.linkedin.com/in/mishra-manas270801/
- GitHub: (placeholder — user to supply)

## Admin
- Test@test.com / TestPass — seeded via backend/.env; login UI lands in Phase 9.
  Meanwhile the value is used as the admin token on `POST /api/admin/seed?token=…`.
