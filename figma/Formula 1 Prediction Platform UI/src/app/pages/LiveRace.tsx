import { useParams, Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Circle } from 'lucide-react';
import { races, liveRaceData } from '../data/mockData';
import { LiveBadge } from '../components/LiveBadge';

export function LiveRace() {
  const { raceId } = useParams();
  const race = races.find(r => r.id === raceId);

  if (!race) {
    return <div>Race not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-theme-primary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm telemetry-text">BACK TO DASHBOARD</span>
        </Link>

        {/* Race Header */}
        <div className="grid-panel p-6 rounded-lg mb-6 glow-primary border-red-600">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <LiveBadge />
              <h1 className="text-3xl mt-3 mb-2">{race.name}</h1>
              <p className="text-muted-foreground">{race.location}, {race.country}</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground telemetry-text mb-1">LAP</div>
              <div className="text-3xl text-theme-primary telemetry-text">42 / 53</div>
            </div>
          </div>
        </div>

        {/* Live Timing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid-panel rounded-lg overflow-hidden"
        >
          <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <h2>Live Positions</h2>
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-xs text-red-600 telemetry-text"
            >
              UPDATING...
            </motion.div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/20 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs telemetry-text text-muted-foreground">POS</th>
                  <th className="px-4 py-3 text-left text-xs telemetry-text text-muted-foreground">DRIVER</th>
                  <th className="px-4 py-3 text-left text-xs telemetry-text text-muted-foreground">TEAM</th>
                  <th className="px-4 py-3 text-right text-xs telemetry-text text-muted-foreground">GAP</th>
                </tr>
              </thead>
              <tbody>
                {liveRaceData.map((entry, index) => (
                  <motion.tr
                    key={entry.position}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="telemetry-text w-6">{entry.position}</span>
                        <div
                          className="w-1 h-8 rounded-full"
                          style={{ backgroundColor: entry.teamColor }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="telemetry-text text-theme-primary">{entry.driver}</span>
                          {entry.position === 1 && (
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              <Circle className="w-3 h-3 fill-theme-primary text-theme-primary" />
                            </motion.div>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">{entry.name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {entry.team}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={`telemetry-text ${entry.position === 1 ? 'text-theme-primary' : 'text-muted-foreground'}`}>
                        {entry.gap}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Race Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6"
        >
          <div className="grid-panel p-4 rounded-lg">
            <div className="text-xs text-muted-foreground telemetry-text mb-2">FASTEST LAP</div>
            <div className="text-lg text-theme-primary telemetry-text">VER</div>
            <div className="text-xs text-muted-foreground">1:18.234</div>
          </div>

          <div className="grid-panel p-4 rounded-lg">
            <div className="text-xs text-muted-foreground telemetry-text mb-2">DRS ENABLED</div>
            <div className="text-lg text-green-500 telemetry-text">YES</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>

          <div className="grid-panel p-4 rounded-lg">
            <div className="text-xs text-muted-foreground telemetry-text mb-2">SAFETY CAR</div>
            <div className="text-lg text-muted-foreground telemetry-text">NO</div>
            <div className="text-xs text-muted-foreground">Clear track</div>
          </div>

          <div className="grid-panel p-4 rounded-lg">
            <div className="text-xs text-muted-foreground telemetry-text mb-2">WEATHER</div>
            <div className="text-lg text-theme-primary telemetry-text">DRY</div>
            <div className="text-xs text-muted-foreground">24°C</div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
