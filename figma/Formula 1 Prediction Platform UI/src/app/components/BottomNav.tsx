import { Link, useLocation } from 'react-router';
import { Home, Users, Flag, Trophy, User } from 'lucide-react';
import { motion } from 'motion/react';

export function BottomNav() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/grids', icon: Users, label: 'Grids' },
    { path: '/races', icon: Flag, label: 'Races' },
    { path: '/leaderboards', icon: Trophy, label: 'Rankings' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center flex-1 h-full"
            >
              {active && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-theme-primary rounded-b"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon
                className={`w-5 h-5 mb-1 transition-colors ${
                  active ? 'text-theme-primary' : 'text-muted-foreground'
                }`}
              />
              <span
                className={`text-xs telemetry-text transition-colors ${
                  active ? 'text-theme-primary' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
