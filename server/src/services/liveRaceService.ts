import { EventEmitter } from "events";
import prisma from "../config/database";
import * as fastF1 from "./fastF1Client";

// ─── F1 points scale (P1–P10) ────────────────────────────────────────────────
const F1_PTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

// ─── Public types ─────────────────────────────────────────────────────────────

export interface DriverLiveData {
  number: number;
  code: string;
  firstName: string;
  lastName: string;
  teamName: string;
  teamColor: string | null;
  position: number;
  gap: string;        // e.g. "+3.421" or "1 LAP"
  interval: string;   // gap to car ahead
  lastLapTime: string | null;    // "1:28.456"
  fastestLapTime: string | null; // personal best this session
  isFastest: boolean; // holds the overall fastest lap
  pitStops: number;
  compound: string | null; // SOFT | MEDIUM | HARD | WET | INTER
}

export interface RaceControlMsg {
  date: string;
  category: string;
  message: string;
  flag: string | null;
}

export interface WeatherSnapshot {
  airTemp: number;
  trackTemp: number;
  humidity: number;
  windSpeed: number;
  rainfall: boolean;
}

export interface LiveRaceSnapshot {
  sessionKey: number;
  sessionName: string;
  sessionType: string;  // "Race" | "Qualifying" | "Sprint" | …
  isActive: boolean;
  updatedAt: string;    // ISO timestamp
  drivers: DriverLiveData[];
  raceControl: RaceControlMsg[];
  weather: WeatherSnapshot | null;
  fastestLapDriverCode: string | null;
  topTeamByF1Points: string | null;
  totalLaps: number | null;
}

export interface PointBreakdownLive {
  qualiFirst: number;
  qualiSecond: number;
  qualiThird: number;
  raceFirst: number;
  raceSecond: number;
  raceThird: number;
  fastestLap: number;
  topTeam: number;
}

export interface UserLivePoints {
  userId: string;
  username: string;
  avatarUrl: string | null;
  favoriteTeam: string;
  livePoints: number;
  breakdown: PointBreakdownLive;
}

// ─── Pub/Sub emitter ─────────────────────────────────────────────────────────
// Emits `update:<sessionKey>` with a LiveRaceSnapshot payload.
export const liveEmitter = new EventEmitter();
liveEmitter.setMaxListeners(500);

// ─── In-memory state ─────────────────────────────────────────────────────────
const snapshots = new Map<number, LiveRaceSnapshot>();
const pollers = new Map<number, ReturnType<typeof setInterval>>();

// ─── Formatting helpers ───────────────────────────────────────────────────────

function fmtGap(seconds: number | null): string {
  if (seconds == null) return "";
  if (seconds < 0) return `${Math.abs(Math.round(seconds))} LAP`;
  if (seconds === 0) return "LEADER";
  return `+${seconds.toFixed(3)}`;
}

function fmtLapTime(seconds: number | null): string | null {
  if (seconds == null) return null;
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3).padStart(6, "0");
  return `${mins}:${secs}`;
}

// ─── Core snapshot builder ────────────────────────────────────────────────────

async function buildSnapshot(sessionKey: number): Promise<LiveRaceSnapshot> {
  // Fetch everything in parallel; degrade gracefully on partial failure
  const results = await Promise.allSettled([
    fastF1.getFinalPositions(sessionKey),     // [0] current positions
    fastF1.getSessionDrivers(sessionKey),     // [1] driver profiles
    fastF1.getIntervals(sessionKey),          // [2] gaps
    fastF1.getAllLaps(sessionKey),            // [3] all laps (for FL + last lap)
    fastF1.getPitStops(sessionKey),           // [4] pit events
    fastF1.getStints(sessionKey),             // [5] tyre stints
    fastF1.getRaceControlMessages(sessionKey), // [6] flags/SC/etc
    fastF1.getWeather(sessionKey),            // [7] weather samples
    fastF1.getSessions(new Date().getFullYear()), // [8] session metadata
  ]);

  const ok = <T>(r: PromiseSettledResult<T>, fallback: T): T =>
    r.status === "fulfilled" ? r.value : fallback;

  const positions   = ok(results[0], [] as fastF1.FastF1Position[]);
  const drivers     = ok(results[1], [] as fastF1.FastF1Driver[]);
  const intervals   = ok(results[2], [] as fastF1.FastF1Interval[]);
  const allLaps     = ok(results[3], [] as fastF1.FastF1Lap[]);
  const pits        = ok(results[4], [] as fastF1.FastF1Pit[]);
  const stints      = ok(results[5], [] as fastF1.FastF1Stint[]);
  const raceCtrl    = ok(results[6], [] as fastF1.FastF1RaceControl[]);
  const weatherData = ok(results[7], [] as fastF1.FastF1Weather[]);
  const sessions    = ok(results[8], [] as fastF1.FastF1Session[]);

  const sess = sessions.find((s) => s.session_key === sessionKey);

  // Build fast-lookup maps
  const driverByNum = new Map(drivers.map((d) => [d.driver_number, d]));

  // Latest interval per driver
  const latestInterval = new Map<number, fastF1.FastF1Interval>();
  for (const i of intervals) {
    const ex = latestInterval.get(i.driver_number);
    if (!ex || i.date > ex.date) latestInterval.set(i.driver_number, i);
  }

  // Per-driver: personal best lap time & latest finished lap
  const personalBest = new Map<number, number>();
  const latestLap = new Map<number, fastF1.FastF1Lap>();
  for (const lap of allLaps) {
    if (!lap.is_pit_out_lap && lap.lap_time != null) {
      const best = personalBest.get(lap.driver_number);
      if (best == null || lap.lap_time < best) {
        personalBest.set(lap.driver_number, lap.lap_time);
      }
    }
    const ll = latestLap.get(lap.driver_number);
    if (!ll || lap.lap_number > ll.lap_number) latestLap.set(lap.driver_number, lap);
  }

  // Overall fastest lap
  let flDriverNum: number | null = null;
  let flTime = Infinity;
  for (const [num, t] of personalBest) {
    if (t < flTime) { flTime = t; flDriverNum = num; }
  }
  const fastestLapDriverCode = flDriverNum
    ? (driverByNum.get(flDriverNum)?.name_acronym ?? null)
    : null;

  // Pit stop count per driver
  const pitCount = new Map<number, number>();
  for (const pit of pits) {
    pitCount.set(pit.driver_number, (pitCount.get(pit.driver_number) ?? 0) + 1);
  }

  // Current tyre compound per driver (last stint)
  const compound = new Map<number, string>();
  for (const s of stints) compound.set(s.driver_number, s.compound);

  // Team F1 points from current positions
  const teamF1Pts = new Map<string, number>();
  for (const pos of positions) {
    const drv = driverByNum.get(pos.driver_number);
    if (!drv) continue;
    const pts = F1_PTS[pos.position - 1] ?? 0;
    teamF1Pts.set(drv.team_name, (teamF1Pts.get(drv.team_name) ?? 0) + pts);
  }
  let topTeamByF1Points: string | null = null;
  let maxPts = -1;
  for (const [team, pts] of teamF1Pts) {
    if (pts > maxPts) { maxPts = pts; topTeamByF1Points = team; }
  }

  // Build driver list sorted by position
  const driverList: DriverLiveData[] = positions
    .sort((a, b) => a.position - b.position)
    .map((pos) => {
      const drv = driverByNum.get(pos.driver_number);
      const intv = latestInterval.get(pos.driver_number);
      const ll = latestLap.get(pos.driver_number);
      const best = personalBest.get(pos.driver_number) ?? null;
      return {
        number: pos.driver_number,
        code: drv?.name_acronym ?? "???",
        firstName: drv?.first_name ?? "",
        lastName: drv?.last_name ?? "",
        teamName: drv?.team_name ?? "",
        teamColor: drv?.team_colour ? `#${drv.team_colour}` : null,
        position: pos.position,
        gap: fmtGap(intv?.gap_to_leader ?? null),
        interval: fmtGap(intv?.interval ?? null),
        lastLapTime: fmtLapTime(ll?.lap_time ?? null),
        fastestLapTime: fmtLapTime(best),
        isFastest: pos.driver_number === flDriverNum,
        pitStops: pitCount.get(pos.driver_number) ?? 0,
        compound: compound.get(pos.driver_number) ?? null,
      };
    });

  // Weather (latest sample)
  let weather: WeatherSnapshot | null = null;
  if (weatherData.length > 0) {
    const w = weatherData[weatherData.length - 1];
    weather = {
      airTemp: w.air_temperature,
      trackTemp: w.track_temperature,
      humidity: w.humidity,
      windSpeed: w.wind_speed,
      rainfall: w.rainfall,
    };
  }

  // Race control (last 30 messages most recent first)
  const raceControl: RaceControlMsg[] = [...raceCtrl]
    .sort((a, b) => (a.date > b.date ? -1 : 1))
    .slice(0, 30)
    .map((rc) => ({
      date: rc.date,
      category: rc.category,
      message: rc.message,
      flag: rc.flag ?? null,
    }));

  const now = new Date().toISOString();
  const isActive = sess
    ? new Date(sess.date_start) <= new Date() &&
      (!sess.date_end || new Date(sess.date_end) >= new Date())
    : false;

  return {
    sessionKey,
    sessionName: sess?.session_name ?? "Session",
    sessionType: sess?.session_name ?? "Unknown",
    isActive,
    updatedAt: now,
    drivers: driverList,
    raceControl,
    weather,
    fastestLapDriverCode,
    topTeamByF1Points,
    totalLaps: null, // FastF1 doesn't expose scheduled lap count; set externally if known
  };
}

// ─── Polling control ─────────────────────────────────────────────────────────

const failureCounts = new Map<number, number>();
const MAX_CONSECUTIVE_FAILURES = 5; // stop polling after 5 consecutive errors

export async function startPolling(sessionKey: number, intervalMs = 5_000) {
  if (pollers.has(sessionKey)) return;
  console.log(`[Live] Polling started for session ${sessionKey}`);
  failureCounts.set(sessionKey, 0);

  const tick = async () => {
    try {
      const snap = await buildSnapshot(sessionKey);
      failureCounts.set(sessionKey, 0); // reset on success
      snapshots.set(sessionKey, snap);
      liveEmitter.emit(`update:${sessionKey}`, snap);
    } catch (err) {
      const failures = (failureCounts.get(sessionKey) ?? 0) + 1;
      failureCounts.set(sessionKey, failures);
      if (failures >= MAX_CONSECUTIVE_FAILURES) {
        console.warn(`[Live] Session ${sessionKey} failed ${failures} times in a row — stopping poller. Run reset if this is a test race.`);
        stopPolling(sessionKey);
      } else {
        console.error(`[Live] Poll error session ${sessionKey} (${failures}/${MAX_CONSECUTIVE_FAILURES}):`, (err as Error).message);
      }
    }
  };

  tick(); // Fire initial update without blocking
  pollers.set(sessionKey, setInterval(tick, intervalMs));
}

export function stopPolling(sessionKey: number) {
  const t = pollers.get(sessionKey);
  if (t) { clearInterval(t); pollers.delete(sessionKey); }
  console.log(`[Live] Polling stopped for session ${sessionKey}`);
}

export function getSnapshot(sessionKey: number): LiveRaceSnapshot | null {
  return snapshots.get(sessionKey) ?? null;
}

// ─── Live points calculation ──────────────────────────────────────────────────

export async function getLivePointsForGrid(
  snapshot: LiveRaceSnapshot,
  raceWeekendId: string,
  gridId: string,
): Promise<UserLivePoints[]> {
  const predictions = await prisma.prediction.findMany({
    where: { raceWeekendId, gridId },
    include: { user: { select: { id: true, username: true, avatarUrl: true, favoriteTeam: true } } },
  });

  // Fetch stored results in case quali is already finalized
  const raceWeekend = await prisma.raceWeekend.findUnique({
    where: { id: raceWeekendId },
    include: { results: true },
  });

  const top3 = snapshot.drivers.slice(0, 3);
  const isRaceSession = snapshot.sessionType === "Race" || snapshot.sessionName === "Race";
  const norm = (s: string) => s.trim().toUpperCase();

  // Podium scoring: exact position = 3pts, in podium wrong slot = 1pt, else 0
  const podiumScore = (predicted: string, exactCode: string, podiumCodes: string[]) => {
    const n = norm(predicted);
    if (n === norm(exactCode)) return 3;
    if (podiumCodes.includes(n)) return 1;
    return 0;
  };

  type PredictionRow = (typeof predictions)[number];

  return predictions.map((pred: PredictionRow) => {
    let qualiFirst = 0, qualiSecond = 0, qualiThird = 0;
    let raceFirst = 0, raceSecond = 0, raceThird = 0;
    let fastestLap = 0, topTeam = 0;

    if (isRaceSession) {
      const livePodium = top3.map(d => norm(d.code));
      raceFirst  = podiumScore(pred.raceFirst,  top3[0]?.code ?? "", livePodium);
      raceSecond = podiumScore(pred.raceSecond, top3[1]?.code ?? "", livePodium);
      raceThird  = podiumScore(pred.raceThird,  top3[2]?.code ?? "", livePodium);
      fastestLap = snapshot.fastestLapDriverCode === norm(pred.fastestLap) ? 2 : 0;
      topTeam    = snapshot.topTeamByF1Points === norm(pred.topTeam) ? 1 : 0;

      const qr = raceWeekend?.results;
      if (qr) {
        const qPodium = [norm(qr.qualiFirst), norm(qr.qualiSecond), norm(qr.qualiThird)];
        qualiFirst  = podiumScore(pred.qualiFirst,  qr.qualiFirst,  qPodium);
        qualiSecond = podiumScore(pred.qualiSecond, qr.qualiSecond, qPodium);
        qualiThird  = podiumScore(pred.qualiThird,  qr.qualiThird,  qPodium);
      }
    } else {
      const livePodium = top3.map(d => norm(d.code));
      qualiFirst  = podiumScore(pred.qualiFirst,  top3[0]?.code ?? "", livePodium);
      qualiSecond = podiumScore(pred.qualiSecond, top3[1]?.code ?? "", livePodium);
      qualiThird  = podiumScore(pred.qualiThird,  top3[2]?.code ?? "", livePodium);
    }

    const breakdown: PointBreakdownLive = {
      qualiFirst, qualiSecond, qualiThird,
      raceFirst, raceSecond, raceThird,
      fastestLap, topTeam,
    };
    const livePoints = Object.values(breakdown).reduce((s, v) => s + v, 0);

    return {
      userId: pred.user.id,
      username: pred.user.username,
      avatarUrl: pred.user.avatarUrl ?? null,
      favoriteTeam: pred.user.favoriteTeam ?? "ferrari",
      livePoints,
      breakdown,
    };
  });
}

// ─── Live session detection (called by cron) ──────────────────────────────────

export async function detectAndManageLiveSessions(): Promise<void> {
  const now = new Date();
  const WINDOW_BEFORE_MS = 30 * 60 * 1000;  // 30 min early
  const WINDOW_AFTER_MS  = 4 * 60 * 60 * 1000; // 4 h after start

  const windowStart = new Date(now.getTime() - WINDOW_AFTER_MS);
  const windowEnd   = new Date(now.getTime() + WINDOW_BEFORE_MS);

  // Race sessions in window
  const raceWeekends = await prisma.raceWeekend.findMany({
    where: {
      status: { not: "COMPLETED" },
      raceDate: { gte: windowStart, lte: windowEnd },
      externalId: { not: null },
    },
  });

  for (const w of raceWeekends) {
    if (w.externalId && !pollers.has(w.externalId)) {
      await startPolling(w.externalId);
    }
  }

  // Qualifying sessions in window
  const qualiWeekends = await prisma.raceWeekend.findMany({
    where: {
      status: { not: "COMPLETED" },
      qualifyingDate: { gte: windowStart, lte: windowEnd },
      qualiSessionKey: { not: null },
    },
  });

  for (const w of qualiWeekends) {
    if (w.qualiSessionKey && !pollers.has(w.qualiSessionKey)) {
      await startPolling(w.qualiSessionKey);
    }
  }

  // Stop polling old sessions that finished more than 4 h ago
  for (const [key] of pollers) {
    const snap = snapshots.get(key);
    if (snap && !snap.isActive) {
      const age = Date.now() - new Date(snap.updatedAt).getTime();
      if (age > WINDOW_AFTER_MS) stopPolling(key);
    }
  }
}
