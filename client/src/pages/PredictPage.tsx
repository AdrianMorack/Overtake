import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, CheckCircle2, Lock, Flag, Zap, Timer } from "lucide-react";
import { api } from "../api/client";
import { Driver, Team, RaceWeekend } from "../types";
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

export function PredictPage() {
  const { gridId, raceId } = useParams<{ gridId: string; raceId: string }>();
  const navigate = useNavigate();

  const [race, setRace] = useState<RaceWeekend | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);

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
    ]).then(([weekends, d, t, predictions]) => {
      setRace(weekends.find((w) => w.id === raceId) || null);
      setDrivers(d);
      setTeams(t);
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
      await api.submitPrediction({ raceWeekendId: raceId, gridId, ...form });
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
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-theme-secondary" />
                <span className="text-muted-foreground telemetry-text">LOCKS</span>
                <span className={`telemetry-text ${locked ? "text-destructive" : "text-theme-secondary"}` }>
                  {lockDate.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {locked ? (
          <div className="grid-panel p-8 rounded-lg flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Lock className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <div className="telemetry-text text-sm mb-1">PREDICTIONS LOCKED</div>
              <p className="text-muted-foreground text-sm">The prediction window for this race has closed.</p>
            </div>
          </div>
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
              {loading ? "SUBMITTING…" : isUpdate ? "UPDATE PREDICTIONS" : "LOCK IN PREDICTIONS"}
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
