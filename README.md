# Lead Sender

Free-form lead notes → verified email → researched + drafted → auto-sent. Every step streams live to a dashboard.

## Pipeline

```
Normalize (Gemini)
  → Permute emails (pure fn)
    → Verify (Reoon)          ── no deliverable? → DEAD
      → Research (Playwright + Gemini)
        → Draft (Gemini, streamed)
          → Send (Resend)
```

## Run it

1. Fill out `product.md` with your actual product brief.
2. Copy `backend/.env.example` → `backend/.env`, fill:
   - `GEMINI_API_KEY` — from aistudio.google.com
   - `REOON_API_KEY` — from reoon.com
   - `RESEND_API_KEY` + `RESEND_FROM` — from resend.com (must be a verified sender)
3. `docker compose up --build`
4. Open http://localhost:3000
5. Drop a `.md` file onto the dashboard (or paste notes).

Every log line is broadcast over SSE at `GET /api/stream` and rendered live in the dashboard and per-lead page.

## Layout

- `backend/app/main.py` — FastAPI + SSE endpoints
- `backend/app/pipeline.py` — Celery chain
- `backend/app/steps/*.py` — one file per step
- `backend/app/events.py` — Redis pub/sub broadcaster
- `frontend/app/page.tsx` — dashboard with log tail
- `frontend/app/leads/[id]/page.tsx` — per-lead timeline + streaming draft preview
