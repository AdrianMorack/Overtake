# 🏁 Overtake — F1 Prediction Game

A full-stack Formula 1 prediction platform where players join **Grids**, predict race outcomes, and compete on leaderboards. Features live race streaming, grid administration, and automatic scoring.

---

## Technology Stack

### Backend
- **Node.js 20** + **TypeScript 5**
- **Express 4** - REST API framework
- **Prisma 5** - ORM with PostgreSQL
- **JWT** - Access + refresh token authentication
- **Zod** - Request validation
- **node-cron** - Scheduled jobs for race sync & scoring

### Frontend
- **React 18** - UI framework
- **TypeScript 5** - Type safety
- **Vite 5** - Dev server & build tool
- **React Router v6** - Client-side routing
- **EventSource** - SSE for live race streaming

### Python Service
- **FastAPI** - Async web framework
- **FastF1** - F1 telemetry & timing data
- **uvicorn** - ASGI server

### Infrastructure
- **PostgreSQL 16** - Primary database
- **Docker Compose** - Local development & production orchestration
- **nginx** - Frontend static file serving (production)

### External APIs
- **FastF1 Python Library** - All F1 data (race sessions, drivers, positions, laps, telemetry)

---

## 1. System Architecture Overview

```
┌──────────────┐      ┌──────────────────────┐      ┌───────────────┐
│   React SPA  │─────▶│  Express REST API     │─────▶│  PostgreSQL   │
│  (port 5173) │ HTTP │  (port 4000)          │Prisma│  (port 5432)  │
└──────────────┘      │                       │      └───────────────┘
                      │  ┌──────────────────┐ │
                      │  │ Cron Jobs        │ │      ┌───────────────┐
                      │  │  • Season sync   │─┼─────▶│ FastF1 Service│
                      │  │  • Result fetch  │ │      │  (port 8100)  │
                      │  │  • Auto scoring  │ │      │   Python API  │
                      │  │  • Live race SSE │ │      └───────────────┘
                      │  └──────────────────┘ │
                      │                       │
                      └──────────────────────┘

Local development: npm run dev starts all services concurrently
Production: Docker Compose orchestrates all containers
```

**Data flow:**
1. Cron syncs race schedule + driver/team data from FastF1 into Postgres
2. Users authenticate (JWT access + refresh tokens) → submit predictions per race weekend
3. After a race, cron fetches official results from FastF1
4. Scoring engine compares predictions vs results → writes points
5. Leaderboards aggregate points per grid
6. During live races, SSE streams real-time positions via FastF1 service

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
| `refresh_tokens` | JWT refresh token store (rotated) |
| `grids` | Groups with a unique 6-char invite code |
| `grid_memberships` | Many-to-many users ↔ grids |
| `grid_user_stats` | Aggregate stats per user per grid (total points, races played, etc.) |
| `drivers` | F1 drivers synced from FastF1 |
| `teams` | F1 teams synced from FastF1 |
| `race_weekends` | Schedule with prediction lock times |
| `race_results` | Official quali/race/fastest-lap results |
| `predictions` | User predictions per race per grid, with scored points |

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
│   └── schema.prisma           # Database schema
├── src/
│   ├── config/
│   │   ├── database.ts         # Prisma client singleton
│   │   └── env.ts              # Environment config
│   ├── middleware/
│   │   ├── auth.ts             # JWT authentication guard
│   │   ├── validate.ts         # Zod request validation
│   │   └── errorHandler.ts     # Global error handler
│   ├── routes/
│   │   ├── auth.ts             # POST /register, /login, /refresh, /logout
│   │   ├── grids.ts            # CRUD grids, join, leaderboard, admin actions
│   │   ├── predictions.ts      # Submit & retrieve predictions
│   │   ├── races.ts            # Race calendar, drivers, teams, live SSE
│   │   └── live.ts             # SSE streaming for live race data
│   ├── services/
│   │   ├── authService.ts      # Registration, login, token rotation
│   │   ├── gridService.ts      # Grid CRUD, membership, leaderboard, admin operations
│   │   ├── predictionService.ts# Prediction upsert & queries
│   │   ├── scoringService.ts   # Points calculation engine
│   │   ├── raceService.ts      # Race/driver/team queries
│   │   ├── liveRaceService.ts  # Real-time race position streaming
│   │   └── fastF1Client.ts     # FastF1 Python Service client
│   ├── jobs/
│   │   └── syncF1Data.ts       # Cron jobs: season sync + result fetch + scoring
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
  GET /sessions?year={year}                    # All sessions for a year
  GET /drivers?session_key={key}               # Drivers in session
  GET /position?session_key={key}              # Live/final positions
  GET /laps?session_key={key}                  # Full lap timing data
  GET /intervals?session_key={key}             # Gaps and intervals
  GET /pit?session_key={key}                   # Pit stop data
  GET /stints?session_key={key}                # Tyre stint information
  GET /race_control?session_key={key}          # Flags, safety car, DRS
  GET /weather?session_key={key}               # Track conditions
  
Session keys: year*1000 + round (race) or year*1000 + round + 100 (qualifying)
Example: 2026001 = 2026 Australian GP Race, 2026101 = 2026 Australian GP Qualifying

Lap Data includes:
  - Full timing: lap time, sector times (1-3)
  - Speed traps: intermediate 1/2, finish line, speed trap
  - Tyre data: compound, tyre life, fresh tyre indicator
  - Track status: green/yellow/red flags per lap
  - Personal best flags and stint information
```

---

## 4. API Routes

### Authentication (public)

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | `{email, username, password}` | Create account |
| POST | `/api/auth/login` | `{email, password}` | Get tokens |
| POST | `/api/auth/refresh` | `{refreshToken}` | Rotate tokens |
| POST | `/api/auth/logout` | `{refreshToken}` | Revoke refresh token |

### Grids (authenticated)

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/api/grids` | `{name, season?}` | Create grid (auto-joins creator) |
| POST | `/api/grids/join` | `{code}` | Join grid by 6-char code |
| GET | `/api/grids` | — | List user's grids |
| GET | `/api/grids/:gridId` | — | Get grid details with members |
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
| GET | `/api/races/weekends` | `season?` | Race calendar (defaults to current year) |
| GET | `/api/races/weekends/:id` | — | Single race weekend |
| GET | `/api/races/drivers` | `season?` | Driver list |
| GET | `/api/races/teams` | `season?` | Team list |
| GET | `/api/races/live/:raceId` | — | SSE stream of live race positions |

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Server status |

---

## 5. Frontend Structure

```
client/
├── public/
│   └── index.html
├── src/
│   ├── api/
│   │   └── client.ts           # API client with auto-refresh
│   ├── components/
│   │   ├── common/
│   │   │   ├── DriverAutocomplete.tsx
│   │   │   └── TeamAutocomplete.tsx
│   │   ├── grid/
│   │   │   └── GridAdminMenu.tsx  # Owner menu (rename, kick, delete)
│   │   └── predictions/
│   │       └── PredictionForm.tsx # Submit/update predictions with success feedback
│   ├── contexts/
│   │   └── AuthContext.tsx      # Auth state + token management
│   ├── pages/
│   │   ├── AuthPages.tsx        # Login & Register
│   │   ├── DashboardPage.tsx    # Home with grids & next race
│   │   ├── GridPages.tsx        # Create & Join grid
│   │   ├── LeaderboardPage.tsx  # Grid standings + race links + admin menu
│   │   ├── PredictPage.tsx      # Submit predictions for a race
│   │   ├── RacesPage.tsx        # Full season calendar
│   │   ├── ResultsPage.tsx      # Race results & player predictions
│   │   └── LiveRacePage.tsx     # Real-time race positions stream
│   ├── styles/
│   │   └── GridAdminMenu.css    # Admin menu styling
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces
│   ├── App.tsx                  # Router + auth provider
│   └── index.tsx                # React entry point
├── Dockerfile
├── nginx.conf
├── package.json
└── tsconfig.json
```

### Pages

| Route | Page | Description |
|-------|------|-------------|
| `/login` | LoginPage | Email + password login |
| `/register` | RegisterPage | Account creation |
| `/dashboard` | DashboardPage | Grid list, next race highlight, quick actions |
| `/grids/create` | CreateGridPage | Name a new grid |
| `/grids/join` | JoinGridPage | Enter 6-char code |
| `/grids/:id` | LeaderboardPage | Standings + upcoming races + admin menu (owners) |
| `/grids/:id/race/:raceId/predict` | PredictPage | Prediction form with pre-fill & success feedback |
| `/grids/:id/race/:raceId/results` | ResultsPage | Official results + player predictions |
| `/grids/:id/live/:raceId` | LiveRacePage | SSE stream of real-time race positions |
| `/races` | RacesPage | Full calendar with race statuses |

---

## 6. Key Features

### Grid Admin Controls
Grid creators have full administrative control via a hamburger menu (⋮) on the leaderboard page:
- **Rename Grid**: Update the grid name
- **Manage Members**: View all members, kick any member (except owner)
- **Delete Grid**: Permanently delete the grid and all associated predictions

Admin actions are restricted to grid owners only. The menu is only visible to the grid creator.

### Prediction UX Enhancements
- **Success Feedback**: Green banner "✓ Predictions submitted successfully!" with 2-second auto-redirect
- **Pre-fill Editing**: Existing predictions automatically populate the form for easy updates
- **Smart Button Text**: Shows "Update Predictions" when editing, "Submit Predictions" when new
- **Edit vs Predict**: Leaderboard race buttons display "Edit" for predicted races, "Predict" for new ones

### Visual Highlighting
- **Next Race on Dashboard**: First upcoming race gets green background (#d4edda) with green left border
- **Predicted Races**: Races with submitted predictions show green styling on leaderboard
- **Live Race Badge**: Active races display "● LIVE" badge with dark background and red accent

### Live Race Streaming
- **Real-time Positions**: SSE endpoint streams position updates every 5 seconds during active races
- **FastF1 Service**: Python service provides all live race telemetry and timing data
- **5-second Timeout**: Fast failure recovery for API requests
- **Non-blocking Updates**: Fire-and-forget tick() prevents cron job blocking

### Dynamic Season Management
All season parameters default to `new Date().getFullYear()` instead of hardcoded values:
- Race calendar queries
- Driver/team listings
- Grid creation
- Sync operations

### Development Workflow
Single command starts all services concurrently:
```bash
npm run dev  # Starts FastF1 (8100), Backend (4000), Frontend (5173)
```
Uses `concurrently` with `--kill-others` flag — Ctrl+C stops everything.

---

## 7. Example Code Highlights

### Driver Autocomplete Component
`client/src/components/common/DriverAutocomplete.tsx` — Filterable dropdown that:
- Searches by first name, last name, or 3-letter code
- Shows team name and driver headshot
- Returns the driver **code** (e.g. "VER") as the value

### Prediction Form
`client/src/components/predictions/PredictionForm.tsx` — Complete form with:
- 3× DriverAutocomplete for qualifying positions
- 3× DriverAutocomplete for race positions
- 1× DriverAutocomplete for fastest lap
- 1× TeamAutocomplete for top team
- Submit button with validation (all fields required)
- **Pre-fill editing**: Automatically loads existing predictions via `api.getMyPredictions(gridId)`
- **Success feedback**: Green "✓ Predictions submitted successfully!" banner with 2-second auto-redirect
- **Smart button text**: "Update Predictions" when editing existing, "Submit Predictions" when new

### Grid Admin Menu
`client/src/components/grid/GridAdminMenu.tsx` — Hamburger menu (⋮) with owner-only actions:
- **Edit Grid Name**: Modal with text input, updates via `PATCH /api/grids/:id`
- **Manage Members**: Modal showing all members with avatars, owner badge, and kick buttons
- **Delete Grid**: Confirmation modal with warning, deletes via `DELETE /api/grids/:id`
- Visibility: Only shown when `user.id === grid.ownerId`
- Automatic data reload after successful actions

### Live Race Service
`server/src/services/liveRaceService.ts` — Real-time race position streaming:
- **SSE Event Stream**: Sends position updates every 5 seconds
- **FastF1 Service**: All data sourced from Python FastF1 service at port 8100
- **Non-blocking Cron**: Fire-and-forget initial tick prevents job blocking
- **5-second Timeout**: Fast failure recovery for API requests
- **Session Key Format**: `year*1000+round` (race) or `year*1000+round+100` (qualifying)

### Scoring Engine
`server/src/services/scoringService.ts` — Compares each prediction field against official results using case-insensitive string matching, calculates per-category breakdown, and stores total points.

### API Client with Token Refresh
`client/src/api/client.ts` — Automatically retries 401 requests after refreshing the access token. Rotates refresh tokens on each use.

---

## 8. Race Data Integration Strategy

### Data Sources
- **FastF1 Python Library** (`https://docs.fastf1.dev/`) — Official F1 timing data library
- **FastF1 Bridge Service** (port 8100) — Python FastAPI service exposing FastF1 data via REST endpoints

### Sync Architecture

```
┌─────────────────────────────────┐
│        Cron Job Schedule        │
│                                 │
│  06:00 UTC daily:               │
│    syncSeasonData(year)         │
│    • GET /sessions → upsert     │
│      race_weekends              │
│    • GET /drivers → upsert      │
│      drivers + teams            │
│                                 │
│  Every 30 minutes:              │
│    syncRaceResults()            │
│    • Find past-date, non-       │
│      completed race_weekends    │
│    • GET /position → final      │
│      classification (P1-P3)     │
│    • GET /laps → fastest lap    │
│    • Store race_results         │
│    • scoreRace() → update       │
│      prediction points          │
└─────────────────────────────────┘
```

### How Results Sync Works

1. **Season sync** (`syncSeasonData`): Runs daily. Fetches all sessions for the year from FastF1, identifies Race and Qualifying sessions, upserts `race_weekends` with computed prediction lock times (1 hour before qualifying).

2. **Result sync** (`syncRaceResults`): Runs every 30 minutes. Finds `race_weekends` where `raceDate < now` and `status != COMPLETED`. For each:
   - Fetches positional data from `/position` endpoint — takes the **last timestamped position** per driver to get the final classification
   - Fetches lap data from `/laps` endpoint — finds the lap with minimum `lap_duration` to identify the fastest lap driver
   - Resolves driver numbers to 3-letter codes
   - Upserts into `race_results`

3. **Auto-scoring** (`scoreRace`): Immediately called after results are stored. Iterates over all predictions for that race, computes per-category points, and saves `totalPoints` + `breakdown` JSON.

### Prediction Lifecycle

```
Race announced → Users submit predictions → Lock time passes →
Race happens → Cron fetches results → Auto-scoring runs →
Leaderboard updates → Users view results
```

### Data Quality Notes
- Driver identification uses the 3-letter code (VER, HAM, LEC…) for stability across API versions
- FastF1 position data accumulates over time — we always take the latest timestamp per driver
- The `predictionsLock` is set to 1 hour before qualifying to prevent last-minute predictions after practice sessions reveal car performance

---

## 9. Quick Start

### Production (Docker)

```bash
# 1. Clone and configure
cp .env.example .env
# Edit .env with production secrets

# 2. Start everything
docker compose up --build

# Services:
#   Frontend:  http://localhost:5173
#   Backend:   http://localhost:4000
#   FastF1:    http://localhost:8100
#   Postgres:  localhost:5432
```

### Local Development

```bash
# 1. Install dependencies
npm install                    # Root (installs server + client)
cd fastf1-service && pip install -r requirements.txt

# 2. Setup database
cd server
cp .env.example .env          # Configure DATABASE_URL, JWT secrets
npx prisma migrate dev        # Run migrations
npx prisma db seed            # Optional: seed initial data

# 3. Start all services with one command
npm run dev                   # From root directory

# This starts:
#   - FastF1 service (uvicorn on port 8100)
#   - Backend API (tsx watch on port 4000)
#   - Frontend dev server (vite on port 5173)
#
# Press Ctrl+C to stop all services

# Alternatively, start services individually:
# Terminal 1: cd fastf1-service && uvicorn main:app --reload --port 8100
# Terminal 2: cd server && npm run dev
# Terminal 3: cd client && npm run dev
```

### First-Time Setup

```bash
# Sync current F1 season data
curl -X POST http://localhost:4000/api/races/admin/sync?year=2026

# This populates:
#   - race_weekends (all 2026 races)
#   - drivers (current grid)
#   - teams (current constructors)
```

### Key Commands

```bash
# Database
npx prisma migrate dev --name <migration_name>  # Create migration
npx prisma studio                                # Open DB GUI
npx prisma generate                              # Regenerate Prisma client

# Development
npm run dev              # Start all services (root)
npm run dev              # Start backend only (server/)
npm run dev              # Start frontend only (client/)

# Production
docker compose up -d     # Start in detached mode
docker compose logs -f   # Follow logs
docker compose down      # Stop all services
```

---

## 10. Environment Variables

### Backend (.env)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/overtake"
JWT_SECRET="your-secret-key-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-key-min-32-chars"
PORT=4000
NODE_ENV=development
FASTF1_BASE_URL="http://localhost:8100"
FASTF1_SERVICE_URL="http://localhost:8100"
```

### Frontend (client/.env)

```env
REACT_APP_API_URL=http://localhost:4000/api
```

---

## 11. Deployment Notes

- **Database**: PostgreSQL 16+ required for Prisma compatibility
- **Cron Jobs**: Run `syncSeasonData()` daily at 06:00 UTC, `syncRaceResults()` every 30 minutes
- **Live Streaming**: Ensure FastF1 service is accessible from backend (configure `FASTF1_SERVICE_URL`)
- **CORS**: Configure allowed origins in `server/src/index.ts` for production domains
- **Rate Limiting**: FastF1 service has no documented rate limits, but implement exponential backoff for reliability
- **Session Keys**: Format `year*1000 + round` for races, `+100` for qualifying (e.g., 2026001 = AUS GP Race)

---

## 12. Troubleshooting

### TypeScript Errors After Schema Changes
```bash
# Restart VS Code TypeScript server
Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Port Conflicts (EADDRINUSE)
```bash
# Kill all processes
pkill -f "tsx watch"
pkill -f "vite"
pkill -f "uvicorn"
```

### Docker Database Connection Issues
```bash
# Restart only postgres container
docker compose up -d postgres
```

### Empty Race Calendar
```bash
# Manually trigger sync for current year
curl -X POST http://localhost:4000/api/races/admin/sync?year=$(date +%Y)
```

### Stale Predictions Showing Across Grids
This was fixed by filtering predictions by `gridId` in the race list check. If issues persist, clear browser cache and hard reload.

---