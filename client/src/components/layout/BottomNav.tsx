import { Link, useLocation } from "react-router-dom";
import { Home, Flag, LayoutGrid, User } from "lucide-react";
import { motion } from "motion/react";

const navItems = [
  { path: "/dashboard", icon: Home, label: "Home" },
  { path: "/grids", icon: LayoutGrid, label: "Grids" },
  { path: "/races", icon: Flag, label: "Races" },
  { path: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card z-50">
      <div className="h-[3px] theme-top-bar" />
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
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 theme-top-bar rounded-b"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon
                className={`w-5 h-5 mb-1 transition-colors ${
                  active ? "text-theme-primary" : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-xs telemetry-text transition-colors ${
                  active ? "text-theme-primary" : "text-muted-foreground"
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
