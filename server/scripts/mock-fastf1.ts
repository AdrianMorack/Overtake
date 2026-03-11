/**
 * mock-fastf1.ts
 * A controllable mock FastF1 Bridge for testing live race features end-to-end.
 *
 * Usage:
 *   1. npm run test:race-setup -- --grid <gridId>
 *   2. Follow the easy instructions given from the above command
 *
 * The dashboard lets you:
 *   - Click two rows to swap driver positions
 *   - Trigger pit stops (choose compound)
 *   - Advance the lap counter
 *   - Fire race control flags (SC, VSC, Yellow, Red, Chequered)
 *   - Toggle rain
 *   - Reset to starting grid
 */

import express, { Request, Response } from "express";

const PORT        = parseInt(process.env.MOCK_PORT ?? "8199", 10);
const SESSION_KEY = 9999;
const YEAR        = new Date().getFullYear();
const TOTAL_LAPS  = 57;

// ─── 2025/2026 F1 Driver Roster ───────────────────────────────────────────────

const ROSTER = [
  { number:  1, code: "VER", first: "Max",       last: "Verstappen", team: "Red Bull Racing", color: "3671C6" },
  { number:  4, code: "NOR", first: "Lando",     last: "Norris",     team: "McLaren",          color: "FF8000" },
  { number: 81, code: "PIA", first: "Oscar",     last: "Piastri",    team: "McLaren",          color: "FF8000" },
  { number: 16, code: "LEC", first: "Charles",   last: "Leclerc",    team: "Ferrari",          color: "E8002D" },
  { number: 44, code: "HAM", first: "Lewis",     last: "Hamilton",   team: "Ferrari",          color: "E8002D" },
  { number: 63, code: "RUS", first: "George",    last: "Russell",    team: "Mercedes",         color: "27F4D2" },
  { number: 12, code: "ANT", first: "Kimi",      last: "Antonelli",  team: "Mercedes",         color: "27F4D2" },
  { number: 14, code: "ALO", first: "Fernando",  last: "Alonso",     team: "Aston Martin",     color: "229971" },
  { number: 18, code: "STR", first: "Lance",     last: "Stroll",     team: "Aston Martin",     color: "229971" },
  { number: 55, code: "SAI", first: "Carlos",    last: "Sainz",      team: "Williams",         color: "64C4FF" },
  { number: 23, code: "ALB", first: "Alexander", last: "Albon",      team: "Williams",         color: "64C4FF" },
  { number: 22, code: "TSU", first: "Yuki",      last: "Tsunoda",    team: "RB",               color: "6692FF" },
  { number: 30, code: "LAW", first: "Liam",      last: "Lawson",     team: "RB",               color: "6692FF" },
  { number: 10, code: "GAS", first: "Pierre",    last: "Gasly",      team: "Alpine",           color: "FF87BC" },
  { number:  5, code: "COL", first: "Franco",    last: "Colapinto",  team: "Alpine",           color: "FF87BC" },
  { number: 27, code: "HUL", first: "Nico",      last: "Hulkenberg", team: "Sauber",           color: "52E252" },
  { number: 77, code: "BOT", first: "Valtteri",  last: "Bottas",     team: "Sauber",           color: "52E252" },
  { number: 31, code: "OCO", first: "Esteban",   last: "Ocon",       team: "Haas F1 Team",     color: "B6BABD" },
  { number: 87, code: "BEA", first: "Oliver",    last: "Bearman",    team: "Haas F1 Team",     color: "B6BABD" },
  { number:  6, code: "HAD", first: "Isack",     last: "Hadjar",     team: "Red Bull Racing",  color: "3671C6" },
];

// ─── Mutable state ────────────────────────────────────────────────────────────

interface DriverState {
  number:    number;
  code:      string;
  pos:       number;
  baseLapMs: number;
  compound:  string;
  pitStops:  number;
  pitLaps:   number[];
}

interface RaceControlEntry {
  date:     string;
  category: string;
  message:  string;
  flag:     string | null;
  scope:    string;
}

interface State {
  lap:         number;
  drivers:     DriverState[];
  pits:        Array<{ driver_number: number; lap_number: number; pit_duration: number; date: string }>;
  raceControl: RaceControlEntry[];
  weather:     { air: number; track: number; humidity: number; windSpeed: number; rainfall: boolean };
}

function freshState(): State {
  return {
    lap: 1,
    drivers: ROSTER.map((d, i) => ({
      number:    d.number,
      code:      d.code,
      pos:       i + 1,
      baseLapMs: 90_500 + Math.round(Math.random() * 2_000),
      compound:  i < 13 ? "MEDIUM" : "HARD",
      pitStops:  0,
      pitLaps:   [],
    })),
    pits: [],
    raceControl: [
      { date: new Date().toISOString(), category: "Other",
        message: "LIGHTS OUT AND AWAY WE GO", flag: "GREEN", scope: "Track" },
    ],
    weather: { air: 28, track: 42, humidity: 45, windSpeed: 1.2, rainfall: false },
  };
}

let state: State = freshState();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const byCode = (code: string) =>
  state.drivers.find(d => d.code.toUpperCase() === code.toUpperCase());

const byPos = (pos: number) =>
  state.drivers.find(d => d.pos === pos);

const gapToLeader = (pos: number): number =>
  pos === 1 ? 0 : (pos - 1) * 2.1 + Math.sin(pos) * 0.4;

// ─── FastF1-compatible endpoints ──────────────────────────────────────────────

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.get("/sessions", (_req: Request, res: Response) => {
  const now   = new Date();
  const start = new Date(now.getTime() - 90 * 60 * 1000).toISOString();
  const end   = new Date(now.getTime() + 90 * 60 * 1000).toISOString();
  res.json([{
    session_key:        SESSION_KEY,
    session_name:       "Race",
    session_type:       "Race",
    date_start:         start,
    date_end:           end,
    circuit_short_name: "Test",
    country_name:       "Testonia",
    meeting_key:        999,
    year:               YEAR,
  }]);
});

app.get("/drivers", (_req: Request, res: Response) => {
  res.json(ROSTER.map(d => ({
    driver_number: d.number,
    first_name:    d.first,
    last_name:     d.last,
    name_acronym:  d.code,
    team_name:     d.team,
    team_colour:   d.color,
    headshot_url:  null,
    session_key:   SESSION_KEY,
  })));
});

app.get("/position", (_req: Request, res: Response) => {
  const now = new Date().toISOString();
  res.json(
    [...state.drivers]
      .sort((a, b) => a.pos - b.pos)
      .map(d => ({ driver_number: d.number, position: d.pos, date: now, session_key: SESSION_KEY }))
  );
});

app.get("/laps", (_req: Request, res: Response) => {
  const records: object[] = [];
  for (const d of state.drivers) {
    for (let l = 1; l < state.lap; l++) {
      const isPitOut = d.pitLaps.includes(l - 1);
      const jitter   = (Math.random() - 0.5) * 300;
      const lapMs    = isPitOut ? d.baseLapMs + 20_000 + jitter : d.baseLapMs + jitter;
      records.push({
        driver_number:    d.number,
        lap_number:       l,
        lap_time:         lapMs / 1000,
        sector1_time:     (lapMs * 0.28) / 1000,
        sector2_time:     (lapMs * 0.38) / 1000,
        sector3_time:     (lapMs * 0.34) / 1000,
        compound:         d.compound,
        is_personal_best: false,
        is_pit_out_lap:   isPitOut,
        driver:           d.code,
        session_key:      SESSION_KEY,
      });
    }
  }
  res.json(records);
});

app.get("/intervals", (_req: Request, res: Response) => {
  const now    = new Date().toISOString();
  const sorted = [...state.drivers].sort((a, b) => a.pos - b.pos);
  res.json(sorted.map((d, i) => ({
    driver_number: d.number,
    date:          now,
    gap_to_leader: i === 0 ? 0 : gapToLeader(d.pos),
    interval:      i === 0 ? 0 : gapToLeader(d.pos) - gapToLeader(sorted[i - 1].pos),
    session_key:   SESSION_KEY,
  })));
});

app.get("/pit", (_req: Request, res: Response) => {
  res.json(state.pits.map(p => ({ ...p, session_key: SESSION_KEY })));
});

app.get("/stints", (_req: Request, res: Response) => {
  res.json(state.drivers.map(d => ({
    driver_number:     d.number,
    stint_number:      d.pitStops + 1,
    compound:          d.compound,
    tyre_age_at_start: 0,
    lap_start:         d.pitLaps.length > 0 ? d.pitLaps[d.pitLaps.length - 1] + 1 : 1,
    lap_end:           null,
    fresh_tyre:        d.pitStops > 0,
    session_key:       SESSION_KEY,
  })));
});

app.get("/race_control", (_req: Request, res: Response) => {
  res.json(state.raceControl.map(m => ({ ...m, sector: null, session_key: SESSION_KEY })));
});

app.get("/weather", (_req: Request, res: Response) => {
  const w = state.weather;
  res.json([{
    date:              new Date().toISOString(),
    air_temperature:   w.air,
    track_temperature: w.track,
    wind_speed:        w.windSpeed,
    wind_direction:    180,
    rainfall:          w.rainfall,
    humidity:          w.humidity,
    pressure:          1013,
    session_key:       SESSION_KEY,
  }]);
});

// ─── Control API ──────────────────────────────────────────────────────────────

/** Full state snapshot for dashboard polling */
app.get("/mock/state", (_req, res) => {
  const sorted = [...state.drivers].sort((a, b) => a.pos - b.pos);
  res.json({
    lap:         state.lap,
    totalLaps:   TOTAL_LAPS,
    weather:     state.weather,
    raceControl: state.raceControl.slice(-5),
    drivers: sorted.map(d => {
      const r = ROSTER.find(x => x.code === d.code)!;
      return {
        position:   d.pos,
        code:       d.code,
        name:       `${r.first} ${r.last}`,
        team:       r.team,
        color:      r.color,
        compound:   d.compound,
        pitStops:   d.pitStops,
        gap:        d.pos === 1 ? "LEADER" : `+${gapToLeader(d.pos).toFixed(3)}s`,
      };
    }),
  });
});

// GET version for dashboard simplicity (returns minimal JSON)
app.get("/mock/tower", (_req, res) => {
  const sorted = [...state.drivers].sort((a, b) => a.pos - b.pos);
  res.json({
    lap:      state.lap,
    total:    TOTAL_LAPS,
    rainfall: state.weather.rainfall,
    latest:   state.raceControl[state.raceControl.length - 1] ?? null,
    drivers:  sorted.map((d, i) => {
      const r = ROSTER.find(x => x.code === d.code)!;
      return {
        pos:      d.pos,
        code:     d.code,
        name:     `${r.first[0]}. ${r.last}`,
        team:     r.team,
        color:    r.color,
        compound: d.compound,
        pits:     d.pitStops,
        gap:      i === 0 ? "LEADER" : `+${gapToLeader(d.pos).toFixed(3)}s`,
      };
    }),
  });
});

/** Swap two positions: POST /mock/swap  body: { a: 1, b: 3 } */
app.post("/mock/swap", (req: Request, res: Response) => {
  const { a, b } = req.body as { a: number; b: number };
  if (!a || !b) return res.status(400).json({ error: "a and b positions required" });
  const dA = byPos(Number(a));
  const dB = byPos(Number(b));
  if (!dA || !dB) return res.status(404).json({ error: "Position not found" });
  dA.pos = Number(b);
  dB.pos = Number(a);
  res.json({ ok: true });
});

/** Set a driver directly to a position, shifting others */
app.post("/mock/move", (req: Request, res: Response) => {
  const { code, to } = req.body as { code: string; to: number };
  const driver = byCode(code);
  if (!driver) return res.status(404).json({ error: "Driver not found" });
  const target = Number(to);
  const from   = driver.pos;
  if (from === target) return res.json({ ok: true });
  // Shift everyone between from and target
  const dir = target < from ? 1 : -1;
  for (const d of state.drivers) {
    if (d.code === code) continue;
    if (dir === 1 && d.pos >= target && d.pos < from) d.pos++;
    if (dir === -1 && d.pos > from && d.pos <= target)  d.pos--;
  }
  driver.pos = target;
  res.json({ ok: true });
});

/** Advance lap counter */
app.post("/mock/advance-lap", (_req, res) => {
  if (state.lap < TOTAL_LAPS) state.lap++;
  res.json({ lap: state.lap });
});

/** Pit stop: POST /mock/pit  body: { code: "VER", compound: "SOFT" } */
app.post("/mock/pit", (req: Request, res: Response) => {
  const { code, compound } = req.body as { code: string; compound?: string };
  const d = byCode(code);
  if (!d) return res.status(404).json({ error: "Driver not found" });
  d.pitStops++;
  d.pitLaps.push(state.lap);
  d.compound = compound?.toUpperCase() ?? "SOFT";
  const entry = {
    driver_number: d.number,
    lap_number:    state.lap,
    pit_duration:  22.5 + Math.random() * 8,
    date:          new Date().toISOString(),
  };
  state.pits.push(entry);
  state.raceControl.push({
    date:     new Date().toISOString(),
    category: "Other",
    message:  `${d.code.toUpperCase()} PIT IN – Lap ${state.lap} (${d.compound})`,
    flag:     null,
    scope:    "Car",
  });
  res.json({ ok: true, entry });
});

/** Race control flag: POST /mock/flag  body: { flag: "YELLOW", message?: "..." } */
app.post("/mock/flag", (req: Request, res: Response) => {
  const { flag, message } = req.body as { flag: string; message?: string };
  const presets: Record<string, string> = {
    YELLOW:         "YELLOW FLAG",
    "DOUBLE YELLOW":"DOUBLE YELLOW FLAG",
    RED:            "RED FLAG – RACE SUSPENDED",
    SAFETY_CAR:     "SAFETY CAR DEPLOYED",
    VSC:            "VIRTUAL SAFETY CAR DEPLOYED",
    GREEN:          "TRACK CLEAR – GREEN FLAG",
    CHEQUERED:      "CHEQUERED FLAG",
  };
  const flagTypes = ["YELLOW", "DOUBLE YELLOW", "RED", "GREEN", "CHEQUERED"];
  state.raceControl.push({
    date:     new Date().toISOString(),
    category: flag === "SAFETY_CAR" || flag === "VSC" ? "SafetyCar" : "Flag",
    message:  message ?? presets[flag] ?? flag,
    flag:     flagTypes.includes(flag) ? flag : null,
    scope:    "Track",
  });
  res.json({ ok: true });
});

/** Toggle rain: POST /mock/rain  body: { rainfall?: boolean } */
app.post("/mock/rain", (req: Request, res: Response) => {
  const { rainfall } = req.body as { rainfall?: boolean };
  state.weather.rainfall = rainfall ?? !state.weather.rainfall;
  if (state.weather.rainfall) {
    state.raceControl.push({
      date: new Date().toISOString(), category: "Other",
      message: "RAIN DETECTED – TRACK CONDITIONS CHANGING",
      flag: null, scope: "Track",
    });
  }
  res.json({ rainfall: state.weather.rainfall });
});

/** Reset to original starting grid */
app.post("/mock/reset", (_req, res) => {
  state = freshState();
  res.json({ ok: true });
});

// ─── Browser Control Dashboard ────────────────────────────────────────────────

app.get("/mock/dashboard", (_req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mock F1 Control — Overtake</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0a0a; color: #e5e5e5; font-family: 'SF Mono', 'Fira Code', monospace; font-size: 13px; min-height: 100vh; }
  h1 { font-size: 18px; letter-spacing: 3px; text-transform: uppercase; color: #e10600; padding: 16px 20px 0; }
  .sub { color: #666; font-size: 11px; padding: 4px 20px 16px; font-family: sans-serif; }
  .layout { display: flex; gap: 16px; padding: 0 16px 16px; flex-wrap: wrap; }
  .tower-wrap { flex: 1 1 420px; }
  .controls-wrap { flex: 0 0 280px; display: flex; flex-direction: column; gap: 10px; }
  /* Lap bar */
  .lapbar { background: #111; border: 1px solid #222; border-radius: 8px; padding: 12px 16px; margin: 0 16px 12px; display: flex; align-items: center; gap: 16px; }
  .lapnum { font-size: 22px; font-weight: 700; color: #fff; letter-spacing: 2px; }
  .laptotal { color: #555; font-size: 18px; }
  .lap-progress { flex: 1; height: 4px; background: #222; border-radius: 2px; overflow: hidden; }
  .lap-fill { height: 100%; background: linear-gradient(90deg, #e10600, #ff6b00); border-radius: 2px; transition: width 0.4s; }
  .weather-badge { font-size: 11px; padding: 3px 8px; border-radius: 4px; background: #1a1a1a; color: #888; cursor: pointer; border: 1px solid #333; }
  .weather-badge.rain { background: #0a2a3a; color: #4fc3f7; border-color: #1a5a7a; }
  /* Timing tower */
  .tower { background: #111; border: 1px solid #1e1e1e; border-radius: 8px; overflow: hidden; }
  .tower-head { display: grid; grid-template-columns: 32px 36px 1fr 70px 60px 60px 36px; gap: 0; padding: 6px 10px; border-bottom: 1px solid #222; color: #555; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; }
  .tower-row { display: grid; grid-template-columns: 32px 36px 1fr 70px 60px 60px 36px; gap: 0; padding: 5px 10px; border-bottom: 1px solid #161616; cursor: pointer; transition: background 0.15s; align-items: center; }
  .tower-row:hover { background: #1a1a1a; }
  .tower-row.selected-a { background: #1a2800; outline: 1px solid #8bc34a; }
  .tower-row.selected-b { background: #002a1a; outline: 1px solid #00bfa5; }
  .pos { font-weight: 700; color: #fff; }
  .pos.p1 { color: #ffd700; }
  .pos.p2 { color: #c0c0c0; }
  .pos.p3 { color: #cd7f32; }
  .bar { width: 3px; height: 16px; border-radius: 2px; }
  .dname { font-family: sans-serif; color: #ddd; }
  .code { font-weight: 700; letter-spacing: 1px; font-size: 12px; }
  .gap { color: #aaa; font-size: 11px; }
  .compound { font-size: 11px; padding: 1px 5px; border-radius: 3px; font-weight: 700; }
  .S { background: #ff3333; color: #fff; }
  .M { background: #ffdd00; color: #000; }
  .H { background: #fff; color: #000; }
  .I { background: #39b54a; color: #fff; }
  .W { background: #1565c0; color: #fff; }
  .pitbtn { background: none; border: 1px solid #333; color: #aaa; border-radius: 4px; padding: 1px 6px; cursor: pointer; font-size: 10px; font-family: monospace; }
  .pitbtn:hover { border-color: #666; color: #fff; }
  /* Control panels */
  .panel { background: #111; border: 1px solid #1e1e1e; border-radius: 8px; padding: 12px; }
  .panel-title { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #555; margin-bottom: 10px; }
  .btn { display: block; width: 100%; padding: 7px; border-radius: 5px; border: none; cursor: pointer; font-size: 12px; font-family: monospace; font-weight: 600; letter-spacing: 1px; transition: opacity 0.15s; }
  .btn:hover { opacity: 0.85; }
  .btn-red   { background: #e10600; color: #fff; }
  .btn-green { background: #1a5c1a; color: #9ef09e; }
  .btn-blue  { background: #0d2a4a; color: #4fc3f7; }
  .btn-dark  { background: #1e1e1e; color: #ccc; border: 1px solid #333; }
  .btn-sm    { padding: 5px 8px; font-size: 11px; }
  .flag-row  { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .hint { font-size: 11px; color: #555; font-family: sans-serif; margin-bottom: 8px; line-height: 1.5; }
  .select-row { display: flex; gap: 6px; margin-bottom: 6px; }
  select { background: #1a1a1a; color: #ddd; border: 1px solid #333; border-radius: 4px; padding: 5px 8px; font-family: monospace; font-size: 12px; flex: 1; }
  .rc-log { font-size: 10px; font-family: sans-serif; color: #888; line-height: 1.6; min-height: 40px; }
  .rc-log span { color: #ccc; }
  .swap-hint { font-size: 11px; color: #8bc34a; min-height: 16px; margin-bottom: 4px; }
  input[type=number] { background: #1a1a1a; border: 1px solid #333; color: #ddd; border-radius: 4px; padding: 5px 8px; font-family: monospace; font-size: 12px; width: 70px; }
</style>
</head>
<body>
<h1>F1 Race Control</h1>
<p class="sub">Mock FastF1 service — port ${PORT} — session key ${SESSION_KEY} &nbsp;|&nbsp; Server must use <code>FASTF1_BASE_URL=http://localhost:${PORT}</code></p>

<div class="lapbar">
  <div>
    <div style="font-size:10px;color:#555;letter-spacing:2px;text-transform:uppercase;margin-bottom:2px">Lap</div>
    <span class="lapnum" id="lapnum">1</span><span class="laptotal" id="laptotal"> / ${TOTAL_LAPS}</span>
  </div>
  <div class="lap-progress"><div class="lap-fill" id="lapfill" style="width:0%"></div></div>
  <div id="weather-badge" class="weather-badge" onclick="toggleRain()" title="Click to toggle rain">☀️ Dry</div>
</div>

<div class="layout">
  <!-- Timing Tower -->
  <div class="tower-wrap">
    <div class="swap-hint" id="swap-hint"></div>
    <div class="tower">
      <div class="tower-head">
        <div>P</div><div></div><div>Driver</div><div>Gap</div><div>Compound</div><div>Interval</div><div>Pits</div>
      </div>
      <div id="tower-body"></div>
    </div>
  </div>

  <!-- Controls -->
  <div class="controls-wrap">

    <!-- Race Control Flags -->
    <div class="panel">
      <div class="panel-title">Race Control</div>
      <div class="flag-row" style="margin-bottom:6px">
        <button class="btn btn-sm btn-dark" onclick="flag('GREEN')">🟢 Green</button>
        <button class="btn btn-sm btn-dark" onclick="flag('YELLOW')">🟡 Yellow</button>
      </div>
      <div class="flag-row" style="margin-bottom:6px">
        <button class="btn btn-sm btn-blue" onclick="flag('SAFETY_CAR')">🛡️ SC</button>
        <button class="btn btn-sm btn-blue" onclick="flag('VSC')">🔵 VSC</button>
      </div>
      <div class="flag-row" style="margin-bottom:6px">
        <button class="btn btn-sm btn-red" onclick="flag('RED')">🔴 Red Flag</button>
        <button class="btn btn-sm btn-dark" onclick="flag('CHEQUERED')">🏁 Finish</button>
      </div>
      <div class="rc-log" id="rc-log">—</div>
    </div>

    <!-- Pit Stop -->
    <div class="panel">
      <div class="panel-title">Pit Stop</div>
      <div class="hint">Select driver + tyre, then pit in.</div>
      <div class="select-row">
        <select id="pit-driver"></select>
        <select id="pit-compound">
          <option value="SOFT">S</option>
          <option value="MEDIUM" selected>M</option>
          <option value="HARD">H</option>
          <option value="INTER">I</option>
          <option value="WET">W</option>
        </select>
      </div>
      <button class="btn btn-dark btn-sm" onclick="doPit()">🔧 PIT IN</button>
    </div>

    <!-- Move Driver -->
    <div class="panel">
      <div class="panel-title">Move Driver</div>
      <div class="hint">Set a driver directly to any position.</div>
      <div class="select-row">
        <select id="move-driver"></select>
        <span style="color:#555;padding:5px 4px">→ P</span>
        <input type="number" id="move-to" min="1" max="20" value="1">
      </div>
      <button class="btn btn-dark btn-sm" onclick="doMove()">Move</button>
    </div>

    <!-- Lap + Reset -->
    <div class="panel">
      <div class="panel-title">Session</div>
      <button class="btn btn-green" style="margin-bottom:6px" onclick="advanceLap()">▶ Advance Lap</button>
      <button class="btn btn-dark btn-sm" onclick="doReset()">↩ Reset Grid</button>
    </div>

  </div>
</div>

<script>
let selectedA = null;
let currentDrivers = [];

function cmpColor(c) {
  return '#' + c;
}

function compoundClass(c) {
  return { SOFT:'S', MEDIUM:'M', HARD:'H', INTER:'I', INTERMEDIATE:'I', WET:'W' }[c] || 'M';
}

function renderTower(data) {
  const body = document.getElementById('tower-body');
  currentDrivers = data.drivers;

  body.innerHTML = data.drivers.map((d, i) => {
    const posClass = d.pos === 1 ? 'p1' : d.pos === 2 ? 'p2' : d.pos === 3 ? 'p3' : '';
    const cpd  = compoundClass(d.compound);
    const isA  = selectedA === d.pos;
    const rowCls = isA ? 'tower-row selected-a' : 'tower-row';
    return \`<div class="\${rowCls}" onclick="selectRow(\${d.pos})" data-pos="\${d.pos}">
      <div class="pos \${posClass}">\${d.pos}</div>
      <div><div class="bar" style="background:\${cmpColor(d.color)}"></div></div>
      <div class="dname"><span class="code">\${d.code}</span> \${d.name}</div>
      <div class="gap">\${d.gap}</div>
      <div><span class="compound \${cpd}">\${cpd}</span></div>
      <div class="gap">\${i === 0 ? '—' : d.gap}</div>
      <div>\${d.pits > 0 ? d.pits : '—'}</div>
    </div>\`;
  }).join('');

  // Lap bar
  document.getElementById('lapnum').textContent  = data.lap;
  document.getElementById('lapfill').style.width  = (data.lap / data.total * 100) + '%';

  // Weather badge
  const badge = document.getElementById('weather-badge');
  if (data.rainfall) {
    badge.textContent = '🌧️ Rain';
    badge.className   = 'weather-badge rain';
  } else {
    badge.textContent = '☀️ Dry';
    badge.className   = 'weather-badge';
  }

  // Race control log
  if (data.latest) {
    const flag = data.latest.flag ? \`[\${data.latest.flag}] \` : '';
    document.getElementById('rc-log').innerHTML =
      \`<span>\${flag}\${data.latest.message}</span><br>\${new Date(data.latest.date).toLocaleTimeString()}\`;
  }

  // Populate driver selects
  const codes = data.drivers.map(d => d.code);
  populateSelect('pit-driver',  codes);
  populateSelect('move-driver', codes);
}

function populateSelect(id, codes) {
  const sel = document.getElementById(id);
  const cur = sel.value;
  if (codes.join() === [...sel.options].map(o => o.value).join()) return;
  sel.innerHTML = codes.map(c => \`<option value="\${c}">\${c}</option>\`).join('');
  if (cur && codes.includes(cur)) sel.value = cur;
}

async function selectRow(pos) {
  if (!selectedA) {
    selectedA = pos;
    document.getElementById('swap-hint').textContent =
      \`P\${pos} selected — click another position to swap\`;
  } else if (selectedA === pos) {
    selectedA = null;
    document.getElementById('swap-hint').textContent = '';
  } else {
    const a = selectedA, b = pos;
    selectedA = null;
    document.getElementById('swap-hint').textContent = \`Swapping P\${a} ↔ P\${b}…\`;
    await fetch('/mock/swap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ a, b }),
    });
    document.getElementById('swap-hint').textContent = '';
  }
}

async function flag(f) {
  await fetch('/mock/flag', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ flag: f }),
  });
}

async function doPit() {
  const code     = document.getElementById('pit-driver').value;
  const compound = document.getElementById('pit-compound').value;
  await fetch('/mock/pit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, compound }),
  });
}

async function doMove() {
  const code = document.getElementById('move-driver').value;
  const to   = parseInt(document.getElementById('move-to').value, 10);
  await fetch('/mock/move', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, to }),
  });
}

async function advanceLap() {
  await fetch('/mock/advance-lap', { method: 'POST' });
}

async function toggleRain() {
  await fetch('/mock/rain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
}

async function doReset() {
  if (!confirm('Reset to original starting grid?')) return;
  await fetch('/mock/reset', { method: 'POST' });
  selectedA = null;
  document.getElementById('swap-hint').textContent = '';
}

async function refresh() {
  try {
    const r    = await fetch('/mock/tower');
    const data = await r.json();
    renderTower(data);
  } catch (e) { /* ignore network hiccup */ }
}

setInterval(refresh, 800);
refresh();
</script>
</body>
</html>`);
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n  ✅  Mock FastF1 service → http://localhost:${PORT}`);
  console.log(`  🎛️   Control dashboard  → http://localhost:${PORT}/mock/dashboard`);
  console.log(`  🔑  Session key         → ${SESSION_KEY}\n`);
  console.log(`  To wire up the server:`);
  console.log(`    FASTF1_BASE_URL=http://localhost:${PORT} npm run dev\n`);
  console.log(`  Or run setup script first to create the test race in DB:`);
  console.log(`    npx tsx scripts/setup-test-race.ts\n`);
});
