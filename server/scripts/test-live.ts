/**
 * test-live.ts
 * Run with: npx tsx scripts/test-live.ts <sessionKey> [endpoint]
 *
 * Exercises the FastF1 Python bridge and prints formatted output.
 *
 * Examples:
 *   npx tsx scripts/test-live.ts 9165               — full snapshot
 *   npx tsx scripts/test-live.ts 9165 positions      — positions only
 *   npx tsx scripts/test-live.ts 9165 sessions 2024  — list sessions for year
 *
 * Endpoint shortcuts:
 *   sessions [year]  — list all sessions for a year (default: current year)
 *   positions        — final classified positions
 *   drivers          — driver list
 *   laps             — fastest laps
 *   intervals        — gaps / intervals
 *   pit              — pit stops
 *   stints           — tyre stints
 *   race_control     — race messages / flags
 *   weather          — weather snapshot
 *   snapshot         — full LiveRaceSnapshot (default)
 */

import dotenv from "dotenv";
dotenv.config();

import * as fastF1 from "../src/services/fastF1Client";
import { startPolling, stopPolling, getSnapshot } from "../src/services/liveRaceService";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const hr = (label = "") =>
  console.log(`\n${"─".repeat(60)}${label ? "  " + label : ""}`);

function fmt(val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "boolean") return val ? "yes" : "no";
  return String(val);
}

// ─── Individual endpoint reporters ──────────────────────────────────────────

async function showSessions(year: number) {
  hr(`Sessions  ${year}`);
  const sessions = await fastF1.getSessions(year);
  const cols = ["session_key", "session_name", "circuit_short_name", "country_name", "date_start"] as const;
  console.log(
    cols.map((c) => c.replace("session_", "").toUpperCase().padEnd(16)).join("")
  );
  for (const s of sessions) {
    console.log(cols.map((c) => fmt(s[c]).padEnd(16)).join(""));
  }
  console.log(`\nTotal: ${sessions.length} sessions`);
}

async function showPositions(sessionKey: number) {
  hr("Final Positions");
  const positions = await fastF1.getFinalPositions(sessionKey);
  console.log(`${"P".padEnd(4)} ${"Driver#".padEnd(10)} Position`);
  for (const p of positions) {
    console.log(`${String(p.position).padEnd(4)} ${String(p.driver_number).padEnd(10)} ${p.position}`);
  }
}

async function showDrivers(sessionKey: number) {
  hr("Drivers");
  const drivers = await fastF1.getSessionDrivers(sessionKey);
  console.log(`${"#".padEnd(5)} ${"Code".padEnd(6)} ${"First Name".padEnd(14)} ${"Last Name".padEnd(16)} Team`);
  for (const d of drivers) {
    console.log(
      `${String(d.driver_number).padEnd(5)} ${d.name_acronym.padEnd(6)} ` +
      `${d.first_name.padEnd(14)} ${d.last_name.padEnd(16)} ${d.team_name}`
    );
  }
}

async function showLaps(sessionKey: number) {
  hr("Fastest Laps (per driver)");
  const laps = await fastF1.getAllLaps(sessionKey);
  // Group best lap per driver
  const best = new Map<number, (typeof laps)[0]>();
  for (const lap of laps) {
    if (lap.lap_time === null) continue;
    const cur = best.get(lap.driver_number);
    if (!cur || (cur.lap_time !== null && lap.lap_time < cur.lap_time)) {
      best.set(lap.driver_number, lap);
    }
  }
  const sorted = [...best.values()].sort((a, b) =>
    (a.lap_time ?? Infinity) - (b.lap_time ?? Infinity)
  );
  console.log(`${"Driver#".padEnd(10)} ${"Lap".padEnd(6)} ${"Time (s)".padEnd(12)} Compound`);
  for (const l of sorted) {
    console.log(
      `${String(l.driver_number).padEnd(10)} ${String(l.lap_number).padEnd(6)} ` +
      `${String(l.lap_time?.toFixed(3) ?? "—").padEnd(12)} ${l.compound ?? "—"}`
    );
  }
}

async function showIntervals(sessionKey: number) {
  hr("Intervals");
  const data = await fastF1.getIntervals(sessionKey);
  // Latest interval per driver
  const latest = new Map<number, (typeof data)[0]>();
  for (const row of data) {
    const cur = latest.get(row.driver_number);
    if (!cur || new Date(row.date) > new Date(cur.date)) {
      latest.set(row.driver_number, row);
    }
  }
  const sorted = [...latest.values()].sort((a, b) => a.driver_number - b.driver_number);
  console.log(`${"Driver#".padEnd(10)} ${"Gap to Leader".padEnd(18)} Interval`);
  for (const r of sorted) {
    const gap = r.gap_to_leader != null ? `+${r.gap_to_leader.toFixed(3)}s` : "LEADER";
    const intv = r.interval != null ? `+${r.interval.toFixed(3)}s` : "—";
    console.log(`${String(r.driver_number).padEnd(10)} ${gap.padEnd(18)} ${intv}`);
  }
}

async function showPits(sessionKey: number) {
  hr("Pit Stops");
  const pits = await fastF1.getPitStops(sessionKey);
  // Track stop count per driver
  const stopCount = new Map<number, number>();
  console.log(`${"Driver#".padEnd(10)} ${"Stop#".padEnd(8)} ${"Lap".padEnd(6)} Duration (s)`);
  for (const p of pits) {
    const n = (stopCount.get(p.driver_number) ?? 0) + 1;
    stopCount.set(p.driver_number, n);
    console.log(
      `${String(p.driver_number).padEnd(10)} ${String(n).padEnd(8)} ` +
      `${String(p.lap_number).padEnd(6)} ${p.pit_duration?.toFixed(2) ?? "—"}`
    );
  }
}

async function showStints(sessionKey: number) {
  hr("Tyre Stints");
  const stints = await fastF1.getStints(sessionKey);
  console.log(`${"Driver#".padEnd(10)} ${"Stint".padEnd(8)} ${"Compound".padEnd(12)} ${"Lap In".padEnd(10)} Lap Out`);
  for (const s of stints) {
    console.log(
      `${String(s.driver_number).padEnd(10)} ${String(s.stint_number).padEnd(8)} ` +
      `${(s.compound ?? "—").padEnd(12)} ${String(s.lap_start).padEnd(10)} ${s.lap_end ?? "—"}`
    );
  }
}

async function showRaceControl(sessionKey: number) {
  hr("Race Control Messages");
  const msgs = await fastF1.getRaceControlMessages(sessionKey);
  for (const m of msgs.slice(-20)) {
    const flag = m.flag ? `[${m.flag}] ` : "";
    console.log(`  ${m.date}  ${flag}${m.message}`);
  }
  if (msgs.length > 20) console.log(`  … (${msgs.length - 20} earlier messages hidden)`);
}

async function showWeather(sessionKey: number) {
  hr("Weather");
  const weather = await fastF1.getWeather(sessionKey);
  if (!weather.length) { console.log("  No weather data."); return; }
  const latest = weather[weather.length - 1];
  console.log(`  Air temp:    ${latest.air_temperature} °C`);
  console.log(`  Track temp:  ${latest.track_temperature} °C`);
  console.log(`  Humidity:    ${latest.humidity} %`);
  console.log(`  Wind speed:  ${latest.wind_speed} m/s`);
  console.log(`  Rainfall:    ${latest.rainfall ? "yes" : "no"}`);
}

async function showSnapshot(sessionKey: number) {
  hr("Full LiveRaceSnapshot");
  console.log("  Fetching snapshot (this may take a few seconds)…");
  // startPolling builds the snapshot immediately then refreshes on interval
  await startPolling(sessionKey, 999_999);
  const snap = getSnapshot(sessionKey);
  stopPolling(sessionKey);
  if (!snap) {
    console.error("  ❌  No snapshot returned — FastF1 service may be down or sessionKey invalid.");
    return;
  }

  console.log(`\n  Session:     ${snap.sessionName} (${snap.sessionType})`);
  console.log(`  Session key: ${snap.sessionKey}`);
  console.log(`  Active:      ${snap.isActive}`);
  console.log(`  Updated:     ${snap.updatedAt}`);
  console.log(`  Total laps:  ${snap.totalLaps ?? "—"}`);
  console.log(`  Fastest lap: ${snap.fastestLapDriverCode ?? "—"}`);
  console.log(`  Top team:    ${snap.topTeamByF1Points ?? "—"}`);

  if (snap.weather) {
    console.log(`\n  Weather:  ${snap.weather.airTemp} °C air | ${snap.weather.trackTemp} °C track | Rain: ${snap.weather.rainfall ? "yes" : "no"}`);
  }

  hr("Driver Classification");
  console.log(
    `${"P".padEnd(4)} ${"Code".padEnd(6)} ${"Driver".padEnd(22)} ${"Team".padEnd(20)} ${"Gap".padEnd(12)} ${"Interval".padEnd(12)} ${"Last Lap".padEnd(12)} ${"Fastest".padEnd(12)} Compound  Pits  FL?`
  );
  for (const d of snap.drivers) {
    console.log(
      `${String(d.position).padEnd(4)} ${d.code.padEnd(6)} ` +
      `${(d.firstName + " " + d.lastName).padEnd(22)} ${d.teamName.padEnd(20)} ` +
      `${fmt(d.gap).padEnd(12)} ${fmt(d.interval).padEnd(12)} ` +
      `${fmt(d.lastLapTime).padEnd(12)} ${fmt(d.fastestLapTime).padEnd(12)} ` +
      `${(d.compound ?? "—").padEnd(10)} ${String(d.pitStops).padEnd(6)} ${d.isFastest ? "⚡" : ""}`
    );
  }

  if (snap.raceControl.length) {
    hr("Recent Race Control");
    for (const m of snap.raceControl.slice(-5)) {
      const flag = m.flag ? `[${m.flag}] ` : "";
      console.log(`  ${m.date}  ${flag}${m.message}`);
    }
  }
}

// ─── Entry point ─────────────────────────────────────────────────────────────

async function main() {
  const [, , arg1, arg2] = process.argv;

  // No args or "sessions [year]" — list available sessions
  if (!arg1 || arg1 === "sessions") {
    const year = Number(arg2) || new Date().getFullYear();
    await showSessions(year);
    return;
  }

  const sessionKey = parseInt(arg1, 10);
  if (isNaN(sessionKey)) {
    console.error("Usage: npx tsx scripts/test-live.ts <sessionKey> [endpoint]");
    console.error("       npx tsx scripts/test-live.ts sessions [year]");
    process.exit(1);
  }

  const endpoint = (arg2 ?? "snapshot").toLowerCase();

  switch (endpoint) {
    case "positions":    await showPositions(sessionKey);    break;
    case "drivers":      await showDrivers(sessionKey);      break;
    case "laps":         await showLaps(sessionKey);         break;
    case "intervals":    await showIntervals(sessionKey);    break;
    case "pit":          await showPits(sessionKey);         break;
    case "stints":       await showStints(sessionKey);       break;
    case "race_control": await showRaceControl(sessionKey);  break;
    case "weather":      await showWeather(sessionKey);      break;
    case "snapshot":
    default:             await showSnapshot(sessionKey);     break;
  }
}

main().catch((e) => {
  console.error("\n❌ Error:", e.message ?? e);
  process.exit(1);
});
