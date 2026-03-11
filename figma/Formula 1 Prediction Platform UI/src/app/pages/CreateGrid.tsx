import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Users, Type } from 'lucide-react';

export function CreateGrid() {
  const navigate = useNavigate();
  const [gridName, setGridName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock create grid
    navigate('/grids');
  };

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link to="/grids" className="inline-flex items-center gap-2 text-muted-foreground hover:text-theme-primary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm telemetry-text">BACK TO GRIDS</span>
        </Link>

        <div className="grid-panel p-8 rounded-lg">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-theme-primary/20 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-theme-primary" />
            </div>
            <div>
              <h1 className="text-3xl mb-2">Create Grid</h1>
              <p className="text-muted-foreground">Start your own prediction competition</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm mb-2 text-muted-foreground telemetry-text">GRID NAME</label>
              <div className="relative">
                <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={gridName}
                  onChange={(e) => setGridName(e.target.value)}
                  placeholder="Enter grid name..."
                  className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-lg focus:outline-none focus:border-theme-primary transition-colors"
                  required
                  maxLength={50}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Choose a memorable name for your grid
              </p>
            </div>

            <div className="grid-panel p-4 rounded-lg bg-muted/30">
              <div className="text-sm mb-2">What you'll get:</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-theme-primary">•</span>
                  <span>Unique grid code to share with friends</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-primary">•</span>
                  <span>Admin controls to manage members</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-primary">•</span>
                  <span>Private leaderboard for your group</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-primary">•</span>
                  <span>Track predictions across the season</span>
                </li>
              </ul>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={gridName.length < 3}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-theme-primary hover:bg-theme-primary/90 disabled:bg-muted disabled:text-muted-foreground text-black rounded-lg transition-all glow-primary telemetry-text"
            >
              CREATE GRID
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
