import { motion } from 'motion/react';
import { Trophy, TrendingUp } from 'lucide-react';
import { myGrids, leaderboardData } from '../data/mockData';
import { Link } from 'react-router';

export function Leaderboards() {
  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl mb-2">Leaderboards</h1>
          <p className="text-muted-foreground telemetry-text">YOUR RANKINGS ACROSS ALL GRIDS</p>
        </div>

        {/* Grid Selection */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {myGrids.map((grid, index) => (
            <motion.div
              key={grid.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={`/grids/${grid.id}`}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="grid-panel p-4 rounded-lg hover:border-theme-primary transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Trophy className="w-5 h-5 text-theme-primary" />
                    <h3>{grid.name}</h3>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">{grid.members} members</div>
                    <div className="flex items-center gap-1.5 text-sm text-theme-primary">
                      <TrendingUp className="w-4 h-4" />
                      <span>View Rankings</span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Example Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid-panel rounded-lg overflow-hidden"
        >
          <div className="p-4 border-b border-border bg-muted/30">
            <h2>Office Champions - Current Standings</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/20 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs telemetry-text text-muted-foreground">POS</th>
                  <th className="px-4 py-3 text-left text-xs telemetry-text text-muted-foreground">DRIVER</th>
                  <th className="px-4 py-3 text-right text-xs telemetry-text text-muted-foreground">POINTS</th>
                  <th className="px-4 py-3 text-right text-xs telemetry-text text-muted-foreground">RACES</th>
                  <th className="px-4 py-3 text-right text-xs telemetry-text text-muted-foreground">AVG</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardData.map((entry, index) => (
                  <motion.tr
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
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
                    <td className="px-4 py-4 text-right text-muted-foreground telemetry-text">
                      {(entry.points / entry.racesPlayed).toFixed(1)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
