# 🏁 Overtake — F1 Prediction Game

A full-stack Formula 1 prediction platform where players join **Grids**, predict race outcomes, and compete on leaderboards.

---

## 1. System Architecture Overview

```
┌──────────────┐      ┌──────────────────────┐      ┌───────────────┐
│   React SPA  │─────▶│  Express REST API     │─────▶│  PostgreSQL   │
│  (port 3000) │ HTTP │  (port 4000)          │Prisma│  (port 5432)  │
└──────────────┘      │                       │      └───────────────┘
                      │  ┌──────────────────┐ │
                      │  │ Cron Jobs        │ │      ┌───────────────┐
                      │  │  • Season sync   │─┼─────▶│  OpenF1 API   │
                      │  │  • Result fetch  │ │      └───────────────┘
                      │  │  • Auto scoring  │ │
                      │  └──────────────────┘ │
                      └──────────────────────┘

All services containerized via Docker Compose.
```

**Data flow:**
1. Cron syncs race schedule + driver/team data from OpenF1 into Postgres
2. Users authenticate (JWT access + refresh tokens) → submit predictions per race weekend
3. After a race, cron fetches official results from OpenF1
4. Scoring engine compares predictions vs results → writes points
5. Leaderboards aggregate points per grid

---

## 2. Database Schema

See `server/prisma/schema.prisma` for the full Prisma schema.

### Entity Relationship Diagram

```
User 1──∞ GridMembership ∞──1 Grid
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
| `drivers` | F1 drivers synced from OpenF1 |
| `teams` | F1 teams synced from OpenF1 |
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
│   │   ├── grids.ts            # CRUD grids, join, leaderboard
│   │   ├── predictions.ts      # Submit & retrieve predictions
│   │   └── races.ts            # Race calendar, drivers, teams
│   ├── services/
│   │   ├── authService.ts      # Registration, login, token rotation
│   │   ├── gridService.ts      # Grid CRUD, membership, leaderboard
│   │   ├── predictionService.ts# Prediction upsert & queries
│   │   ├── scoringService.ts   # Points calculation engine
│   │   ├── raceService.ts      # Race/driver/team queries
│   │   └── openF1Client.ts     # OpenF1 REST API client
│   ├── jobs/
│   │   └── syncF1Data.ts       # Cron jobs: season sync + result fetch + scoring
│   └── index.ts                # Express app entry point
├── Dockerfile
├── package.json
└── tsconfig.json
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
| POST | `/api/grids` | `{name, season?}` | Create grid |
| POST | `/api/grids/join` | `{code}` | Join grid by 6-char code |
| GET | `/api/grids` | — | List user's grids |
| GET | `/api/grids/:gridId/leaderboard` | — | Grid standings |

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
│   │   └── predictions/
│   │       └── PredictionForm.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx      # Auth state + token management
│   ├── pages/
│   │   ├── AuthPages.tsx        # Login & Register
│   │   ├── DashboardPage.tsx    # Home with grids & next race
│   │   ├── GridPages.tsx        # Create & Join grid
│   │   ├── LeaderboardPage.tsx  # Grid standings + race links
│   │   ├── PredictPage.tsx      # Submit predictions for a race
│   │   ├── RacesPage.tsx        # Full season calendar
│   │   └── ResultsPage.tsx      # Race results & player predictions
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
| `/dashboard` | DashboardPage | Grid list, next race, quick actions |
| `/grids/create` | CreateGridPage | Name a new grid |
| `/grids/join` | JoinGridPage | Enter 6-char code |
| `/grids/:id` | LeaderboardPage | Standings + upcoming races |
| `/grids/:id/race/:raceId/predict` | PredictPage | Prediction form |
| `/grids/:id/race/:raceId/results` | ResultsPage | Official results + player predictions |
| `/races` | RacesPage | Full calendar with statuses |

---

## 6. Example Code Highlights

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

### Scoring Engine
`server/src/services/scoringService.ts` — Compares each prediction field against official results using case-insensitive string matching, calculates per-category breakdown, and stores total points.

### API Client with Token Refresh
`client/src/api/client.ts` — Automatically retries 401 requests after refreshing the access token. Rotates refresh tokens on each use.

---

## 7. Race Data Integration Strategy

### Data Sources
- **OpenF1 REST API** (`https://api.openf1.org/v1`) — Primary data source for sessions, drivers, positions, laps
- **FastF1** (`https://docs.fastf1.dev/`) — Python library exposing the same upstream data; we use the equivalent REST endpoints directly

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

1. **Season sync** (`syncSeasonData`): Runs daily. Fetches all sessions for the year from OpenF1, identifies Race and Qualifying sessions, upserts `race_weekends` with computed prediction lock times (1 hour before qualifying).

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
- OpenF1 position data accumulates over time — we always take the latest timestamp per driver
- The `predictionsLock` is set to 1 hour before qualifying to prevent last-minute predictions after practice sessions reveal car performance

---

## Quick Start

```bash
# 1. Clone and configure
cp .env.example .env
# Edit .env with production secrets

# 2. Start everything
docker compose up --build

# 3. The API runs on http://localhost:4000
#    The frontend runs on http://localhost:3000

# For local development without Docker:
cd server && npm install && npx prisma migrate dev && npm run dev
cd client && npm install && npm start
```