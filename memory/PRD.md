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

### Phase 5 — Payment Processing Simulator (Feb 2026)
- Route `/lab/payment-simulator`; card on `/labs`; command-palette entry `go-payment-sim`
- Backend layered addition:
  - `app/core/payment_models.py` — PaymentMethod / Scenario / PaymentStatus / PaymentStep / PaymentEventType / PaymentSimulation / PaymentSimulationEvent
  - `app/application/payment_simulator.py` — `PaymentSimulatorService` with explicit `ALLOWED` transition matrix + background asyncio task
  - `app/api/payment_routes.py` — `/api/payment-simulator/{scenarios, payments, payments/{id}, payments/{id}/process, payments/{id}/reset}`
- Mongo collection `payment_simulations` with `created_at desc` index; embedded events array
- All 5 scenarios implemented (Success/Failure/Timeout/MandateFailure/InsufficientFunds) with correct terminal states + retry flag + failure reason
- Frontend components: 7-step Workflow visualizer with PENDING → PROCESSING → SUCCESS/FAILED/SKIPPED/WARNING states + aria-labels; Event Timeline; Result Card; clickable Architecture stack; "How this works" explainer with lifecycle + engineering-concepts cards
- API Playground exposes 3 new payment-simulator endpoints
- Tests: `payment_simulator_test.py` (16 cases) + `payment_simulator_extra_test.py` (25 cases) — 60/60 pytest via ingress
- Testing agent iter 3: backend 60/60, frontend 17/18. Iter 4: 5/5 fixes verified.

### Phase 6-8 — Retry Engine + Arrears Simulator + SQL Arena (Feb 2026)
**Phase 6 — Retry Engine** `/lab/retry-engine`
- Backend: `app/application/retry_engine.py` (pure `simulate()` — no real sleeps; exponential/fixed strategies; permanent-failure short-circuit; idempotency key preserved across attempts)
- Routes: `POST /api/retry-engine/simulate`, `GET /api/retry-engine/preset-policies`
- Frontend: policy form + attempt schedule timeline + idempotency demo + concepts card
- Integration: Payment Simulator retry-available failures now show a `btn-open-retry-engine` link

**Phase 7 — Arrears Simulator** `/lab/arrears`
- Backend: `app/application/arrears_simulator.py` (scripted attempts feed a state machine; escalates to `InArrears` once retries are exhausted; supports partial recovery + missed-cycle counting)
- Routes: `POST /api/arrears/simulate`
- Frontend: subscription config + editable scripted attempts + result banner (state, outstanding, arrears, retries, recovered) + timeline

**Phase 8 — SQL Arena** `/lab/sql-arena`
- Backend: `app/application/sql_arena.py` — aiosqlite in-memory sandbox seeded with 8 customers, 8 subscriptions, 8 mandates, 18 payments, retries, arrears; `PRAGMA query_only=1`. `validate_query()` enforces: single SELECT/WITH statement, no comments (`--` or `/* */`), no destructive keywords (INSERT/UPDATE/DELETE/DROP/ALTER/TRUNCATE/CREATE/EXEC/MERGE/ATTACH/DETACH/PRAGMA/…), 200-row cap
- `app/application/sql_challenges.py` — 12 curated challenges spanning WHERE, JOIN, DISTINCT, GROUP BY, HAVING, aggregation, window functions, self-join, CASE, month buckets, reconciliation, optimization
- Routes: `GET /schema`, `GET /challenges`, `GET /challenges/{id}`, `POST /execute`, `POST /challenges/{id}/submit`, `GET /challenges/{id}/hint?index=`, `GET /challenges/{id}/solution`
- Frontend: 3-panel (schema explorer / editor / challenge detail); Learning + Interview modes; progressive hints (never reveal all at once); solution reveal with explanation; row-set diff evaluator; progress widget with localStorage; difficulty filters
- Wire-ups: 4 lab cards on `/labs`; palette items `go-retry-engine`, `go-arrears`, `go-sql-arena`; terminal commands `sql` / `retry` / `arrears`

**Test results**
- Backend pytest: 96/96 (35 phase-2 + 25 phase-5 + 36 phase-6/7/8)
- Testing agent iter 5: backend 11/11 targeted · frontend 12/13 (SQL starter-query bug)
- Testing agent iter 6 (retest): **3/3 pass** — starter query fixed + sr-only h1 added to 6 content pages

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
