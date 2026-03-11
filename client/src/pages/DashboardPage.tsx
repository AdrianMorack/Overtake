import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Plus, Trophy, Users, Flag, LogOut } from "lucide-react";
import { api } from "../api/client";
import { Grid, RaceWeekend } from "../types";
import { useAuth } from "../contexts/AuthContext";

export function DashboardPage() {
  const { user, logout } = useAuth();
  const [grids, setGrids] = useState<Grid[]>([]);
  const [nextRace, setNextRace] = useState<RaceWeekend | null>(null);
  const [liveRace, setLiveRace] = useState<RaceWeekend | null>(null);

  useEffect(() => {
    api.getGrids().then(setGrids).catch(console.error);
    api.getRaceWeekends().then((weekends) => {
      setLiveRace(weekends.find((w) => w.status === "IN_PROGRESS") ?? null);
      setNextRace(weekends.find((w) => w.status === "UPCOMING") ?? null);
    }).catch(console.error);
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl mb-2">Dashboard</h1>
            <p className="text-muted-foreground telemetry-text">{new Date().getFullYear()} SEASON</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground telemetry-text">{user?.username?.toUpperCase()}</span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-theme-primary transition-colors telemetry-text"
            >
              <LogOut className="w-4 h-4" />
              LOGOUT
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Live Race Alert */}
      {liveRace && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 p-6 theme-gradient-bg border border-theme-primary rounded-lg glow-primary"
        >
          <div className="h-[3px] theme-top-bar rounded-full mb-4" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-12 h-12 bg-theme-primary rounded-full flex items-center justify-center shrink-0"
              >
                <Flag className="w-6 h-6 text-black" />
              </motion.div>
              <div>
                <div className="text-xs text-theme-secondary telemetry-text mb-1">LIVE NOW</div>
                <h3 className="mb-1">{liveRace.raceName}</h3>
                <p className="text-sm text-muted-foreground">{liveRace.circuitName}, {liveRace.country}</p>
              </div>
            </div>
            {grids[0] && (
              <Link to={`/grids/${grids[0].id}/live/${liveRace.id}`}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-theme-secondary hover:bg-theme-secondary/80 text-theme-secondary-fg rounded-lg telemetry-text transition-colors"
                >
                  WATCH LIVE
                </motion.button>
              </Link>
            )}
          </div>
        </motion.div>
      )}



      {/* Next Race */}
      {nextRace && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2>Next Race</h2>
            <Link to="/races">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-theme-secondary hover:bg-theme-secondary/80 text-theme-secondary-fg rounded-lg telemetry-text text-sm transition-colors"
              >
                FULL CALENDAR
              </motion.button>
            </Link>
          </div>
          <div className="grid-panel p-6 rounded-xl">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="text-s text-muted-foreground telemetry-text mb-2">
                  ROUND {nextRace.round} • {nextRace.country.toUpperCase()}
                </div>
                <h3 className="text-xl mb-1">{nextRace.raceName}</h3>
                <p className="text-sm text-muted-foreground mb-3">{nextRace.circuitName}</p>
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground telemetry-text text-xs">RACE DATE</span>
                    <p className="text-theme-primary">{new Date(nextRace.raceDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground telemetry-text text-xs">LOCK TIME</span>
                    <p className="text-theme-primary">{new Date(nextRace.predictionsLock).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
              </div>
              <Flag className="w-12 h-12 text-theme-primary opacity-30 shrink-0" />
            </div>
          </div>
        </motion.div>
      )}

      {/* My Grids */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h2>My Grids</h2>
          <div className="flex gap-2">
            <Link to="/grids/join">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 border border-theme-primary text-theme-primary hover:bg-theme-primary/10 rounded-lg telemetry-text text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                JOIN
              </motion.button>
            </Link>
            <Link to="/grids/create">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 bg-theme-secondary hover:bg-theme-secondary/80 text-theme-secondary-fg rounded-lg telemetry-text text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                CREATE
              </motion.button>
            </Link>
          </div>
        </div>

        {grids.length === 0 ? (
          <div className="grid-panel p-8 rounded-xl text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground">You haven't joined any grids yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {grids.map((grid, index) => (
              <motion.div
                key={grid.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
              >
                <Link to={`/grids/${grid.id}`} className="block">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="grid-panel p-5 rounded-xl hover:border-theme-primary transition-all cursor-pointer h-full"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-base">{grid.name}</h3>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{grid.memberships?.length ?? 0} members</span>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <h2 className="mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Link to="/races">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="grid-panel p-6 rounded-lg hover:border-theme-primary transition-all cursor-pointer"
            >
              <Flag className="w-8 h-8 text-theme-primary mb-3" />
              <h3 className="mb-2">View All Races</h3>
              <p className="text-sm text-muted-foreground">Browse the season calendar</p>
            </motion.div>
          </Link>
          {grids[0] && (
            <Link to={"/profile"}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="grid-panel p-6 rounded-lg hover:border-theme-primary transition-all cursor-pointer"
              >
                <Trophy className="w-8 h-8 text-theme-primary mb-3" />
                <h3 className="mb-2">Profile Settings</h3>
                <p className="text-sm text-muted-foreground">Check your rankings</p>
              </motion.div>
            </Link>
          )}
          <Link to="/grids/create">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="grid-panel p-6 rounded-lg hover:border-theme-primary transition-all cursor-pointer"
            >
              <Users className="w-8 h-8 text-theme-primary mb-3" />
              <h3 className="mb-2">Create Grid</h3>
              <p className="text-sm text-muted-foreground">Start your own competition</p>
            </motion.div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
