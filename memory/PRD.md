# Manas Mishra Portfolio OS — PRD

## Original problem statement
Build a production-quality **interactive developer portfolio** for Manas Mishra — a
Backend Software Engineer focused on Payments (.NET / C# / SQL Server / APIs / Cloud).
Not a static portfolio. The site itself must be the project — combining professional
portfolio + interactive engineering demonstrations + interview playground +
technical learning dashboard + AI/RAG assistant + admin CMS.

## Users
1. **Recruiter** — quick intro, experience, skills, projects, resume, contact
2. **Engineer / Interviewer** — architecture, tradeoffs, code, DB design, debugging
3. **Curious visitor** — terminal, simulations, easter eggs, AI Q&A

## Core requirements (source-of-truth: Manas's resume PDF)
- Positioning: Backend Software Engineer · Payments · .NET · C# · SQL Server
- Real companies from resume: Xplore Technologies (2024–present), SafeSend Technologies (2022–2024)
- Real projects: SafeSend API SDK (NuGet, SOLID/CQRS/SAGA), Bulletin Board (ASP.NET + AngularJS)
- Do NOT fabricate metrics, dates, employers or achievements.

## Architecture
- **Frontend**: React 19 (CRA + craco) · TailwindCSS · shadcn/ui · lucide-react
- **Backend**: FastAPI (Python) — routes prefixed `/api`
- **DB**: MongoDB (portfolio uses it as read-through cache + admin CMS store)
- **AI**: `emergentintegrations` LLM chat via Emergent Universal Key (GPT-5.6-terra planned)
- **Auth**: JWT for admin CMS (Phase 9)

## Design language
Engineering command-center. IBM Plex Sans + JetBrains Mono. Dark base #050505, sharp
1px zinc-800 borders, no purple gradients, no glassmorphism. Accents used *functionally*
only: Volt Blue #007AFF, Cyan #00E5FF, Alert Yellow #FFBF00, Error Red #FF3B30,
Terminal Green #00FF41. See `/app/design_guidelines.json`.

## What's been implemented (2026-02)
### Phase 1 — Foundation ✅
- Backend API: `/api/health`, `/api/profile`, `/api/experience`, `/api/skills`,
  `/api/projects`, `/api/resume` (resume from public asset URL)
- Frontend HomePage with:
  - Sticky command-center TopBar (contact icons, live clock, resume CTA)
  - Hero (name, title, tagline, availability badge, stack tags, dual CTAs, identity marker card)
  - System Status grid (polls `/api/health` every 5s — API / DB / PAYMENT ENGINE / CI-CD / COFFEE)
  - Interactive Terminal (real shell with history, ↑/↓, ctrl+L; commands: help, about,
    skills, experience, projects, architecture, contact, resume, whoami, echo, date,
    coffee, sudo hire-manas, status, clear)
  - Roadmap section (phases 1–9)
  - Footer

## Backlog (in priority order)
- **P0 · Phase 2** Project Explorer (Problem / Context / Role / Architecture / Tech / Impl / Challenges / Decisions / Lessons)
- **P0 · Phase 3** Payment Processing Simulator (mandate → validation → processing → retries → settlement, scenario switcher)
- **P1 · Phase 4** Retry Engine Lab (backoff visualizer)
- **P1 · Phase 5** SQL Arena (sandbox challenges on subscriptions/payments schema)
- **P1 · Phase 6** Incident Simulator (P1 incidents with logs/metrics/traces & RCA prompts)
- **P1 · Phase 7** Observability Dashboard (recharts: latency, errors, SLOs)
- **P0 · Phase 8** Ask Manas — RAG assistant grounded in resume + project descriptions
- **P1 · Phase 9** Admin CMS (JWT auth · projects / skills / journal / knowledge base)
- **P2 · Phase 10** Engineering Journal & Coding Challenges
- **P2 · Phase 11** Legacy Modernization Lab + SDK Showcase
- **P2 · Phase 12** Tests · Health · Deployment docs · SEO polish

## Contact (source-of-truth)
- Email: manasmishra0801@gmail.com
- Phone: +91 8200 733936
- LinkedIn: https://www.linkedin.com/in/mishra-manas270801/
- GitHub: (placeholder — user to supply)
