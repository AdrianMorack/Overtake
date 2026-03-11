# Overtake — Deployment & Automation Guide

## Prerequisites

1. GitHub account (for Actions automation)
2. Neon account (PostgreSQL database)
3. Render account (server + FastF1 service)
4. Vercel account (client deployment)

---

## Part 1: Database (Neon)

1. Go to [neon.tech](https://neon.tech) → Create project "Overtake"
2. Copy the **pooled connection string** (with `?pgbouncer=true`)
3. Save for next step

---

## Part 2: Deploy Server (Render)

1. **New Web Service** → Connect GitHub repo
2. **Settings:**
   - Name: `overtake-server`
   - Root Directory: `server`
   - Runtime: `Docker`
   - Plan: **Starter ($7/mo)** recommended for live races

3. **Environment Variables:**
   ```bash
   DATABASE_URL=postgresql://...@neon.tech/overtake?sslmode=require&pgbouncer=true
   JWT_SECRET=<run: openssl rand -hex 64>
   JWT_REFRESH_SECRET=<run: openssl rand -hex 64>
   NODE_ENV=production
   CORS_ORIGIN=https://overtake.vercel.app  # Update after Vercel deploy
   PORT=4000
   FASTF1_BASE_URL=https://overtake-fastf1.onrender.com  # Update after next step
   ADMIN_USER_IDS=  # Leave empty, add after first user registration
   ```

4. Deploy → Note URL: `https://overtake-server.onrender.com`

---

## Part 3: Deploy FastF1 Service (Render)

1. **New Web Service** → Same repo
2. **Settings:**
   - Name: `overtake-fastf1`
   - Root Directory: `fastf1-service`
   - Runtime: `Docker`
   - Plan: **Starter ($7/mo)** recommended

3. **Environment Variables:**
   ```bash
   ALLOWED_ORIGINS=https://overtake-server.onrender.com
   ```

4. Deploy → Note URL: `https://overtake-fastf1.onrender.com`

5. **Go back to server** → Update `FASTF1_BASE_URL` → Redeploy

---

## Part 4: Deploy Client (Vercel)

1. **New Project** → Import your GitHub repo
2. **Settings:**
   - Framework: `Vite`
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Environment Variables:**
   ```bash
   VITE_API_URL=https://overtake-server.onrender.com/api
   ```

4. Deploy → Note URL: `https://overtake-xxx.vercel.app`

5. **Go back to Render server** → Update `CORS_ORIGIN` to Vercel URL → Redeploy

---

## Part 5: Initial Setup

### 1. Create Admin Account

1. Open `https://overtake-xxx.vercel.app`
2. Register your account (this will be the admin)
3. Open browser DevTools → Console → Run:
   ```javascript
   JSON.parse(atob(localStorage.getItem('accessToken').split('.')[1])).userId
   ```
4. Copy your user ID (e.g., `cl9abc123xyz`)

### 2. Create Bot Account (for automation)

1. Open app in **incognito window**
2. Register:
   - Email: `yourname+f1bot@gmail.com`
   - Username: `f1-sync-bot`
   - Password: (generate strong password, save it)
3. In DevTools console:
   ```javascript
   // Copy bot user ID
   JSON.parse(atob(localStorage.getItem('accessToken').split('.')[1])).userId
   
   // Copy refresh token
   localStorage.getItem('refreshToken')
   ```
4. Save both values

### 3. Make Accounts Admins

Render → Server → Environment Variables:
```bash
ADMIN_USER_IDS=your_user_id,bot_user_id
```
Redeploy

### 4. Load Initial F1 Data

Using your admin token:
```bash
curl -X POST "https://overtake-server.onrender.com/api/races/admin/sync?year=2026" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Wait ~1-2 minutes for 2026 season data to load.

---

## Part 6: Automation Setup

### Set GitHub Secrets

Repo → Settings → Secrets and variables → Actions → New secret:

```bash
SERVER_URL=https://overtake-server.onrender.com
BOT_REFRESH_TOKEN=<bot's refresh token from step 5.2>
```

### What Gets Automated

**All workflows are already in `.github/workflows/`:**

1. **`sync-f1-data.yml`**
   - **When:** Every Monday 9 AM UTC (after race weekends)
   - **What:** Downloads final race results, scores all predictions
   - **Why:** Keeps leaderboards up-to-date

2. **`detect-live-races.yml`**
   - **When:** Every 30 min on Fri/Sat/Sun
   - **What:** Checks for live races, starts real-time polling
   - **Why:** Enables live race tracking without manual trigger

3. **`keep-alive.yml`**
   - **When:** Every 10 min on Fri/Sat/Sun
   - **What:** Pings server health endpoint
   - **Why:** Prevents Render free tier from sleeping during races

### Enable Workflows

Just push to GitHub:
```bash
git add .github/workflows/
git commit -m "Add automated F1 data sync and live race detection"
git push
```

GitHub Actions will run automatically on schedule.

### Manual Triggers

You can trigger any workflow manually:
- GitHub → Actions tab → Select workflow → "Run workflow"

---

## Monitoring

### Set Up Uptime Monitoring (Free)

1. [uptimerobot.com](https://uptimerobot.com) → Add Monitor
2. Type: HTTP(s)
3. URL: `https://overtake-server.onrender.com/api/health`
4. Interval: 5 minutes

### Error Tracking (Optional)

Add Sentry for production error monitoring (free tier):
1. [sentry.io](https://sentry.io) → New project → Express + React
2. Install: `npm install @sentry/node @sentry/react`
3. Follow setup guides in Sentry dashboard

---

## Cost Summary

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Hobby | Free |
| Render — Server | Starter | $7/mo |
| Render — FastF1 | Starter | $7/mo |
| Neon — Postgres | Free | Free |
| GitHub Actions | Free | Free (2,000 min/mo) |
| **Total** | | **$14/month** |

### Free Tier Option ($0/mo)

Use Render free tier for both services:
- ⚠️ Services sleep after 15 min inactivity
- ⚠️ Cold starts ~30 seconds
- ✅ `keep-alive.yml` keeps them awake on race weekends
- ✅ Good for testing, not ideal for production with multiple users

---

## Troubleshooting

**"Database connection failed"**
- Check `DATABASE_URL` has `?sslmode=require&pgbouncer=true`
- Verify Neon database is active (free tier can auto-suspend)

**"CORS error" on client**
- `CORS_ORIGIN` must exactly match Vercel URL (no trailing slash)
- Use `https://` not `http://`

**Live race updates not working**
- Check GitHub Actions ran `detect-live-races` recently
- Verify server didn't sleep (if free tier)
- Manually trigger: `POST /api/live/detect` with admin token

**Bot refresh token expired**
- Log in as bot account in incognito window
- Get new refresh token from localStorage
- Update GitHub secret `BOT_REFRESH_TOKEN`

---

## Regular Maintenance

✅ **Automated (set it and forget it):**
- Weekly F1 data sync (Mondays)
- Live race detection (race weekends)
- Server keep-alive (race weekends)

📋 **Manual (occasional):**
- Check Sentry for errors (weekly)
- Update dependencies (monthly): `npm audit`
- New season setup (yearly): Verify sync runs for new year
- Monitor Neon storage (quarterly): Free tier = 0.5 GB limit

---

## Support

- **FastF1 data issues:** Check [FastF1 docs](https://docs.fastf1.dev/)
- **Deployment issues:** Check Render/Vercel logs
- **GitHub Actions failing:** Check Actions tab for error logs

Your app is now fully automated! 🏎️
