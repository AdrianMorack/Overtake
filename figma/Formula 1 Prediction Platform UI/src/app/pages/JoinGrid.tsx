import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Users, Key } from 'lucide-react';

export function JoinGrid() {
  const navigate = useNavigate();
  const [gridCode, setGridCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock join grid
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
              <h1 className="text-3xl mb-2">Join Grid</h1>
              <p className="text-muted-foreground">Enter the grid code to join</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm mb-2 text-muted-foreground telemetry-text">GRID CODE</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={gridCode}
                  onChange={(e) => setGridCode(e.target.value.toUpperCase())}
                  placeholder="Enter grid code..."
                  className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-lg focus:outline-none focus:border-theme-primary transition-colors text-lg telemetry-text"
                  required
                  maxLength={8}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Ask the grid admin for the invite code
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={gridCode.length < 3}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-theme-primary hover:bg-theme-primary/90 disabled:bg-muted disabled:text-muted-foreground text-black rounded-lg transition-all glow-primary telemetry-text"
            >
              JOIN GRID
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
