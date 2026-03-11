import { env } from "../config/env";

/**
 * FastF1 API client
 * Connects to the FastF1 Python bridge service
 *
 * Key endpoints used:
 *   GET /sessions   — list sessions (race, qualifying) for a season
 *   GET /drivers    — list drivers for a session
 *   GET /position   — final classification positions
 *   GET /laps       — lap data (to find fastest lap)
 *   GET /intervals  — gap and interval data
 *   GET /pit        — pit stop data
 *   GET /stints     — tyre stint data
 *   GET /race_control — race control messages
 *   GET /weather    — weather data
 *
 * FastF1 (https://docs.fastf1.dev/) is a Python library that provides
 * official F1 timing data. Our Python service exposes this data via REST.
 */

const BASE = env.fastF1BaseUrl;

async function fetchJson<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(60_000), // 60 seconds - FastF1 needs time to cache data
  });

  if (!res.ok) {
    throw new Error(`FastF1 ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

// ─── Types mirroring FastF1 response shapes ─────────────────────────────────

export interface FastF1Session {
  session_key: number;
  session_name: string;       // "Race", "Qualifying", "Sprint", …
  session_type: string;
  date_start: string;
  date_end: string;
  circuit_short_name: string;
  country_name: string;
  meeting_key: number;
  year: number;
}

export interface FastF1Driver {
  driver_number: number;
  first_name: string;
  last_name: string;
  name_acronym: string;       // VER, HAM, …
  team_name: string;
  team_colour: string;
  headshot_url: string | null;
  session_key: number;
}

export interface FastF1Position {
  driver_number: number;
  position: number;
  date: string;
  session_key: number;
}

export interface FastF1Lap {
  driver_number: number;
  lap_number: number;
  lap_time: number | null;
  sector1_time: number | null;
  sector2_time: number | null;
  sector3_time: number | null;
  speed_i1: number | null; // Speed at intermediate 1 (km/h)
  speed_i2: number | null; // Speed at intermediate 2 (km/h)
  speed_fl: number | null; // Speed at finish line (km/h)
  speed_st: number | null; // Speed at speed trap (km/h)
  compound: string | null; // Tyre compound (SOFT, MEDIUM, HARD, INTERMEDIATE, WET)
  tyre_life: number | null; // Laps completed on this set of tyres
  fresh_tyre: boolean | null; // Whether tyres are fresh (new)
  stint: number | null; // Stint number
  is_pit_out_lap: boolean;
  is_personal_best: boolean;
  track_status: string | null; // Track status during lap (e.g., "1" = green, "2" = yellow, etc.)
  lap_start_time: string | null; // ISO timestamp when lap started
  team: string | null;
  driver: string | null; // Driver abbreviation
  session_key: number;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/** Get all sessions for a given year (filter by type if needed) */
export async function getSessions(year: number): Promise<FastF1Session[]> {
  return fetchJson<FastF1Session[]>("/sessions", { year: String(year) });
}

/** Get the race and qualifying sessions for a year */
export async function getRaceAndQualiSessions(year: number) {
  const all = await getSessions(year);
  const races = all.filter((s) => s.session_name === "Race");
  const qualis = all.filter((s) => s.session_name === "Qualifying");
  return { races, qualis };
}

/** Get drivers for a specific session */
export async function getSessionDrivers(sessionKey: number): Promise<FastF1Driver[]> {
  return fetchJson<FastF1Driver[]>("/drivers", { session_key: String(sessionKey) });
}

/** Get final positions for a session (last recorded position per driver) */
export async function getFinalPositions(sessionKey: number): Promise<FastF1Position[]> {
  const positions = await fetchJson<FastF1Position[]>("/position", {
    session_key: String(sessionKey),
  });

  // FastF1 returns positional updates over time. We want the LAST position per driver.
  const latest = new Map<number, FastF1Position>();
  for (const p of positions) {
    const existing = latest.get(p.driver_number);
    if (!existing || new Date(p.date) > new Date(existing.date)) {
      latest.set(p.driver_number, p);
    }
  }

  return Array.from(latest.values()).sort((a, b) => a.position - b.position);
}

/** Get the driver with the fastest lap in a race session */
export async function getFastestLapDriver(sessionKey: number): Promise<number | null> {
  const laps = await fetchJson<FastF1Lap[]>("/laps", {
    session_key: String(sessionKey),
  });

  let fastest: { driver: number; time: number } | null = null;
  for (const lap of laps) {
    if (lap.lap_time == null || lap.is_pit_out_lap) continue;
    if (!fastest || lap.lap_time < fastest.time) {
      fastest = { driver: lap.driver_number, time: lap.lap_time };
    }
  }

  return fastest?.driver ?? null;
}

// ─── New live-data types ─────────────────────────────────────────────────────

export interface FastF1Interval {
  driver_number: number;
  date: string;
  gap_to_leader: number | null; // seconds; negative = lapped
  interval: number | null;      // seconds to car ahead
  session_key: number;
}

export interface FastF1Pit {
  driver_number: number;
  date: string;
  lap_number: number;
  pit_duration: number | null;
  session_key: number;
}

export interface FastF1Stint {
  driver_number: number;
  stint_number: number; // Stint number for this driver
  compound: string; // SOFT | MEDIUM | HARD | INTERMEDIATE | WET | UNKNOWN
  tyre_age_at_start: number; // Age of tyres in laps when stint started
  lap_start: number; // Lap number when stint started
  lap_end: number | null; // Lap number when stint ended (null for current stint)
  fresh_tyre: boolean; // Whether tyres were fresh at stint start
  session_key: number;
}

export interface FastF1RaceControl {
  date: string;
  category: string; // Flag | SafetyCar | Drs | ChequeredFlag | …
  message: string;
  flag: string | null; // CLEAR | GREEN | YELLOW | DOUBLE YELLOW | RED | CHEQUERED
  scope: string;
  sector: number | null;
  session_key: number;
}

export interface FastF1Weather {
  date: string;
  air_temperature: number;
  track_temperature: number;
  wind_speed: number;
  wind_direction: number;
  rainfall: boolean;
  humidity: number;
  pressure: number;
  session_key: number;
}

// ─── New live-data functions ─────────────────────────────────────────────────

/** All gap/interval updates for a session (latest per driver is most current) */
export async function getIntervals(sessionKey: number): Promise<FastF1Interval[]> {
  return fetchJson<FastF1Interval[]>("/intervals", { session_key: String(sessionKey) });
}

/** All pit stop events recorded for this session */
export async function getPitStops(sessionKey: number): Promise<FastF1Pit[]> {
  return fetchJson<FastF1Pit[]>("/pit", { session_key: String(sessionKey) });
}

/** All tyre stints for this session */
export async function getStints(sessionKey: number): Promise<FastF1Stint[]> {
  return fetchJson<FastF1Stint[]>("/stints", { session_key: String(sessionKey) });
}

/** Race-control messages (flags, safety car, DRS zones, etc.) */
export async function getRaceControlMessages(sessionKey: number): Promise<FastF1RaceControl[]> {
  return fetchJson<FastF1RaceControl[]>("/race_control", { session_key: String(sessionKey) });
}

/** Weather data (sampled periodically) */
export async function getWeather(sessionKey: number): Promise<FastF1Weather[]> {
  return fetchJson<FastF1Weather[]>("/weather", { session_key: String(sessionKey) });
}

/** All lap records for the session (used for fastest-lap tracking) */
export async function getAllLaps(sessionKey: number): Promise<FastF1Lap[]> {
  return fetchJson<FastF1Lap[]>("/laps", { session_key: String(sessionKey) });
}
