# Portfolio OS — Architecture (Phase 1)

## Stack
- **Frontend**: React 19 · CRA + craco · TailwindCSS · shadcn/ui · lucide-react · framer-motion (available, unused yet)
- **Backend**: FastAPI 0.110 · Uvicorn (via supervisor) · Pydantic v2 · motor (async Mongo)
- **DB**: MongoDB — reserved for Phase 3+ (payment/retry/arrears demo state, admin CMS content, RAG KB)
- **LLM**: `emergentintegrations` chat (Phase 8 — GPT-5.6-terra via Emergent Universal Key)

## Repo layout
```
/app
├── backend/
│   ├── server.py           # FastAPI app + phase-1 read routes
│   ├── requirements.txt
│   └── .env                # MONGO_URL, DB_NAME, EMERGENT_LLM_KEY, ADMIN_*, RESUME_URL
├── frontend/
│   └── src/
│       ├── App.js / index.js
│       ├── index.css       # design tokens + fonts + eng-grid + terminal cursor
│       ├── lib/api.js      # axios client + endpoint map
│       ├── pages/HomePage.jsx
│       └── components/portfolio/
│           ├── TopBar.jsx
│           ├── Hero.jsx
│           ├── SystemStatus.jsx
│           └── Terminal.jsx
├── design_guidelines.json  # dark-first engineering aesthetic
└── memory/
    ├── PRD.md
    └── test_credentials.md
```

## API surface (Phase 1)
| Method | Path              | Purpose                                       |
| ------ | ----------------- | --------------------------------------------- |
| GET    | /api/             | service info                                  |
| GET    | /api/health       | live indicators for the System Status panel   |
| GET    | /api/profile      | identity + contact + summary                  |
| GET    | /api/experience   | resume-grounded work history                  |
| GET    | /api/skills       | grouped technical skills                      |
| GET    | /api/projects     | project summaries (professional/experiments)  |
| GET    | /api/resume       | public resume PDF URL                         |

## Page / component structure
```
HomePage
├── TopBar          — sticky command-center header
├── Hero            — identity + tagline + CTAs + marker card
├── SystemStatus    — 5-cell grid polling /api/health
├── Terminal        — real interactive shell (history, ctrl+L, dispatch to /api/*)
├── RoadmapSection  — phase 1..9 status grid
└── Footer
```

## Deployment
- Runs on Emergent platform (supervisor manages `frontend` on :3000 and `backend` on :8001)
- Frontend calls `process.env.REACT_APP_BACKEND_URL` — all backend routes prefixed `/api`
- Mongo via `MONGO_URL` env var (single source), DB name via `DB_NAME`.
- Later: Dockerfile + CI/CD pipeline docs in Phase 12.

## Phase-by-phase plan
1. **Foundation** — Hero + Status + Terminal + API skeleton  *(this phase — ✅)*
2. **Project Explorer** — detail pages with architecture diagrams
3. **Payment Simulator** — interactive state machine (visual + JSON side by side)
4. **Retry Engine Lab** — backoff calculator + timeline
5. **SQL Arena** — sandboxed SELECT-only executor over seeded schema
6. **Incident Simulator** — fictional P1s with logs/traces
7. **Observability Dashboard** — recharts panels
8. **Ask Manas (RAG)** — inline-context Q&A grounded in resume + projects
9. **Admin CMS** — JWT + CRUD editor for projects/skills/journal/KB
10. **Journal + Challenges** — content modules
11. **Legacy Modernization Lab + SDK Showcase** — side-by-side ASP vs .NET
12. **Testing + CI/CD + Deployment docs**
