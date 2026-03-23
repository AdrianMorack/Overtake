# 🏁 OvertakeHQ — F1 Prediction Game

A full-stack Formula 1 prediction platform where players join **Grids**, predict race outcomes, and compete on leaderboards. Features live race streaming, qualifying scoring, real F1 standings, and fully automated result syncing via GitHub Actions.

---

## Technology Stack

### Backend
- **Node.js 20** + **TypeScript 5**
- **Express 4** — REST API framework
- **Prisma 5** — ORM with PostgreSQL
- **JWT** — Access + refresh token authentication
- **Zod** — Request validation
- **node-cron** — Scheduled jobs for race sync & scoring

### Frontend
- **React 18** — UI framework
- **TypeScript 5** — Type safety
- **Vite 5** — Dev server & build tool
- **React Router v6** — Client-side routing
- **EventSource** — SSE for live race streaming

### Python Service
- **FastAPI** — Async web framework
- **FastF1** — F1 telemetry & timing data
- **uvicorn** — ASGI server

### Infrastructure
- **PostgreSQL 16** — Primary database
- **Docker Compose** — Local development & production orchestration
- **nginx** — Frontend static file serving (production)

### External APIs
- **FastF1 Python Library** — F1 timing data (race sessions, drivers, positions, laps, telemetry)
- **Jolpica / Ergast API** — Official F1 championship standings (P1–P10 points, all drivers)

---

## 1. System Architecture Overview

```
┌──────────────┐      ┌──────────────────────┐      ┌───────────────┐
│   React SPA  │─────▶│  Express REST API     │─────▶│  PostgreSQL   │
│  (port 3000) │ HTTP │  (port 4000)          │Prisma│  (port 5432)  │
└──────────────┘      │                       │      └───────────────┘
                      │  ┌──────────────────┐ │
                      │  │ Cron Jobs        │ │      ┌───────────────┐
                      │  │  • Season sync   │─┼─────▶│ FastF1 Service│
                      │  │  • Quali results │ │      │  (port 8100)  │
                      │  │  • Race results  │ │      │   Python API  │
                      │  │  • Live SSE      │ │      └───────────────┘
                      │  └──────────────────┘ │
                      └──────────────────────┘
                                 │
                      ┌──────────▼──────────┐
                      │  GitHub Actions      │
                      │  • Weekly sync       │
                      │  • Live detection    │
                      │  • Keep-alive ping   │
                      │  • DB backups        │
                      └─────────────────────┘
```

**Data flow:**
1. Cron syncs race schedule + driver/team data from FastF1 into Postgres
2. Users authenticate (JWT access + refresh tokens) → submit predictions per race weekend
3. After qualifying/race, cron fetches results from FastF1 and scores predictions
4. F1 championship standings are fetched live from Jolpica (accurate P1–P10 points)
5. Leaderboards aggregate grid prediction points
6. During live races, SSE streams real-time positions via FastF1 service
7. GitHub Actions automates weekly syncs, race-weekend keep-alives, and DB backups

---

## 2. Database Schema

See `server/prisma/schema.prisma` for the full Prisma schema.

### Entity Relationship Diagram

```
User 1──∞ GridMembership ∞──1 Grid
User 1──∞ GridUserStats ∞──1 Grid
User 1──∞ Prediction
User 1──∞ RefreshToken

RaceWeekend 1──1 RaceResult
RaceWeekend 1──∞ Prediction

Driver ∞──1 Team
```

### Tables

| Table | Purpose |
|-------|---------|
| `users` | Registered players |
| `refresh_tokens` | JWT refresh token store (rotated on each use) |
| `grids` | Groups with a unique 6-char invite code |
| `grid_memberships` | Many-to-many users ↔ grids |
| `grid_user_stats` | Aggregate stats per user per grid (total points, races played, etc.) |
| `drivers` | F1 drivers synced from FastF1 |
| `teams` | F1 teams synced from FastF1 |
| `race_weekends` | Schedule with prediction lock times and session status |
| `race_results` | Official quali/race/fastest-lap results (P1–P3 stored) |
| `predictions` | User predictions per race per grid, with scored points |

### Race Weekend Status

| Status | Meaning |
|--------|---------|
| `UPCOMING` | Qualifying not yet complete |
| `QUALI_COMPLETE` | Qualifying scored, race pending |
| `IN_PROGRESS` | Race actively being streamed |
| `COMPLETED` | Race results scored |

### Scoring Breakdown (max 15 pts/race)

| Category | Correct → Points |
|----------|-----------------|
| Qualifying P1 | 3 |
| Qualifying P2 | 2 |
| Qualifying P3 | 1 |
| Race P1 | 3 |
| Race P2 | 2 |
| Race P3 | 1 |
| Fastest Lap | 2 |
| Top Team | 1 |

---

## 3. Backend Structure

```
server/
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── migrations/             # Version-controlled migrations
├── src/
│   ├── config/
│   │   ├── database.ts         # Prisma client singleton
│   │   └── env.ts              # Environment config with validation
│   ├── middleware/
│   │   ├── auth.ts             # JWT authentication + admin guard
│   │   ├── validate.ts         # Zod request validation
│   │   └── errorHandler.ts     # Global error handler
│   ├── routes/
│   │   ├── auth.ts             # POST /register, /login, /refresh, /logout
│   │   ├── grids.ts            # CRUD grids, join, leaderboard, admin actions
│   │   ├── predictions.ts      # Submit & retrieve predictions
│   │   ├── races.ts            # Race calendar, drivers, teams, standings, admin sync
│   │   └── live.ts             # SSE streaming + live session detection
│   ├── services/
│   │   ├── authService.ts      # Registration, login, token rotation
│   │   ├── gridService.ts      # Grid CRUD, membership, leaderboard, admin ops
│   │   ├── predictionService.ts# Prediction upsert & queries
│   │   ├── scoringService.ts   # Points calculation engine
│   │   ├── raceService.ts      # Race/driver/team queries + standings (Jolpica)
│   │   ├── liveRaceService.ts  # Real-time race position streaming via SSE
│   │   └── fastF1Client.ts     # FastF1 Python bridge client
│   ├── jobs/
│   │   └── syncF1Data.ts       # Cron jobs: season sync, quali, results, live detection
│   └── index.ts                # Express app entry point
├── Dockerfile
├── package.json
└── tsconfig.json
```

### FastF1 Python Service

```
fastf1-service/
├── main.py                     # FastAPI app with comprehensive F1 timing data
├── requirements.txt            # fastf1, fastapi, uvicorn
└── Dockerfile

Endpoints:
  GET /sessions?year={year}          # All sessions for a year
  GET /drivers?session_key={key}     # Drivers in session
  GET /position?session_key={key}    # Live/final positions
  GET /laps?session_key={key}        # Full lap timing data
  GET /intervals?session_key={key}   # Gaps and intervals
  GET /pit?session_key={key}         # Pit stop data
  GET /stints?session_key={key}      # Tyre stint information
  GET /race_control?session_key={key}# Flags, safety car, DRS
  GET /weather?session_key={key}     # Track conditions

Session keys:
  Race:       year*1000 + round       (e.g. 2026001 = 2026 Australian GP Race)
  Qualifying: year*1000 + round + 100 (e.g. 2026101 = 2026 Australian GP Qualifying)
```

---

## 4. API Routes

### Authentication (public)

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | `{email, username, password}` | Create account |
| POST | `/api/auth/login` | `{email, password}` | Get access + refresh tokens |
| POST | `/api/auth/refresh` | `{refreshToken}` | Rotate tokens |
| POST | `/api/auth/logout` | `{refreshToken}` | Revoke refresh token |

### Grids (authenticated)

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/api/grids` | `{name, season?}` | Create grid (auto-joins creator) |
| POST | `/api/grids/join` | `{code}` | Join grid by 6-char code |
| GET | `/api/grids` | — | List user's grids |
| GET | `/api/grids/:gridId` | — | Grid details with members |
| GET | `/api/grids/:gridId/leaderboard` | — | Grid standings |
| PATCH | `/api/grids/:gridId` | `{name}` | Rename grid (owner only) |
| DELETE | `/api/grids/:gridId` | — | Delete grid (owner only) |
| DELETE | `/api/grids/:gridId/members/:userId` | — | Kick member (owner only) |

### Predictions (authenticated)

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/api/predictions` | `{raceWeekendId, gridId, qualiFirst…topTeam}` | Submit/update prediction |
| GET | `/api/predictions/grid/:gridId` | — | My predictions for a grid |
| GET | `/api/predictions/race/:raceId/grid/:gridId` | — | All predictions for a race in a grid |

### Races (authenticated)

| Method | Path | Query | Description |
|--------|------|-------|-------------|
| GET | `/api/races/weekends` | `season?` | Race calendar |
| GET | `/api/races/weekends/:id` | — | Single race weekend |
| GET | `/api/races/drivers` | `season?` | Driver list |
| GET | `/api/races/teams` | `season?` | Team list |
| GET | `/api/races/standings` | `season?` | F1 championship standings (Jolpica) |
| GET | `/api/races/live/:raceId` | — | SSE stream of live race positions |
| POST | `/api/races/admin/sync` | — | Trigger season sync (admin only) |

### Health (public)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Server status |

---

## 5. Frontend Structure

```
client/src/
├── api/
│   └── client.ts               # API client with auto token refresh
├── components/
│   ├── common/
│   │   ├── DriverAutocomplete.tsx  # Searchable driver picker
│   │   └── TeamAutocomplete.tsx    # Searchable team picker
│   ├── grid/
│   │   └── GridAdminMenu.tsx       # Owner-only: rename, kick, delete
│   ├── layout/
│   │   ├── Layout.tsx              # Page shell
│   │   ├── TopNav.tsx              # Top navigation bar
│   │   └── BottomNav.tsx           # Mobile bottom navigation
│   └── predictions/
│       └── PredictionForm.tsx      # Submit/update predictions
├── contexts/
│   └── AuthContext.tsx          # Auth state + token management
├── hooks/
│   └── useLiveRace.ts           # SSE hook for live race data
├── pages/
│   ├── AuthPages.tsx            # Login & Register
│   ├── DashboardPage.tsx        # Home with grids & next race
│   ├── GridPages.tsx            # Create & Join grid
│   ├── LeaderboardPage.tsx      # Grid standings + race links + admin menu
│   ├── LiveRacePage.tsx         # Real-time race positions via SSE
│   ├── MyGridsPage.tsx          # Overview of all user grids
│   ├── PredictPage.tsx          # Submit predictions, locked view, apply-to-all
│   ├── ProfilePage.tsx          # User profile
│   ├── RacesPage.tsx            # Full season calendar
│   ├── ResultsPage.tsx          # Race results & expandable player predictions
│   └── StandingsPage.tsx        # F1 driver & constructor championship standings
├── types/
│   └── index.ts                 # TypeScript interfaces
├── App.tsx                      # Router + auth provider
└── index.tsx                    # React entry point
```

### Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/login` | AuthPages | Email + password login |
| `/register` | AuthPages | Account creation |
| `/dashboard` | DashboardPage | Grid list, next race, quick actions |
| `/grids` | MyGridsPage | All user grids |
| `/grids/create` | GridPages | Create a new grid |
| `/grids/join` | GridPages | Enter 6-char invite code |
| `/grids/:id` | LeaderboardPage | Standings + upcoming races + admin menu |
| `/grids/:id/race/:raceId/predict` | PredictPage | Prediction form with lock support |
| `/grids/:id/race/:raceId/results` | ResultsPage | Official results + all player predictions |
| `/grids/:id/live/:raceId` | LiveRacePage | SSE-driven real-time race positions |
| `/races` | RacesPage | Full season calendar with statuses |
| `/standings` | StandingsPage | F1 driver & constructor championship |
| `/profile` | ProfilePage | User profile |

---

## 6. Key Features

### F1 Championship Standings
The `/standings` page fetches real-time championship standings from the **Jolpica API** (Ergast replacement), showing accurate points for all P1–P10 finishers across every race. Falls back to local top-3 calculation if the API is unavailable. Team colors are enriched from the local DB.

### Qualifying + Race Scoring
Two separate sync jobs run every 5 minutes:
- **`syncQualiResults`** — Detects completed qualifying sessions, stores P1–P3, scores qualifying predictions, advances status to `QUALI_COMPLETE`
- **`syncRaceResults`** — Detects completed races, stores P1–P3 + fastest lap + top team, scores race predictions, advances status to `COMPLETED`

### Grid Admin Controls
Grid creators have full administrative control via a hamburger menu (⋮) on the leaderboard page:
- **Rename Grid** — Update the display name
- **Manage Members** — View all members with kick controls
- **Delete Grid** — Permanently delete with confirmation

### Prediction UX
- **Lock support** — Shows a read-only locked prediction view after the prediction lock time
- **Apply to all grids** — Toggle to submit the same prediction across all user grids at once
- **Pre-fill editing** — Existing predictions auto-populate the form
- **Smart button text** — "Update Predictions" vs "Submit Predictions"

### Live Race Streaming
SSE endpoint streams position updates every minute during active races. The `IN_PROGRESS` status is automatically detected and managed by the live session cron job.

### GitHub Actions Automation

| Workflow | Schedule | Purpose |
|----------|----------|---------|
| `sync-f1-data.yml` | Every Monday 09:00 UTC + manual | Trigger season data sync via admin API |
| `detect-live-races.yml` | Every 30 min on Fri/Sat/Sun | Trigger live session detection |
| `keep-alive.yml` | Every 10 min on Fri/Sat/Sun | Ping `/api/health` to prevent Render sleep |
| `backup-database.yml` | Scheduled + manual | Dump database and commit to repo |

All authenticated workflows use a bot refresh token stored in GitHub Secrets (`BOT_REFRESH_TOKEN`) to obtain short-lived access tokens.

---

## 7. Cron Job Schedule (Server-side)

| Cron | Job | Purpose |
|------|-----|---------|
| `0 6 * * *` | `syncSeasonData` | Daily race schedule + driver/team sync |
| `*/5 * * * *` | `syncQualiResults` | Check for completed qualifying |
| `*/5 * * * *` | `syncRaceResults` | Check for completed races + auto-score |
| `* * * * *` | `detectAndManageLiveSessions` | Detect/manage live race sessions |
| `*/4 * * * *` | `keepAlive` | Internal keep-alive ping |

---

## 8. Race Data Integration

### Sync Architecture

```
syncSeasonData (daily 06:00 UTC)
  └─▶ FastF1 /sessions      → upsert race_weekends (schedule, lock times)
  └─▶ FastF1 /drivers       → upsert drivers + teams
      (skipped gracefully on FastF1 rate-limit / 429)

syncQualiResults (every 5 min)
  └─▶ Find UPCOMING weekends past qualifyingDate
  └─▶ FastF1 /position      → store qualiFirst/Second/Third
  └─▶ scoreRace()           → score qualifying predictions
  └─▶ status → QUALI_COMPLETE

syncRaceResults (every 5 min)
  └─▶ Find non-COMPLETED weekends past raceDate
  └─▶ FastF1 /position      → store raceFirst/Second/Third
  └─▶ FastF1 /laps          → find fastest lap driver
  └─▶ FastF1 /intervals     → identify top team
  └─▶ scoreRace()           → score race predictions
  └─▶ status → COMPLETED
```

### Standings Data Flow

```
GET /api/races/standings
  └─▶ Jolpica driverStandings.json      → full championship table (P1–P10)
  └─▶ Jolpica constructorStandings.json
  └─▶ Local DB drivers/teams            → enrich with team colors
  └─▶ Fallback: local top-3 calc if Jolpica unavailable
```

### Prediction Lifecycle

```
Race announced → Users predict → Lock (1h before qualifying) →
Qualifying → quali scored (QUALI_COMPLETE) →
Race → race scored (COMPLETED) → Leaderboard updates
```

---

## 9. Quick Start

### Local Development

```bash
# 1. Install dependencies
npm install                         # Root (installs server + client)
cd fastf1-service && pip install -r requirements.txt

# 2. Setup database
cd server
cp .env.example .env               # Set DATABASE_URL + JWT secrets
npx prisma migrate dev             # Run migrations + generate client

# 3. Start all services
npm run dev                        # From root — FastF1 (8100), API (4000), UI (3000)
# Ctrl+C stops all services
```

### Production (Docker)

```bash
cp .env.example .env
docker compose up --build
# Frontend: http://localhost:3000
# Backend:  http://localhost:4000
# FastF1:   http://localhost:8100
```

### First-Time Data Sync

After starting, seed the race schedule by calling the admin sync endpoint. Your user ID must be listed in `ADMIN_USER_IDS`.

```bash
# Log in and capture the access token
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"yourpassword"}' \
  | jq -r '.accessToken')

# Trigger season sync
curl -X POST "http://localhost:4000/api/races/admin/sync?year=$(date +%Y)" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 10. Environment Variables

### Backend (`server/.env`)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/overtakehq"
JWT_SECRET="<run: openssl rand -hex 64>"
JWT_REFRESH_SECRET="<run: openssl rand -hex 64>"
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
FASTF1_BASE_URL=http://localhost:8100
ADMIN_USER_IDS=<comma-separated Prisma user IDs with admin access>
```

### Frontend (`client/.env`)

```env
VITE_API_URL=http://localhost:4000/api
```

### GitHub Secrets (for Actions)

| Secret | Purpose |
|--------|---------|
| `SERVER_URL` | Live server base URL (e.g. `https://overtakehq-server.onrender.com`) |
| `BOT_REFRESH_TOKEN` | Long-lived refresh token for the admin bot account |

---

## 11. Key Commands

```bash
# Database
npx prisma migrate dev --name <name>  # Create + apply migration
npx prisma migrate deploy             # Apply migrations (production)
npx prisma generate                   # Regenerate Prisma client after schema changes
npx prisma studio                     # Open DB GUI

# Development
npm run dev          # Start all services (from root)

# Production
docker compose up -d       # Start detached
docker compose logs -f     # Follow logs
docker compose down        # Stop all services
```

---

## 12. Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full cloud deployment guide covering Neon (database), Render (server + FastF1 service), Vercel (client), and GitHub Actions setup.

---

## 13. Troubleshooting

### TypeScript Errors After Schema Changes
```bash
cd server && npx prisma generate
# Then in VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Port Conflicts
```bash
lsof -ti :4000 | xargs kill -9
lsof -ti :3000 | xargs kill -9
lsof -ti :8100 | xargs kill -9
```

### Empty Race Calendar
```bash
curl -X POST "http://localhost:4000/api/races/admin/sync?year=$(date +%Y)" \
  -H "Authorization: Bearer $TOKEN"
```

### FastF1 Rate Limit (429)
The FastF1 service fetches data from the official F1 API, which can rate-limit heavy session loads. The season schedule sync completes first and driver/team sync is skipped automatically — re-run after a few minutes if needed.

### Docker Database Connection
```bash
docker compose up -d postgres
```
