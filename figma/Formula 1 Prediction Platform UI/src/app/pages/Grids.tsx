import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { myGrids } from '../data/mockData';
import { GridCard } from '../components/GridCard';
import { Link } from 'react-router';

export function Grids() {
  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl mb-2">My Grids</h1>
            <p className="text-muted-foreground telemetry-text">YOUR COMPETITION GROUPS</p>
          </div>
          <Link to="/grids/join">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-theme-primary hover:bg-theme-primary/90 text-black rounded-lg telemetry-text transition-colors"
            >
              <Plus className="w-4 h-4" />
              JOIN GRID
            </motion.button>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {myGrids.map((grid, index) => (
            <motion.div
              key={grid.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GridCard grid={grid} />
            </motion.div>
          ))}
        </div>

        {/* Create Grid Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Link to="/grids/create">
            <div className="grid-panel p-8 rounded-lg hover:border-theme-primary transition-all cursor-pointer text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-theme-primary/20 rounded-full flex items-center justify-center">
                  <Plus className="w-8 h-8 text-theme-primary" />
                </div>
                <div>
                  <h3 className="mb-2">Create New Grid</h3>
                  <p className="text-sm text-muted-foreground">Start your own prediction competition</p>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
