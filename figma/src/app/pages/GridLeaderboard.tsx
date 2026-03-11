import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Trophy, MoreVertical, Edit2, Users as UsersIcon, Trash2, Crown } from 'lucide-react';
import { myGrids, leaderboardData, races } from '../data/mockData';

export function GridLeaderboard() {
  const { gridId } = useParams();
  const grid = myGrids.find(g => g.id === gridId);
  const [showAdminMenu, setShowAdminMenu] = useState(false);

  if (!grid) {
    return <div>Grid not found</div>;
  }

  const completedRaces = races.filter(r => r.status === 'completed');
  const upcomingRaces = races.filter(r => r.status === 'upcoming' || r.status === 'live');

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link to="/grids" className="inline-flex items-center gap-2 text-muted-foreground hover:text-theme-primary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm telemetry-text">BACK TO GRIDS</span>
        </Link>

        {/* Grid Header */}
        <div className="grid-panel p-6 rounded-lg mb-6 glow-primary">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl">{grid.name}</h1>
                {grid.isAdmin && (
                  <Crown className="w-6 h-6 text-theme-primary" />
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <UsersIcon className="w-4 h-4" />
                  <span>{grid.members} members</span>
                </div>
                <div className="telemetry-text">
                  CODE: <span className="text-theme-primary">{grid.code}</span>
                </div>
              </div>
            </div>

            {grid.isAdmin && (
              <div className="relative">
                <button
                  onClick={() => setShowAdminMenu(!showAdminMenu)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {showAdminMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-10"
                  >
                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left">
                      <Edit2 className="w-4 h-4" />
                      <span className="text-sm">Rename Grid</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left">
                      <UsersIcon className="w-4 h-4" />
                      <span className="text-sm">Manage Members</span>
                    </button>
                    <div className="border-t border-border" />
                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-destructive/20 text-destructive transition-colors text-left">
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm">Delete Grid</span>
                    </button>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard */}
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
                  <th className="px-4 py-3 text-left text-xs telemetry-text text-muted-foreground">DRIVER</th>
                  <th className="px-4 py-3 text-right text-xs telemetry-text text-muted-foreground">POINTS</th>
                  <th className="px-4 py-3 text-right text-xs telemetry-text text-muted-foreground">RACES</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardData.map((entry, index) => (
                  <motion.tr
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    className={`border-b border-border hover:bg-muted/30 transition-colors ${
                      entry.name === 'You' ? 'bg-theme-primary/10 border-theme-primary' : ''
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
                        <div className="w-8 h-8 bg-gradient-to-br from-theme-primary to-theme-secondary rounded-full flex items-center justify-center text-xs telemetry-text">
                          {entry.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className={entry.name === 'You' ? 'text-theme-primary' : ''}>{entry.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-theme-primary telemetry-text">{entry.points}</span>
                    </td>
                    <td className="px-4 py-4 text-right text-muted-foreground">
                      {entry.racesPlayed}
                    </td>
                  </motion.tr>
                ))}
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
            {/* Upcoming Races */}
            {upcomingRaces.map((race, index) => (
              <div key={race.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground telemetry-text">ROUND {race.round}</span>
                      {race.status === 'live' && (
                        <span className="px-2 py-0.5 bg-red-600/20 border border-red-600 rounded text-xs text-red-600 telemetry-text">
                          LIVE
                        </span>
                      )}
                      {race.status === 'upcoming' && (
                        <span className="px-2 py-0.5 bg-blue-600/20 border border-blue-600 rounded text-xs text-blue-600 telemetry-text">
                          UPCOMING
                        </span>
                      )}
                    </div>
                    <h4 className="mb-1">{race.name}</h4>
                    <p className="text-sm text-muted-foreground">{race.location}, {race.country}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/predict/${race.id}`}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        className="px-4 py-2 bg-theme-primary hover:bg-theme-primary/90 text-black rounded telemetry-text text-sm"
                      >
                        PREDICT
                      </motion.button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {/* Completed Races */}
            {completedRaces.map((race) => (
              <div key={race.id} className="p-4 hover:bg-muted/30 transition-colors opacity-60">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground telemetry-text">ROUND {race.round}</span>
                      <span className="px-2 py-0.5 bg-green-600/20 border border-green-600 rounded text-xs text-green-600 telemetry-text">
                        COMPLETED
                      </span>
                      <span className="px-2 py-0.5 bg-theme-primary/20 border border-theme-primary rounded text-xs text-theme-primary telemetry-text">
                        PREDICTED
                      </span>
                    </div>
                    <h4 className="mb-1">{race.name}</h4>
                    <p className="text-sm text-muted-foreground">{race.location}, {race.country}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/results/${race.id}`}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        className="px-4 py-2 border border-theme-primary text-theme-primary hover:bg-theme-primary/10 rounded telemetry-text text-sm"
                      >
                        VIEW RESULTS
                      </motion.button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
