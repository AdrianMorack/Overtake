import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Save, CheckCircle2, Lock } from "lucide-react";
import { api } from "../api/client";
import { Driver, Team, RaceWeekend } from "../types";
import { DriverAutocomplete } from "../components/common/DriverAutocomplete";
import { TeamAutocomplete } from "../components/common/TeamAutocomplete";

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

  const allFilled = Object.values(form).every((v) => v.length > 0);

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

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6 max-w-3xl relative overflow-hidden">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          to={`/grids/${gridId}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-theme-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm telemetry-text">BACK TO GRID</span>
        </Link>

        {/* Race Header */}
        <div className="grid-panel p-6 rounded-lg mb-6">
          <div className="text-xs text-muted-foreground telemetry-text mb-2">ROUND {race.round}</div>
          <h1 className="text-3xl mb-2">{race.raceName}</h1>
          <p className="text-muted-foreground">{race.circuitName}, {race.country}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(race.raceDate).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        {locked ? (
          <div className="grid-panel p-6 rounded-lg flex items-center gap-4">
            <Lock className="w-8 h-8 text-muted-foreground flex-shrink-0" />
            <div>
              <div className="telemetry-text text-sm mb-1">PREDICTIONS LOCKED</div>
              <p className="text-muted-foreground text-sm">
                The prediction window for this race has closed.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Qualifying */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid-panel p-6 rounded-lg mb-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-theme-primary rounded-full" />
                <div>
                  <h2 className="mb-1">Qualifying Predictions</h2>
                  <p className="text-sm text-muted-foreground">Predict the top 3 qualifiers</p>
                </div>
              </div>
              <div className="space-y-4">
                <DriverAutocomplete
                  drivers={drivers}
                  value={form.qualiFirst}
                  onChange={setField("qualiFirst")}
                  label="P1 — POLE POSITION"
                />
                <DriverAutocomplete
                  drivers={drivers}
                  value={form.qualiSecond}
                  onChange={setField("qualiSecond")}
                  label="P2"
                />
                <DriverAutocomplete
                  drivers={drivers}
                  value={form.qualiThird}
                  onChange={setField("qualiThird")}
                  label="P3"
                />
              </div>
            </motion.div>

            {/* Race */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid-panel p-6 rounded-lg mb-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-theme-secondary rounded-full" />
                <div>
                  <h2 className="mb-1">Race Predictions</h2>
                  <p className="text-sm text-muted-foreground">Predict the top 3 finishers</p>
                </div>
              </div>
              <div className="space-y-4">
                <DriverAutocomplete
                  drivers={drivers}
                  value={form.raceFirst}
                  onChange={setField("raceFirst")}
                  label="P1 — RACE WINNER"
                />
                <DriverAutocomplete
                  drivers={drivers}
                  value={form.raceSecond}
                  onChange={setField("raceSecond")}
                  label="P2"
                />
                <DriverAutocomplete
                  drivers={drivers}
                  value={form.raceThird}
                  onChange={setField("raceThird")}
                  label="P3"
                />
              </div>
            </motion.div>

            {/* Bonus */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid-panel p-6 rounded-lg mb-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-theme-primary rounded-full" />
                <div>
                  <h2 className="mb-1">Bonus Predictions</h2>
                  <p className="text-sm text-muted-foreground">Extra points available</p>
                </div>
              </div>
              <div className="space-y-4">
                <DriverAutocomplete
                  drivers={drivers}
                  value={form.fastestLap}
                  onChange={setField("fastestLap")}
                  label="FASTEST LAP"
                />
                <TeamAutocomplete
                  teams={teams}
                  value={form.topTeam}
                  onChange={setField("topTeam")}
                  label="TOP TEAM"
                />
              </div>
            </motion.div>

            {error && (
              <p className="text-red-500 text-sm mb-4 telemetry-text">{error}</p>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={!allFilled || loading || showSuccess}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-theme-primary hover:bg-theme-primary/90 disabled:bg-muted disabled:text-muted-foreground text-black rounded-lg transition-all glow-primary telemetry-text sticky bottom-20 md:bottom-6"
            >
              <Save className="w-5 h-5" />
              {loading ? "SUBMITTING…" : isUpdate ? "UPDATE PREDICTIONS" : "SUBMIT PREDICTIONS"}
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
            className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 grid-panel px-6 py-4 rounded-lg flex items-center gap-3 border-green-600 shadow-xl"
          >
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="telemetry-text text-sm text-green-500">
              PREDICTIONS {isUpdate ? "UPDATED" : "SUBMITTED"} SUCCESSFULLY
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
