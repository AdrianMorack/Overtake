import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { LayoutGrid, Plus, Users, Trophy } from "lucide-react";
import { api } from "../api/client";
import { Grid } from "../types";
import { useAuth } from "../contexts/AuthContext";

export function MyGridsPage() {
  const { user } = useAuth();
  const [grids, setGrids] = useState<Grid[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getGrids()
      .then(setGrids)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl mb-1">My Grids</h1>
            <p className="text-muted-foreground text-sm">Your prediction leagues</p>
          </div>
          <div className="flex gap-2">
            <Link to="/grids/join">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 border border-theme-primary text-theme-primary hover:bg-theme-primary/10 rounded-lg transition-colors text-sm telemetry-text"
              >
                <Users className="w-4 h-4" />
                JOIN
              </motion.button>
            </Link>
            <Link to="/grids/create">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 bg-theme-secondary hover:bg-theme-secondary/80 text-theme-secondary-fg rounded-lg transition-colors text-sm telemetry-text glow-secondary"
              >
                <Plus className="w-4 h-4" />
                CREATE
              </motion.button>
            </Link>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid-panel p-8 rounded-lg text-center text-muted-foreground telemetry-text text-sm animate-pulse">
            LOADING…
          </div>
        ) : grids.length === 0 ? (
          <div className="grid-panel p-12 rounded-lg text-center">
            <LayoutGrid className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="mb-2">No grids yet</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Create a grid or join one with a code
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/grids/join">
                <button className="px-4 py-2 border border-theme-primary text-theme-primary hover:bg-theme-primary/10 rounded-lg text-sm telemetry-text transition-colors">
                  JOIN GRID
                </button>
              </Link>
              <Link to="/grids/create">
                <button className="px-4 py-2 bg-theme-secondary text-theme-secondary-fg hover:bg-theme-secondary/80 rounded-lg text-sm telemetry-text glow-secondary transition-colors">
                  CREATE GRID
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {grids.map((grid, index) => (
              <motion.div
                key={grid.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={`/grids/${grid.id}`}>
                  <div className="grid-panel p-5 rounded-lg hover:border-theme-primary/50 transition-all cursor-pointer group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-theme-primary/20 rounded-lg flex items-center justify-center group-hover:bg-theme-primary/30 transition-colors flex-shrink-0">
                          <Trophy className="w-6 h-6 text-theme-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg mb-0.5">{grid.name}</h3>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="telemetry-text">
                              CODE: <span className="text-theme-primary">{grid.code}</span>
                            </span>
                            {user?.id === grid.ownerId && (
                              <span className="px-1.5 py-0.5 bg-theme-primary/20 border border-theme-primary/30 rounded text-theme-primary telemetry-text">
                                ADMIN
                              </span>
                            )}
                            {grid.memberships && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {grid.memberships.length}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-xl text-muted-foreground group-hover:text-theme-primary transition-colors">
                        ›
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
