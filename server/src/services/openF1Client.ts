import { env } from "../config/env";

/**
 * OpenF1 API client
 * Docs: https://openf1.org/docs/#api-endpoints
 *
 * Key endpoints used:
 *   GET /sessions   — list sessions (race, qualifying) for a season
 *   GET /drivers    — list drivers for a session
 *   GET /position   — final classification positions
 *   GET /laps       — lap data (to find fastest lap)
 *   GET /team_radio — (unused but available)
 *
 * FastF1 (https://docs.fastf1.dev/) is a Python library – we pull the same
 * underlying Ergast/OpenF1 data via the REST endpoints and use the OpenF1
 * REST API directly from Node.js.
 */

const BASE = env.openF1BaseUrl;

async function fetchJson<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(path, BASE);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error(`OpenF1 ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

// ─── Types mirroring OpenF1 response shapes ─────────────────────────────────

export interface OpenF1Session {
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

export interface OpenF1Driver {
  driver_number: number;
  first_name: string;
  last_name: string;
  name_acronym: string;       // VER, HAM, …
  team_name: string;
  team_colour: string;
  headshot_url: string | null;
  session_key: number;
}

export interface OpenF1Position {
  driver_number: number;
  position: number;
  date: string;
  session_key: number;
}

export interface OpenF1Lap {
  driver_number: number;
  lap_number: number;
  lap_duration: number | null;
  is_pit_out_lap: boolean;
  session_key: number;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/** Get all sessions for a given year (filter by type if needed) */
export async function getSessions(year: number): Promise<OpenF1Session[]> {
  return fetchJson<OpenF1Session[]>("/sessions", { year: String(year) });
}

/** Get the race and qualifying sessions for a year */
export async function getRaceAndQualiSessions(year: number) {
  const all = await getSessions(year);
  const races = all.filter((s) => s.session_name === "Race");
  const qualis = all.filter((s) => s.session_name === "Qualifying");
  return { races, qualis };
}

/** Get drivers for a specific session */
export async function getSessionDrivers(sessionKey: number): Promise<OpenF1Driver[]> {
  return fetchJson<OpenF1Driver[]>("/drivers", { session_key: String(sessionKey) });
}

/** Get final positions for a session (last recorded position per driver) */
export async function getFinalPositions(sessionKey: number): Promise<OpenF1Position[]> {
  const positions = await fetchJson<OpenF1Position[]>("/position", {
    session_key: String(sessionKey),
  });

  // OpenF1 returns positional updates over time. We want the LAST position per driver.
  const latest = new Map<number, OpenF1Position>();
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
  const laps = await fetchJson<OpenF1Lap[]>("/laps", {
    session_key: String(sessionKey),
  });

  let fastest: { driver: number; time: number } | null = null;
  for (const lap of laps) {
    if (lap.lap_duration == null || lap.is_pit_out_lap) continue;
    if (!fastest || lap.lap_duration < fastest.time) {
      fastest = { driver: lap.driver_number, time: lap.lap_duration };
    }
  }

  return fastest?.driver ?? null;
}
