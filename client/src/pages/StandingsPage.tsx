import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Trophy, Users, Flag } from "lucide-react";
import { api } from "../api/client";
import { StandingsData } from "../types";

export function StandingsPage() {
  const [standings, setStandings] = useState<StandingsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStandings()
      .then(setStandings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 flex items-center justify-center min-h-64">
        <div className="text-muted-foreground telemetry-text text-sm animate-pulse">LOADING…</div>
      </div>
    );
  }

  const { driverStandings = [], teamStandings = [], racesCompleted = 0 } = standings ?? {};

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="text-3xl mb-2">F1 Standings</h1>
          <p className="text-muted-foreground telemetry-text">
            {new Date().getFullYear()} SEASON • {racesCompleted} RACE{racesCompleted !== 1 ? "S" : ""} COMPLETED
          </p>
        </div>

        {/* Driver Championship */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid-panel rounded-lg overflow-hidden mb-8"
        >
          <div className="p-4 panel-header">
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-theme-primary" />
              <h2>Driver Championship</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/20 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs telemetry-text text-muted-foreground w-12">POS</th>
                  <th className="px-4 py-3 text-left text-xs telemetry-text text-muted-foreground">DRIVER</th>
                  <th className="px-4 py-3 text-left text-xs telemetry-text text-muted-foreground hidden sm:table-cell">TEAM</th>
                  <th className="px-4 py-3 text-center text-xs telemetry-text text-muted-foreground">WINS</th>
                  <th className="px-4 py-3 text-right text-xs telemetry-text text-muted-foreground">PTS</th>
                </tr>
              </thead>
              <tbody>
                {driverStandings.map((d, i) => (
                  <motion.tr
                    key={d.code}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.03 }}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {i === 0 && <Trophy className="w-4 h-4 text-yellow-500" />}
                        {i === 1 && <Trophy className="w-4 h-4 text-gray-400" />}
                        {i === 2 && <Trophy className="w-4 h-4 text-orange-600" />}
                        <span className="telemetry-text">{i + 1}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-1 h-8 rounded-full"
                          style={{ background: d.teamColor ?? "var(--muted)" }}
                        />
                        <div>
                          <div className="font-medium">{d.name}</div>
                          <div className="text-xs text-muted-foreground telemetry-text sm:hidden">{d.teamName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">{d.teamName}</td>
                    <td className="px-4 py-3 text-center telemetry-text">{d.wins}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-theme-primary telemetry-text font-bold text-lg">{d.points}</span>
                    </td>
                  </motion.tr>
                ))}
                {driverStandings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      No standings data yet. Check back after the first race.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Constructor Championship */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid-panel rounded-lg overflow-hidden"
        >
          <div className="p-4 panel-header">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-theme-secondary" />
              <h2>Constructor Championship</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/20 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs telemetry-text text-muted-foreground w-12">POS</th>
                  <th className="px-4 py-3 text-left text-xs telemetry-text text-muted-foreground">TEAM</th>
                  <th className="px-4 py-3 text-center text-xs telemetry-text text-muted-foreground">WINS</th>
                  <th className="px-4 py-3 text-right text-xs telemetry-text text-muted-foreground">PTS</th>
                </tr>
              </thead>
              <tbody>
                {teamStandings.map((t, i) => (
                  <motion.tr
                    key={t.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.04 }}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {i === 0 && <Trophy className="w-4 h-4 text-yellow-500" />}
                        {i === 1 && <Trophy className="w-4 h-4 text-gray-400" />}
                        {i === 2 && <Trophy className="w-4 h-4 text-orange-600" />}
                        <span className="telemetry-text">{i + 1}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: t.color ? `${t.color}30` : "var(--muted)" }}
                        >
                          <Flag className="w-4 h-4" style={{ color: t.color ?? "var(--muted-foreground)" }} />
                        </div>
                        <span className="font-medium">{t.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center telemetry-text">{t.wins}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-theme-secondary telemetry-text font-bold text-lg">{t.points}</span>
                    </td>
                  </motion.tr>
                ))}
                {teamStandings.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      No standings data yet. Check back after the first race.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
