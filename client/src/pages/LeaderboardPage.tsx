import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Trophy, Crown, Users as UsersIcon } from "lucide-react";
import { api } from "../api/client";
import { LeaderboardEntry, RaceWeekend, Prediction, Grid } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { GridAdminMenu } from "../components/grid/GridAdminMenu";

export function LeaderboardPage() {
  const { gridId } = useParams<{ gridId: string }>();
  const { user } = useAuth();
  const [grid, setGrid] = useState<Grid | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [races, setRaces] = useState<RaceWeekend[]>([]);
  const [myPredictions, setMyPredictions] = useState<Prediction[]>([]);

  const loadData = () => {
    if (!gridId) return;
    api.getGrid(gridId).then(setGrid).catch(console.error);
    api.getLeaderboard(gridId).then(setEntries).catch(console.error);
    api.getRaceWeekends().then(setRaces).catch(console.error);
    api.getMyPredictions(gridId).then(setMyPredictions).catch(console.error);
  };

  useEffect(() => {
    setGrid(null);
    setEntries([]);
    setMyPredictions([]);
    loadData();
  }, [gridId]);

  const liveRaces = races.filter((r) => r.status === "IN_PROGRESS");
  const upcomingRaces = races.filter((r) => r.status === "UPCOMING");
  const completedRaces = races.filter((r) => r.status === "COMPLETED");
  const isOwner = user && grid && user.id === grid.ownerId;

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-theme-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm telemetry-text">BACK TO DASHBOARD</span>
        </Link>

        {/* Grid Header */}
        <div className="grid-panel p-6 rounded-lg mb-6 glow-primary">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl">{grid?.name || "Grid Leaderboard"}</h1>
                {isOwner && <Crown className="w-6 h-6 text-theme-primary" />}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <UsersIcon className="w-4 h-4" />
                  <span>{grid?.memberships?.length ?? "—"} members</span>
                </div>
                {grid?.code && (
                  <div className="telemetry-text">
                    CODE: <span className="text-theme-primary">{grid.code}</span>
                  </div>
                )}
              </div>
            </div>
            {isOwner && grid && (
              <GridAdminMenu gridId={grid.id} gridName={grid.name} onUpdate={loadData} />
            )}
          </div>
        </div>

        {/* Leaderboard Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid-panel rounded-lg overflow-hidden mb-6"
        >
          <div className="p-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-theme-primary" />
              <h2>Leaderboard</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/20 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs telemetry-text text-muted-foreground">POS</th>
                  <th className="px-4 py-3 text-left text-xs telemetry-text text-muted-foreground">PLAYER</th>
                  <th className="px-4 py-3 text-right text-xs telemetry-text text-muted-foreground">POINTS</th>
                  <th className="px-4 py-3 text-right text-xs telemetry-text text-muted-foreground">RACES</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <motion.tr
                    key={entry.userId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    className={`border-b border-border hover:bg-muted/30 transition-colors ${
                      entry.userId === user?.id
                        ? "bg-theme-primary/10 border-l-2 border-l-theme-primary"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {index === 0 && <Trophy className="w-4 h-4 text-yellow-500" />}
                        {index === 1 && <Trophy className="w-4 h-4 text-gray-400" />}
                        {index === 2 && <Trophy className="w-4 h-4 text-orange-600" />}
                        <span className="telemetry-text">{index + 1}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-theme-primary to-theme-secondary rounded-full flex items-center justify-center text-xs telemetry-text text-black">
                          {entry.username.substring(0, 2).toUpperCase()}
                        </div>
                        <span className={entry.userId === user?.id ? "text-theme-primary" : ""}>
                          {entry.username}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-theme-primary telemetry-text">{entry.totalPoints}</span>
                    </td>
                    <td className="px-4 py-4 text-right text-muted-foreground">{entry.racesPlayed}</td>
                  </motion.tr>
                ))}
                {entries.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      No predictions submitted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Race List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid-panel rounded-lg overflow-hidden"
        >
          <div className="p-4 border-b border-border bg-muted/30">
            <h2>Races</h2>
          </div>
          <div className="divide-y divide-border">
            {/* Live */}
            {liveRaces.map((r) => (
              <div key={r.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground telemetry-text">ROUND {r.round}</span>
                      <span className="px-2 py-0.5 bg-red-600/20 border border-red-600 rounded text-xs text-red-500 telemetry-text animate-pulse">
                        LIVE
                      </span>
                    </div>
                    <h4 className="mb-1">{r.raceName}</h4>
                    <p className="text-sm text-muted-foreground">{r.circuitName}, {r.country}</p>
                  </div>
                  <Link to={`/grids/${gridId}/live/${r.id}`}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded telemetry-text text-sm"
                    >
                      WATCH LIVE
                    </motion.button>
                  </Link>
                </div>
              </div>
            ))}

            {/* Upcoming */}
            {upcomingRaces.map((r) => {
              const hasPrediction = myPredictions.some(
                (p) => p.raceWeekendId === r.id && p.gridId === gridId
              );
              return (
                <div key={r.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground telemetry-text">ROUND {r.round}</span>
                        <span className="px-2 py-0.5 bg-blue-600/20 border border-blue-600 rounded text-xs text-blue-500 telemetry-text">
                          UPCOMING
                        </span>
                        {hasPrediction && (
                          <span className="px-2 py-0.5 bg-green-600/20 border border-green-600 rounded text-xs text-green-500 telemetry-text">
                            PREDICTED
                          </span>
                        )}
                      </div>
                      <h4 className="mb-1">{r.raceName}</h4>
                      <p className="text-sm text-muted-foreground">{r.circuitName}, {r.country}</p>
                    </div>
                    <Link to={`/grids/${gridId}/race/${r.id}/predict`}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        className={`px-4 py-2 rounded telemetry-text text-sm ${
                          hasPrediction
                            ? "bg-green-600/20 border border-green-600 text-green-500 hover:bg-green-600/30"
                            : "bg-theme-primary hover:bg-theme-primary/90 text-black"
                        }`}
                      >
                        {hasPrediction ? "EDIT" : "PREDICT"}
                      </motion.button>
                    </Link>
                  </div>
                </div>
              );
            })}

            {/* Completed */}
            {completedRaces.map((r) => (
              <div key={r.id} className="p-4 hover:bg-muted/30 transition-colors opacity-70">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground telemetry-text">ROUND {r.round}</span>
                      <span className="px-2 py-0.5 bg-muted border border-border rounded text-xs text-muted-foreground telemetry-text">
                        COMPLETED
                      </span>
                    </div>
                    <h4 className="mb-1">{r.raceName}</h4>
                    <p className="text-sm text-muted-foreground">{r.circuitName}, {r.country}</p>
                  </div>
                  <Link to={`/grids/${gridId}/race/${r.id}/results`}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      className="px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded telemetry-text text-sm"
                    >
                      RESULTS
                    </motion.button>
                  </Link>
                </div>
              </div>
            ))}

            {liveRaces.length === 0 && upcomingRaces.length === 0 && completedRaces.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">No races scheduled yet.</div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
