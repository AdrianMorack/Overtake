import { motion } from 'motion/react';
import { Plus, Trophy, Users, Flag } from 'lucide-react';
import { races, myGrids } from '../data/mockData';
import { RaceCard } from '../components/RaceCard';
import { GridCard } from '../components/GridCard';
import { Link } from 'react-router';

export function Dashboard() {
  const upcomingRace = races.find(r => r.status === 'upcoming' || r.status === 'live');
  const liveRace = races.find(r => r.status === 'live');

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl mb-2">Dashboard</h1>
            <p className="text-muted-foreground telemetry-text">SEASON 2026 • YOUR COMMAND CENTER</p>
          </div>
        </div>
      </motion.div>

      {/* Live Race Alert */}
      {liveRace && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 p-6 bg-gradient-to-r from-red-600/20 to-red-600/5 border border-red-600 rounded-lg glow-primary"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center"
              >
                <Flag className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <div className="text-xs text-red-600 telemetry-text mb-1">LIVE NOW</div>
                <h3 className="mb-1">{liveRace.name}</h3>
                <p className="text-sm text-muted-foreground">{liveRace.location}, {liveRace.country}</p>
              </div>
            </div>
            <Link to={`/live/${liveRace.id}`}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg telemetry-text transition-colors"
              >
                WATCH LIVE
              </motion.button>
            </Link>
          </div>
        </motion.div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid-panel p-4 rounded-lg"
        >
          <div className="text-xs text-muted-foreground telemetry-text mb-2">TOTAL GRIDS</div>
          <div className="text-2xl text-theme-primary">{myGrids.length}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid-panel p-4 rounded-lg"
        >
          <div className="text-xs text-muted-foreground telemetry-text mb-2">PREDICTIONS</div>
          <div className="text-2xl text-theme-primary">12</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid-panel p-4 rounded-lg"
        >
          <div className="text-xs text-muted-foreground telemetry-text mb-2">TOTAL POINTS</div>
          <div className="text-2xl text-theme-primary">456</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid-panel p-4 rounded-lg"
        >
          <div className="text-xs text-muted-foreground telemetry-text mb-2">AVG POSITION</div>
          <div className="text-2xl text-theme-primary">#3</div>
        </motion.div>
      </div>

      {/* Next Race */}
      {upcomingRace && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2>Next Race</h2>
            <Link to={`/predict/${upcomingRace.id}`}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-theme-primary hover:bg-theme-primary/90 text-black rounded-lg telemetry-text text-sm transition-colors"
              >
                PREDICT NOW
              </motion.button>
            </Link>
          </div>
          <RaceCard race={upcomingRace} isUpcoming />
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
          <Link to="/grids/join">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 border border-theme-primary text-theme-primary hover:bg-theme-primary/10 rounded-lg telemetry-text text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              JOIN GRID
            </motion.button>
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myGrids.map((grid, index) => (
            <motion.div
              key={grid.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
            >
              <GridCard grid={grid} />
            </motion.div>
          ))}
        </div>
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
            <motion.button
              whileHover={{ scale: 1.02 }}
              className="w-full grid-panel p-6 rounded-lg hover:border-theme-primary transition-all text-left"
            >
              <Flag className="w-8 h-8 text-theme-primary mb-3" />
              <h3 className="mb-2">View All Races</h3>
              <p className="text-sm text-muted-foreground">Browse the season calendar</p>
            </motion.button>
          </Link>

          <Link to="/leaderboards">
            <motion.button
              whileHover={{ scale: 1.02 }}
              className="w-full grid-panel p-6 rounded-lg hover:border-theme-primary transition-all text-left"
            >
              <Trophy className="w-8 h-8 text-theme-primary mb-3" />
              <h3 className="mb-2">Leaderboards</h3>
              <p className="text-sm text-muted-foreground">Check your rankings</p>
            </motion.button>
          </Link>

          <Link to="/grids/create">
            <motion.button
              whileHover={{ scale: 1.02 }}
              className="w-full grid-panel p-6 rounded-lg hover:border-theme-primary transition-all text-left"
            >
              <Users className="w-8 h-8 text-theme-primary mb-3" />
              <h3 className="mb-2">Create Grid</h3>
              <p className="text-sm text-muted-foreground">Start your own competition</p>
            </motion.button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
