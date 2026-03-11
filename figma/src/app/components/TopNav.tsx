import { Link, useLocation } from 'react-router';
import { Trophy, Settings, Flag } from 'lucide-react';
import { motion } from 'motion/react';

export function TopNav() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="hidden md:block border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3">
            <div className="relative">
              <Flag className="w-8 h-8 text-theme-primary" />
              <motion.div
                className="absolute inset-0"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Flag className="w-8 h-8 text-theme-secondary opacity-30" />
              </motion.div>
            </div>
            <div>
              <h1 className="text-xl tracking-tight">OVERTAKE</h1>
              <div className="text-xs text-muted-foreground telemetry-text">F1 PREDICTION PLATFORM</div>
            </div>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              to="/dashboard"
              className={`text-sm transition-colors hover:text-theme-primary ${
                isActive('/dashboard') ? 'text-theme-primary' : 'text-muted-foreground'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/grids"
              className={`text-sm transition-colors hover:text-theme-primary ${
                isActive('/grids') ? 'text-theme-primary' : 'text-muted-foreground'
              }`}
            >
              My Grids
            </Link>
            <Link
              to="/races"
              className={`text-sm transition-colors hover:text-theme-primary ${
                isActive('/races') ? 'text-theme-primary' : 'text-muted-foreground'
              }`}
            >
              Races
            </Link>
            <Link
              to="/leaderboards"
              className={`flex items-center gap-1.5 text-sm transition-colors hover:text-theme-primary ${
                isActive('/leaderboards') ? 'text-theme-primary' : 'text-muted-foreground'
              }`}
            >
              <Trophy className="w-4 h-4" />
              Leaderboards
            </Link>
            <Link
              to="/profile"
              className={`text-sm transition-colors hover:text-theme-primary ${
                isActive('/profile') ? 'text-theme-primary' : 'text-muted-foreground'
              }`}
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
