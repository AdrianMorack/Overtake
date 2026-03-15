import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, CheckCircle2, Lock, Flag, Zap, Timer, Copy, Trophy } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { Driver, Grid, Team, RaceWeekend, Prediction } from "../types";
import { DriverAutocomplete } from "../components/common/DriverAutocomplete";
import { TeamAutocomplete } from "../components/common/TeamAutocomplete";

function PositionSlot({
  pos,
  label,
  children,
  accent = "primary",
}: {
  pos: string;
  label: string;
  children: React.ReactNode;
  accent?: "primary" | "secondary";
}) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-border/50 last:border-0">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center telemetry-text text-sm shrink-0 mt-1 ${
          accent === "secondary"
            ? "bg-theme-secondary/20 text-theme-secondary"
            : "bg-theme-primary/20 text-theme-primary"
        }`}
      >
        {pos}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground telemetry-text mb-2">{label}</p>
        {children}
      </div>
    </div>
  );
}

function LockedPredictionRow({
  label,
  predicted,
  official,
  points,
}: {
  label: string;
  predicted: string;
  official?: string | null;
  points?: number;
}) {
  const hasResult = official != null && official !== "";
  const isCorrect = hasResult && predicted.toUpperCase() === official.toUpperCase();
  const isInPodium = points != null && points > 0;

  return (
    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
      <div className="flex-1">
        <div className="text-xs text-muted-foreground telemetry-text mb-0.5">{label}</div>
        <div className="telemetry-text text-theme-primary">{predicted}</div>
        {hasResult && !isCorrect && (
          <div className="text-xs text-muted-foreground mt-0.5">
            Actual: <span className="text-theme-secondary">{official}</span>
          </div>
        )}
      </div>
      {hasResult ? (
        <div className="flex items-center gap-2">
          {isInPodium ? (
            <CheckCircle2 className={`w-5 h-5 ${points === 3 ? "text-green-500" : "text-yellow-500"}`} />
          ) : (
            <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="text-red-500 text-xs">✗</span>
            </div>
          )}
          {points != null && points > 0 && (
            <span className="text-green-500 telemetry-text text-sm">+{points}</span>
          )}
        </div>
      ) : (
        <span className="text-xs text-muted-foreground telemetry-text">PENDING</span>
      )}
    </div>
  );
}

function LockedPredictionView({ prediction, race }: { prediction: Prediction; race: RaceWeekend }) {
  const results = race.results;
  const breakdown = (prediction.breakdown ?? {}) as Record<string, number>;
  const total = prediction.totalPoints;
  const hasQualiResults = results?.qualiFirst != null;
  const hasRaceResults = results?.raceFirst != null;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      {/* Score summary */}
      {(hasQualiResults || hasRaceResults) && (
        <div className="grid-panel p-6 rounded-lg mb-4 bg-gradient-to-r from-theme-primary/20 to-theme-primary/5 border-theme-primary">
          <div className="flex items-center gap-4">
            <Trophy className="w-10 h-10 text-theme-primary" />
            <div>
              <div className="text-xs text-muted-foreground telemetry-text mb-1">
                {hasRaceResults ? "YOUR TOTAL SCORE" : "YOUR SCORE (QUALIFYING)"}
              </div>
              <div className="text-3xl text-theme-primary telemetry-text">{total}</div>
              <div className="text-xs text-muted-foreground">
                {hasRaceResults ? "/ 21 possible" : `/ 9 qualifying points${hasRaceResults ? "" : " • Race pending"}`}
              </div>
            </div>
          </div>
        </div>
      )}

      {!hasQualiResults && !hasRaceResults && (
        <div className="grid-panel p-4 rounded-lg mb-4 border-theme-primary/30 bg-theme-primary/5">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-theme-primary" />
            <div>
              <div className="telemetry-text text-sm text-theme-primary">PREDICTIONS LOCKED</div>
              <p className="text-xs text-muted-foreground">Your picks are in! Results will update automatically as sessions complete.</p>
            </div>
          </div>
        </div>
      )}

      {/* Qualifying predictions */}
      <div className="grid-panel rounded-lg overflow-hidden mb-4">
        <div className="panel-header px-5 py-3 flex items-center gap-3">
          <Timer className="w-4 h-4 text-theme-primary" />
          <div>
            <h2 className="text-base">Qualifying</h2>
            <p className="text-xs text-muted-foreground">
              {hasQualiResults ? "Results are in" : "Awaiting results"}
            </p>
          </div>
        </div>
        <div className="px-5 py-3 space-y-2">
          <LockedPredictionRow label="P1 — POLE POSITION" predicted={prediction.qualiFirst} official={results?.qualiFirst} points={breakdown.qualiFirst} />
          <LockedPredictionRow label="P2 — SECOND" predicted={prediction.qualiSecond} official={results?.qualiSecond} points={breakdown.qualiSecond} />
          <LockedPredictionRow label="P3 — THIRD" predicted={prediction.qualiThird} official={results?.qualiThird} points={breakdown.qualiThird} />
        </div>
      </div>

      {/* Race predictions */}
      <div className="grid-panel rounded-lg overflow-hidden mb-4">
        <div className="panel-header px-5 py-3 flex items-center gap-3">
          <Flag className="w-4 h-4 text-theme-secondary" />
          <div>
            <h2 className="text-base">Race</h2>
            <p className="text-xs text-muted-foreground">
              {hasRaceResults ? "Results are in" : "Awaiting results"}
            </p>
          </div>
        </div>
        <div className="px-5 py-3 space-y-2">
          <LockedPredictionRow label="P1 — WINNER" predicted={prediction.raceFirst} official={results?.raceFirst} points={breakdown.raceFirst} />
          <LockedPredictionRow label="P2 — SECOND" predicted={prediction.raceSecond} official={results?.raceSecond} points={breakdown.raceSecond} />
          <LockedPredictionRow label="P3 — THIRD" predicted={prediction.raceThird} official={results?.raceThird} points={breakdown.raceThird} />
        </div>
      </div>

      {/* Bonus predictions */}
      <div className="grid-panel rounded-lg overflow-hidden mb-4">
        <div className="panel-header px-5 py-3 flex items-center gap-3">
          <Zap className="w-4 h-4 text-theme-primary" />
          <div>
            <h2 className="text-base">Bonus</h2>
            <p className="text-xs text-muted-foreground">
              {hasRaceResults ? "Results are in" : "Awaiting results"}
            </p>
          </div>
        </div>
        <div className="px-5 py-3 space-y-2">
          <LockedPredictionRow label="FASTEST LAP" predicted={prediction.fastestLap} official={results?.fastestLap} points={breakdown.fastestLap} />
          <LockedPredictionRow label="TOP TEAM" predicted={prediction.topTeam} official={results?.topTeam} points={breakdown.topTeam} />
        </div>
      </div>
    </motion.div>
  );
}

export function PredictPage() {
  const { gridId, raceId } = useParams<{ gridId: string; raceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [race, setRace] = useState<RaceWeekend | null>(null);
  const [grid, setGrid] = useState<Grid | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [applyToAll, setApplyToAll] = useState(false);
  const [myPrediction, setMyPrediction] = useState<Prediction | null>(null);
  const [allGrids, setAllGrids] = useState<Grid[]>([]);

  const [form, setForm] = useState({
    qualiFirst: "",
    qualiSecond: "",
    qualiThird: "",
    raceFirst: "",
    raceSecond: "",
    raceThird: "",
    fastestLap: "",
    topTeam: "",
  });

  useEffect(() => {
    if (!raceId || !gridId) return;
    Promise.all([
      api.getRaceWeekends(),
      api.getDrivers(),
      api.getTeams(),
      api.getMyPredictions(gridId),
      api.getGrid(gridId),
      api.getGrids(),
    ]).then(([weekends, d, t, predictions, g, grids]) => {
      setRace(weekends.find((w) => w.id === raceId) || null);
      setDrivers(d);
      setTeams(t);
      setGrid(g);
      setAllGrids(grids.filter((gr) => gr.memberStatus === "ACTIVE"));
      const existing = predictions.find((p) => p.raceWeekendId === raceId);
      if (existing) {
        setForm({
          qualiFirst: existing.qualiFirst,
          qualiSecond: existing.qualiSecond,
          qualiThird: existing.qualiThird,
          raceFirst: existing.raceFirst,
          raceSecond: existing.raceSecond,
          raceThird: existing.raceThird,
          fastestLap: existing.fastestLap,
          topTeam: existing.topTeam,
        });
        setMyPrediction(existing);
        setIsUpdate(true);
      }
    });
  }, [gridId, raceId]);

  const setField = (field: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const filledCount = Object.values(form).filter((v) => v.length > 0).length;
  const totalFields = Object.keys(form).length;
  const allFilled = filledCount === totalFields;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allFilled || !raceId || !gridId) return;
    setLoading(true);
    setError("");
    try {
      await api.submitPrediction({
        raceWeekendId: raceId,
        gridId,
        ...form,
        applyToAllGrids: applyToAll,
      });
      setShowSuccess(true);
      setTimeout(() => navigate(`/grids/${gridId}`), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!race || !gridId || !raceId) {
    return (
      <div className="container mx-auto px-4 py-6 flex items-center justify-center min-h-64">
        <div className="text-muted-foreground telemetry-text text-sm animate-pulse">LOADING…</div>
      </div>
    );
  }

  const myMembership = grid?.memberships?.find((m) => m.userId === user?.id);
  const isPending = myMembership?.status === "PENDING";

  if (isPending) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Link
          to={`/grids/${gridId}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-theme-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm telemetry-text">BACK TO GRID</span>
        </Link>
        <div className="grid-panel p-8 rounded-lg mt-2 text-center border border-yellow-500/40 bg-yellow-500/10">
          <span className="text-4xl mb-4 block">⏳</span>
          <h2 className="text-yellow-300 telemetry-text text-lg mb-2">MEMBERSHIP PENDING</h2>
          <p className="text-muted-foreground text-sm">Your request to join this grid is awaiting approval from the grid owner. Once approved, you'll be able to submit predictions.</p>
        </div>
      </div>
    );
  }

  const locked = new Date() > new Date(race.predictionsLock);
  const lockDate = new Date(race.predictionsLock);

  return (
    <div className="container mx-auto px-4 py-6 pb-32 md:pb-10 max-w-2xl relative">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          to={`/grids/${gridId}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-theme-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm telemetry-text">BACK TO GRID</span>
        </Link>

        {/* Race Header */}
        <div className="grid-panel rounded-lg overflow-hidden mb-6 glow-primary">
          <div className="h-[3px] theme-top-bar" />
          <div className="p-6">
            <div className="text-xs text-muted-foreground telemetry-text mb-1">
              ROUND {race.round} — {race.country.toUpperCase()}
            </div>
            <h1 className="text-3xl mb-1">{race.raceName}</h1>
            <p className="text-muted-foreground text-sm mb-4">{race.circuitName}</p>
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5 text-theme-primary" />
                <span className="text-muted-foreground telemetry-text">RACE</span>
                <span className="telemetry-text">
                  {new Date(race.raceDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  {" "}
                  {new Date(race.raceDate).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              {race.qualifyingDate && (
                <div className="flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-theme-primary" />
                  <span className="text-muted-foreground telemetry-text">QUALI</span>
                  <span className="telemetry-text">
                    {new Date(race.qualifyingDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    {" "}
                    {new Date(race.qualifyingDate).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-theme-secondary" />
                <span className="text-muted-foreground telemetry-text">LOCKS</span>
                <span className={`telemetry-text ${locked ? "text-destructive" : "text-theme-secondary"}` }>
                  {lockDate.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {locked ? (
          myPrediction ? (
            <LockedPredictionView prediction={myPrediction} race={race} />
          ) : (
            <div className="grid-panel p-8 rounded-lg flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <Lock className="w-7 h-7 text-muted-foreground" />
              </div>
              <div>
                <div className="telemetry-text text-sm mb-1">PREDICTIONS LOCKED</div>
                <p className="text-muted-foreground text-sm">
                  The prediction window for this race has closed. You did not submit a prediction.
                </p>
              </div>
            </div>
          )
        ) : (
          <form onSubmit={handleSubmit}>

            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground telemetry-text">PREDICTIONS COMPLETE</span>
                <span className="text-xs telemetry-text"
                  style={{ color: allFilled ? "var(--theme-secondary)" : "var(--theme-primary)" }}
                >
                  {filledCount} / {totalFields}
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full theme-top-bar"
                  initial={{ width: 0 }}
                  animate={{ width: `${(filledCount / totalFields) * 100}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Qualifying */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid-panel rounded-lg overflow-hidden mb-4"
            >
              <div className="panel-header px-5 py-3 flex items-center gap-3">
                <Timer className="w-4 h-4 text-theme-primary" />
                <div>
                  <h2 className="text-base">Qualifying</h2>
                  <p className="text-xs text-muted-foreground">Top 3 qualifiers</p>
                </div>
              </div>
              <div className="px-5">
                <PositionSlot pos="P1" label="POLE POSITION">
                  <DriverAutocomplete drivers={drivers} value={form.qualiFirst} onChange={setField("qualiFirst")} label="" />
                </PositionSlot>
                <PositionSlot pos="P2" label="SECOND ON GRID">
                  <DriverAutocomplete drivers={drivers} value={form.qualiSecond} onChange={setField("qualiSecond")} label="" />
                </PositionSlot>
                <PositionSlot pos="P3" label="THIRD ON GRID">
                  <DriverAutocomplete drivers={drivers} value={form.qualiThird} onChange={setField("qualiThird")} label="" />
                </PositionSlot>
              </div>
            </motion.div>

            {/* Race */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid-panel rounded-lg overflow-hidden mb-4"
            >
              <div className="panel-header px-5 py-3 flex items-center gap-3">
                <Flag className="w-4 h-4 text-theme-secondary" />
                <div>
                  <h2 className="text-base">Race</h2>
                  <p className="text-xs text-muted-foreground">Top 3 finishers</p>
                </div>
              </div>
              <div className="px-5">
                <PositionSlot pos="P1" label="RACE WINNER" accent="secondary">
                  <DriverAutocomplete drivers={drivers} value={form.raceFirst} onChange={setField("raceFirst")} label="" />
                </PositionSlot>
                <PositionSlot pos="P2" label="SECOND PLACE" accent="secondary">
                  <DriverAutocomplete drivers={drivers} value={form.raceSecond} onChange={setField("raceSecond")} label="" />
                </PositionSlot>
                <PositionSlot pos="P3" label="THIRD PLACE" accent="secondary">
                  <DriverAutocomplete drivers={drivers} value={form.raceThird} onChange={setField("raceThird")} label="" />
                </PositionSlot>
              </div>
            </motion.div>

            {/* Bonus */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid-panel rounded-lg overflow-hidden mb-6"
            >
              <div className="panel-header px-5 py-3 flex items-center gap-3">
                <Zap className="w-4 h-4 text-theme-primary" />
                <div>
                  <h2 className="text-base">Bonus</h2>
                  <p className="text-xs text-muted-foreground">Extra points up for grabs</p>
                </div>
              </div>
              <div className="px-5">
                <PositionSlot pos="FL" label="FASTEST LAP">
                  <DriverAutocomplete drivers={drivers} value={form.fastestLap} onChange={setField("fastestLap")} label="" />
                </PositionSlot>
                <PositionSlot pos="TT" label="TOP TEAM">
                  <TeamAutocomplete teams={teams} value={form.topTeam} onChange={setField("topTeam")} label="" />
                </PositionSlot>
              </div>
            </motion.div>

            {/* Apply to all grids toggle */}
            {allGrids.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="grid-panel rounded-lg overflow-hidden mb-6"
              >
                <div className="px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Copy className="w-4 h-4 text-theme-primary" />
                    <div>
                      <p className="text-sm">Apply to all grids</p>
                      <p className="text-xs text-muted-foreground">
                        Submit the same predictions to all {allGrids.length} of your grids
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setApplyToAll(!applyToAll)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      applyToAll ? "bg-theme-primary" : "bg-muted"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        applyToAll ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </motion.div>
            )}

            {error && (
              <p className="text-red-500 text-sm mb-4 telemetry-text">{error}</p>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={!allFilled || loading || showSuccess}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-theme-secondary hover:bg-theme-secondary/80 disabled:bg-muted disabled:text-muted-foreground text-theme-secondary-fg rounded-lg transition-all glow-secondary telemetry-text text-base sticky bottom-20 md:bottom-6 shadow-lg"
            >
              <CheckCircle2 className="w-5 h-5" />
              {loading
                ? "SUBMITTING…"
                : applyToAll
                ? "APPLY TO ALL GRIDS"
                : isUpdate
                ? "UPDATE PREDICTIONS"
                : "LOCK IN PREDICTIONS"
              }
            </motion.button>
          </form>
        )}
      </motion.div>

      {/* Success Banner */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 grid-panel px-6 py-4 rounded-lg flex items-center gap-3 shadow-xl"
          >
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="telemetry-text text-sm text-green-500">
              PREDICTIONS {isUpdate ? "UPDATED" : "LOCKED IN"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
