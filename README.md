# CraftPolicy — Legal Document Audit System

Automated Privacy Policy & Terms & Conditions analyzer powered by Claude AI.

Uploads PDF/DOCX documents → Claude analyzes against 20 GDPR criteria (Privacy) + 20 T&C criteria → scored report with tier breakdown, verbal scale, and prioritized improvements.

---

## Architecture

```
frontend/   Next.js 15 (App Router) → Vercel
backend/    Node.js / Express → Railway  (SQLite WAL on persistent volume)
```

**Flow:** Upload → `POST /api/toc/start` (HTTP 200 immediate) → fire-and-forget analysis (Privacy → 15s → T&C) → poll `/api/toc/:uid/status` → redirect to report → edit scores → publish → share link.

---

## Local Development

### Backend

```bash
cd backend
cp .env.example .env          # fill in ANTHROPIC_API_KEY + INTERNAL_API_KEY
npm install
npm run dev                   # node --watch src/server.js on PORT 3001
```

### Frontend

```bash
cd frontend
cp .env.example .env.local    # fill in INTERNAL_API_KEY + BACKEND_API_URL
npm install
npm run dev                   # Next.js dev server on PORT 3000
```

### Tests

```bash
cd backend
npm test                       # runs all tests in test/
```

---

## Deployment

### Backend → Railway

1. Create new Railway project, add service from this repo with **Root Directory = `backend`**
2. Add a **Volume** mounted at `/data`
3. Set environment variables (see `backend/.env.example`):
   - `ANTHROPIC_API_KEY`
   - `INTERNAL_API_KEY` — shared secret with frontend
   - `DATABASE_URL=/data/toc_audit.db`
4. Railway auto-detects Node.js and runs `npm start`

### Frontend → Vercel

1. Import repo, set **Root Directory = `frontend`**
2. Set environment variables (see `frontend/.env.example`):
   - `INTERNAL_API_KEY` — same value as backend
   - `BACKEND_API_URL` — Railway service URL (no trailing slash)
   - `BLOB_READ_WRITE_TOKEN` — Vercel Blob token
3. Deploy — Vercel auto-detects Next.js

### Smoke Test

```bash
./scripts/smoke-test.sh https://your-backend.up.railway.app YOUR_API_KEY
```

---

## Scoring

| Tier | Multiplier | Focus |
|------|-----------|-------|
| 1    | ×5        | Mandatory GDPR / legal requirements |
| 2    | ×4        | Core compliance |
| 3    | ×3        | Additional good practices |
| 4    | ×2        | Recommended improvements |

**Verbal scale:** 0–30% Критичен риск · 31–50% Несъответствие · 51–60% Частично · 61–75% Адекватно · 76–89% Високо · 90–100% Пълно съответствие

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/toc/start` | ✓ | Upload files, start analysis |
| GET  | `/api/toc/:uid/status` | — | Poll status |
| GET  | `/api/toc/:uid` | ✓ | Full audit + results |
| PUT  | `/api/toc/:uid/save` | ✓ | Save edited criteria |
| POST | `/api/toc/:uid/publish` | ✓ | Publish (immutable snapshot) |
| GET  | `/api/toc/share/:share_uid` | — | Public share |
| GET  | `/api/toc/dashboard` | ✓ | Paginated audit list |
| GET  | `/api/toc/questions` | — | Contextual questions |
| GET  | `/health` | — | Health check |

Auth = `x-api-key` header (proxied server-side by Next.js `/api/proxy`).
