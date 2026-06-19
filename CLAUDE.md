# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This repo contains two independent projects:

- **Root `/`** — HD-DATA-UNIFIER: TypeScript/Express/React app that unifies Excel/CSV files by `FOLIO_SIAC` key
- **`hdreams-bot/`** — PHP 8.2 recruitment chatbot (WhatsApp, Messenger, Instagram, Facebook Lead Ads) with GPT-4o AI scoring

---

## HD-DATA-UNIFIER (root)

### Commands

```bash
npm run dev          # Express + Vite on port 3010 (single process, dev mode)
npm run dev:split    # Express (port 3010) + Vite (port 5177) as separate processes
npm test             # Runs tests/mergeEngine.test.ts via tsx --test
npm run typecheck    # tsc --noEmit
npm run build        # Compiles client (Vite) + server (esbuild) to dist/
```

Quality gate before publishing: `npm run typecheck && npm test && npm run build`

### Architecture

4 layers:

1. **UI** — `src/main.tsx` — React + Vite SPA served by Vite in dev or by Express from `dist/client` in prod
2. **API** — `server.ts` — Express server on `PORT` (default 3010); `server/routes/data-unifier.ts` handles all endpoints; multer accepts up to 12 files, 25 MB each, `.xlsx`/`.csv` only
3. **Engine** — `server/data-unifier/`
   - `mergeEngine.ts` — `mergeWorkbooks()` deduplicates rows by `FOLIO_SIAC`, processes workbooks in order (first file = base), tracks conflicts; never overwrites a conflict automatically
   - `columnRules.ts` — `COLUMN_SYNONYMS` map + `MASTER_FIELDS` (16 canonical columns); synonym index built at startup
   - `archivista-agent.ts` — `runArchivistaAgent()` runs post-upload, reports FOLIO_SIAC coverage and unknown columns; does NOT delete files, overwrite conflicts, or make autonomous decisions
4. **Persistence** — `data/history.json` (job records via `JobStore`), `data/uploads/` (originals), `data/results/` (merged outputs); controlled by `DATA_UNIFIER_STORAGE` env var

### Key Invariants

- `FOLIO_SIAC` is the sole join/dedup key — never change this without updating `mergeEngine.ts` and the migration SQL
- Conflicts are recorded in `MergeConflict[]` and surfaced to the user; the engine never silently picks a winner
- Original uploaded files are never deleted or overwritten

---

## hdreams-bot/

### Commands

**Local dev (no Docker):**
```bash
# Terminal 1 — MySQL (MariaDB)
mysqld_safe --user=root &

# Terminal 2 — PHP backend
cd hdreams-bot/backend && php -S 0.0.0.0:8000 -t public/

# Terminal 3 — Frontend
cd hdreams-bot/frontend && npm run preview   # or npm run dev for HMR
```

**Production (Docker):**
```bash
cd hdreams-bot
cp .env.example .env          # fill DB_*, VITE_API_URL, VITE_API_SECRET
cp backend/.env.example backend/.env  # fill all secrets
make up                        # docker compose up --build -d
make logs                      # tail all logs
make shell-php                 # bash into php container
make migrate                   # re-run SQL migrations
```

### Architecture

- **Backend** — PHP 8.2-fpm, PSR-4 autoload (`App\` → `app/`), no framework
  - `public/index.php` — router for `/api/*`; all requests pass through `AuthMiddleware::verify()` (Bearer token)
  - `public/webhook-*.php` — Meta webhook handlers; X-Hub-Signature-256 verified via `hash_equals`
  - `app/Services/LeadScorerIA.php` — calls GPT-4o; returns fallback scores if API unavailable
  - `app/Services/CanalManager.php` — sends messages via Meta Graph API; logs errors, never throws
  - `workers/` — cron workers use `flock(LOCK_EX | LOCK_NB)` to prevent overlapping runs
  - `config/app.php` — single config file; read with `require __DIR__ . '/../config/app.php'`

- **Frontend** — React 18 + Vite + Tailwind + TanStack Query + Framer Motion + Recharts
  - `src/lib/api.js` — axios instance with `VITE_API_URL` base and `Authorization: Bearer VITE_API_SECRET` header
  - Pages: `Dashboard`, `Leads`, `Stats`

- **Database** — MySQL 8 / MariaDB; dedup relies on `UNIQUE KEY idx_canal (empresa_id, canal, canal_user_id)` — changing this index to a plain INDEX breaks `ON DUPLICATE KEY UPDATE`

- **Docker** — `Dockerfile.nginx` is multi-stage: Node 20 builds Vite → copied into nginx:1.27-alpine. Named volume `backend_vendor` prevents bind mount from clobbering Composer vendor/.

### Auth

All `/api/*` requests require `Authorization: Bearer <API_SECRET>`. Set `API_SECRET` in `backend/.env`. The frontend reads `VITE_API_SECRET` at build time (baked into JS bundle).

### Environment Variables

`backend/.env` (runtime): `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`, `APP_ENV`, `API_SECRET`, `OPENAI_API_KEY`, `META_APP_SECRET`, `META_VERIFY_TOKEN`, `WA_PHONE_ID`, `WA_TOKEN`, `FRONTEND_URL`

`hdreams-bot/.env` (Docker Compose): `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_ROOT_PASS`, `VITE_API_URL`, `VITE_API_SECRET`
