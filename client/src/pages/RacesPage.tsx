import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Flag, MapPin, Clock, CheckCircle } from "lucide-react";
import { api } from "../api/client";
import { RaceWeekend } from "../types";

function RaceCard({ race }: { race: RaceWeekend }) {
  const isLive = race.status === "IN_PROGRESS";
  const isCompleted = race.status === "COMPLETED";

  return (
    <div
      className={`grid-panel p-6 rounded-xl transition-all ${
        isLive ? "border-theme-primary glow-primary" : isCompleted ? "border-green-800/50" : "hover:border-theme-primary"
      }`}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-muted-foreground telemetry-text">ROUND {race.round}</span>
            {isLive && (
              <span className="text-xs text-red-500 telemetry-text border border-red-500 px-2 py-0.5 rounded">
                ● LIVE
              </span>
            )}
            {isCompleted && (
              <span className="text-xs text-green-500 telemetry-text flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> COMPLETED
              </span>
            )}
          </div>
          <h3 className="text-lg mb-1">{race.raceName}</h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
            <MapPin className="w-4 h-4 shrink-0" />
            {race.circuitName}, {race.country}
          </div>

          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <div className="text-xs text-muted-foreground telemetry-text mb-0.5">RACE DATE</div>
              <div className={isLive ? "text-theme-primary" : ""}>
                {new Date(race.raceDate).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
              </div>
            </div>
            {!isCompleted && (
              <div>
                <div className="text-xs text-muted-foreground telemetry-text mb-0.5">LOCK TIME</div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  {new Date(race.predictionsLock).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            )}
            {race.qualifyingDate && (
              <div>
                <div className="text-xs text-muted-foreground telemetry-text mb-0.5">QUALIFYING</div>
                <div>{new Date(race.qualifyingDate).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</div>
              </div>
            )}
          </div>

          {isCompleted && race.results && (
            <div className="mt-4 p-3 bg-green-950/30 border border-green-800/30 rounded-lg text-sm">
              <div className="text-xs text-green-500 telemetry-text mb-2">RACE RESULTS</div>
              <div className="flex flex-wrap gap-4 text-muted-foreground">
                <span>🥇 {race.results.raceFirst}</span>
                <span>🥈 {race.results.raceSecond}</span>
                <span>🥉 {race.results.raceThird}</span>
                <span>⚡ FL: {race.results.fastestLap}</span>
                <span>🏆 {race.results.topTeam}</span>
              </div>
            </div>
          )}
        </div>

        <Flag
          className={`w-10 h-10 shrink-0 opacity-20 ${
            isLive ? "text-theme-primary opacity-60" : isCompleted ? "text-green-500" : "text-muted-foreground"
          }`}
        />
      </div>
    </div>
  );
}

export function RacesPage() {
  const [races, setRaces] = useState<RaceWeekend[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getRaceWeekends()
      .then(setRaces)
      .catch((e) => setError(e.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const upcoming = races.filter((r) => r.status === "UPCOMING" || r.status === "IN_PROGRESS");
  const completed = races.filter((r) => r.status === "COMPLETED");

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl mb-2">2026 Season</h1>
          <p className="text-muted-foreground telemetry-text">FORMULA 1 RACE CALENDAR</p>
        </div>

        {loading && (
          <div className="text-center py-16 text-muted-foreground telemetry-text">LOADING…</div>
        )}
        {error && (
          <div className="p-4 border border-destructive rounded-lg text-destructive text-sm mb-6">{error}</div>
        )}

        {!loading && !error && (
          <>
            {upcoming.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-4 flex items-center gap-3">
                  <div className="w-1 h-6 bg-theme-primary rounded-full" />
                  Upcoming Races
                </h2>
                <div className="space-y-4">
                  {upcoming.map((race, i) => (
                    <motion.div
                      key={race.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                    >
                      <RaceCard race={race} />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {completed.length > 0 && (
              <div>
                <h2 className="mb-4 flex items-center gap-3">
                  <div className="w-1 h-6 bg-green-600 rounded-full" />
                  Completed Races
                </h2>
                <div className="space-y-4">
                  {completed.map((race, i) => (
                    <motion.div
                      key={race.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                    >
                      <RaceCard race={race} />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {races.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <Flag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No races found.</p>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
