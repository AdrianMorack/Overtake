"""
FastF1 Bridge Service
Exposes REST endpoints compatible with the FastF1 data model.
The Node.js backend connects to this service for all F1 data.

Session key encoding:
  Race key:  year * 1000 + round   (e.g. 2025001 for 2025 R1)
  Quali key: year * 1000 + round + 100  (e.g. 2025101 for 2025 R1 quali)
"""
from __future__ import annotations

import os
import logging
from datetime import datetime, timezone
from typing import Optional

import fastf1
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# ─── Cache setup ─────────────────────────────────────────────────────────────
CACHE_DIR = os.environ.get("FF1_CACHE_DIR", "/tmp/fastf1_cache")
os.makedirs(CACHE_DIR, exist_ok=True)
fastf1.Cache.enable_cache(CACHE_DIR)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="FastF1 Bridge")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── In-memory session cache (30 s TTL) ──────────────────────────────────────
_sess_cache: dict[tuple, tuple] = {}  # (year, rnd, id) -> (session, cached_at)
SESSION_TTL = 30  # seconds


def _load(year: int, rnd: int, identifier: str):
    key = (year, rnd, identifier)
    now = datetime.now()
    if key in _sess_cache:
        sess, cached_at = _sess_cache[key]
        if (now - cached_at).total_seconds() < SESSION_TTL:
            return sess
    try:
        sess = fastf1.get_session(year, rnd, identifier)
        sess.load(laps=True, telemetry=False, weather=True, messages=True)
        _sess_cache[key] = (sess, now)
        return sess
    except Exception as e:
        logger.warning("Session %s R%s %s: %s", year, rnd, identifier, e)
        raise HTTPException(status_code=404, detail=str(e))


# ─── Key encoding helpers ─────────────────────────────────────────────────────

def _race_key(year: int, rnd: int) -> int:
    return year * 1000 + rnd


def _quali_key(year: int, rnd: int) -> int:
    return year * 1000 + rnd + 100


def _decode(key: int) -> tuple[int, int, bool]:
    """Returns (year, round, is_qualifying)."""
    year = key // 1000
    rem  = key % 1000
    return (year, rem - 100, True) if rem >= 100 else (year, rem, False)


# ─── Pandas helpers ───────────────────────────────────────────────────────────

def _sec(td) -> Optional[float]:
    try:
        s = td.total_seconds()
        return None if s != s else s  # NaN guard
    except Exception:
        return None


def _safe(v) -> Optional[str]:
    try:
        s = str(v)
        return None if s in ("nan", "NaT", "None", "") else s
    except Exception:
        return None


def _iso(ts) -> str:
    try:
        return pd.Timestamp(ts, tz="UTC").isoformat()
    except Exception:
        return datetime.now(timezone.utc).isoformat()


# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/sessions")
def sessions(year: int):
    """
    Returns all Race and Qualifying sessions for the given year.
    Output format matches the expected REST API schema.
    """
    try:
        sched = fastf1.get_event_schedule(year, include_testing=False)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    out = []
    for _, row in sched.iterrows():
        rnd     = int(row["RoundNumber"])
        country = _safe(row.get("Country")) or ""
        circuit = _safe(row.get("Location")) or ""

        for i in range(1, 6):
            name     = _safe(row.get(f"Session{i}"))
            date_utc = row.get(f"Session{i}DateUtc") or row.get(f"Session{i}Date")
            if not name or date_utc is None:
                continue

            is_race  = name in ("Race", "Sprint")
            is_quali = name in ("Qualifying", "Sprint Qualifying", "Sprint Shootout")
            if not (is_race or is_quali):
                continue

            try:
                ts      = pd.Timestamp(date_utc)
                d_start = ts.isoformat()
                d_end   = (ts + pd.Timedelta(hours=2)).isoformat()
            except Exception:
                continue

            key = _race_key(year, rnd) if is_race else _quali_key(year, rnd)
            out.append({
                "session_key":        key,
                "session_name":       name,
                "session_type":       "Race" if is_race else "Qualifying",
                "date_start":         d_start,
                "date_end":           d_end,
                "circuit_short_name": circuit,
                "country_name":       country,
                "meeting_key":        rnd,
                "year":               year,
            })
    return out


@app.get("/drivers")
def drivers(session_key: int):
    year, rnd, is_q = _decode(session_key)
    sess = _load(year, rnd, "Q" if is_q else "R")
    out  = []
    if sess.results is not None and len(sess.results) > 0:
        for _, r in sess.results.iterrows():
            color = (_safe(r.get("TeamColor")) or "").lstrip("#")
            out.append({
                "driver_number": int(r["DriverNumber"]),
                "first_name":    _safe(r.get("FirstName"))  or "",
                "last_name":     _safe(r.get("LastName"))   or "",
                "name_acronym":  _safe(r.get("Abbreviation")) or "",
                "team_name":     _safe(r.get("TeamName"))   or "",
                "team_colour":   color,
                "headshot_url":  _safe(r.get("HeadshotUrl")),
                "session_key":   session_key,
            })
    return out


@app.get("/position")
def position(session_key: int):
    year, rnd, is_q = _decode(session_key)
    sess = _load(year, rnd, "Q" if is_q else "R")
    out  = []
    if sess.results is not None and len(sess.results) > 0:
        for _, r in sess.results.iterrows():
            raw = r.get("ClassifiedPosition")
            if not pd.notna(raw):
                raw = r.get("Position")
            try:
                pos = int(float(str(raw)))
            except Exception:
                continue
            out.append({
                "driver_number": int(r["DriverNumber"]),
                "position":      pos,
                "date":          datetime.now(timezone.utc).isoformat(),
                "session_key":   session_key,
            })
    return sorted(out, key=lambda x: x["position"])


@app.get("/laps")
def laps(session_key: int):
    year, rnd, is_q = _decode(session_key)
    sess = _load(year, rnd, "Q" if is_q else "R")
    out  = []
    if sess.laps is not None and len(sess.laps) > 0:
        for _, lap in sess.laps.iterrows():
            out.append({
                "driver_number":   int(lap["DriverNumber"]),
                "lap_number":      int(lap["LapNumber"]),
                "lap_time":        _sec(lap.get("LapTime")),
                "sector1_time":    _sec(lap.get("Sector1Time")),
                "sector2_time":    _sec(lap.get("Sector2Time")),
                "sector3_time":    _sec(lap.get("Sector3Time")),
                "speed_i1":        float(lap.get("SpeedI1")) if pd.notna(lap.get("SpeedI1")) else None,
                "speed_i2":        float(lap.get("SpeedI2")) if pd.notna(lap.get("SpeedI2")) else None,
                "speed_fl":        float(lap.get("SpeedFL")) if pd.notna(lap.get("SpeedFL")) else None,
                "speed_st":        float(lap.get("SpeedST")) if pd.notna(lap.get("SpeedST")) else None,
                "compound":        _safe(lap.get("Compound")),
                "tyre_life":       int(lap.get("TyreLife")) if pd.notna(lap.get("TyreLife")) else None,
                "fresh_tyre":      bool(lap.get("FreshTyre")) if pd.notna(lap.get("FreshTyre")) else None,
                "stint":           int(lap.get("Stint")) if pd.notna(lap.get("Stint")) else None,
                "is_pit_out_lap":  bool(pd.notna(lap.get("PitOutTime"))),
                "is_personal_best": bool(lap.get("IsPersonalBest")) if pd.notna(lap.get("IsPersonalBest")) else False,
                "track_status":    _safe(lap.get("TrackStatus")),
                "lap_start_time":  _iso(lap.get("LapStartTime")) if pd.notna(lap.get("LapStartTime")) else None,
                "team":            _safe(lap.get("Team")),
                "driver":          _safe(lap.get("Driver")),
                "session_key":     session_key,
            })
    return out


@app.get("/intervals")
def intervals(session_key: int):
    year, rnd, is_q = _decode(session_key)
    sess = _load(year, rnd, "Q" if is_q else "R")
    out  = []
    if sess.results is None or len(sess.results) == 0:
        return out

    leader_secs: Optional[float] = None
    prev_secs:   Optional[float] = None
    for _, r in sess.results.sort_values("Position").iterrows():
        t      = _sec(r.get("Time")) if pd.notna(r.get("Time", float("nan"))) else None
        gap    = None
        intv   = None
        if t is not None:
            if leader_secs is None:
                leader_secs = t
                gap = intv = 0.0
            else:
                gap  = t - leader_secs
                intv = (t - prev_secs) if prev_secs is not None else gap
        prev_secs = t
        out.append({
            "driver_number": int(r["DriverNumber"]),
            "gap_to_leader": gap,
            "interval":      intv,
            "date":          datetime.now(timezone.utc).isoformat(),
            "session_key":   session_key,
        })
    return out


@app.get("/pit")
def pit(session_key: int):
    year, rnd, _ = _decode(session_key)
    sess = _load(year, rnd, "R")
    out  = []
    if sess.laps is not None and "PitInTime" in sess.laps.columns:
        for _, lap in sess.laps[sess.laps["PitInTime"].notna()].iterrows():
            out.append({
                "driver_number": int(lap["DriverNumber"]),
                "lap_number":    int(lap["LapNumber"]),
                "pit_duration":  None,
                "date":          datetime.now(timezone.utc).isoformat(),
                "session_key":   session_key,
            })
    return out


@app.get("/stints")
def stints(session_key: int):
    year, rnd, is_q = _decode(session_key)
    sess = _load(year, rnd, "Q" if is_q else "R")
    out  = []
    if sess.laps is not None and "Compound" in sess.laps.columns and "Stint" in sess.laps.columns:
        # Group by driver and stint to get all stints, not just the last one
        for driver_num in sess.laps["DriverNumber"].unique():
            driver_laps = sess.laps[sess.laps["DriverNumber"] == driver_num].sort_values("LapNumber")
            for stint_num in driver_laps["Stint"].dropna().unique():
                stint_laps = driver_laps[driver_laps["Stint"] == stint_num]
                if len(stint_laps) == 0:
                    continue
                first_lap = stint_laps.iloc[0]
                last_lap = stint_laps.iloc[-1]
                compound = (_safe(first_lap.get("Compound")) or "UNKNOWN").upper()
                out.append({
                    "driver_number":    int(driver_num),
                    "stint_number":     int(stint_num),
                    "compound":         compound,
                    "tyre_age_at_start": int(first_lap.get("TyreLife", 0)) if pd.notna(first_lap.get("TyreLife")) else 0,
                    "lap_start":        int(first_lap["LapNumber"]),
                    "lap_end":          int(last_lap["LapNumber"]) if pd.notna(last_lap["LapNumber"]) else None,
                    "fresh_tyre":       bool(first_lap.get("FreshTyre")) if pd.notna(first_lap.get("FreshTyre")) else False,
                    "session_key":      session_key,
                })
    return out


@app.get("/race_control")
def race_control(session_key: int):
    year, rnd, is_q = _decode(session_key)
    sess = _load(year, rnd, "Q" if is_q else "R")
    out  = []
    msgs = sess.race_control_messages
    if msgs is not None and len(msgs) > 0:
        for _, m in msgs.iterrows():
            out.append({
                "date":     _iso(m.get("Time") or m.get("Timestamp")),
                "category": _safe(m.get("Category")) or "",
                "message":  _safe(m.get("Message"))  or "",
                "flag":     _safe(m.get("Flag")),
                "session_key": session_key,
            })
    return out


@app.get("/weather")
def weather(session_key: int):
    year, rnd, is_q = _decode(session_key)
    sess = _load(year, rnd, "Q" if is_q else "R")
    out  = []
    wd   = sess.weather_data
    if wd is not None and len(wd) > 0:
        for _, w in wd.iterrows():
            out.append({
                "air_temperature":   float(w.get("AirTemp",   0) or 0),
                "track_temperature": float(w.get("TrackTemp", 0) or 0),
                "humidity":          float(w.get("Humidity",  0) or 0),
                "wind_speed":        float(w.get("WindSpeed", 0) or 0),
                "rainfall":          bool(w.get("Rainfall", False)),
                "date":              _iso(w.get("Time")),
                "session_key":       session_key,
            })
    return out
