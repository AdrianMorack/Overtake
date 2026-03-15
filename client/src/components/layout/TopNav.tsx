import { Link, useLocation } from "react-router-dom";
import { Flag, User } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export function TopNav() {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/grids", label: "My Grids" },
    { to: "/races", label: "Races" },
    { to: "/standings", label: "Standings" },
  ];

  return (
    <nav className="hidden md:block bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="h-[3px] theme-top-bar" />
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center gap-3">
            <Flag className="w-8 h-8 text-theme-primary" />
            <div>
              <h1 className="text-xl tracking-tight leading-none">OVERTAKE</h1>
              <div className="text-xs text-muted-foreground telemetry-text">F1 PREDICTION PLATFORM</div>
            </div>
          </Link>

          <div className="flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm transition-colors hover:text-theme-primary ${
                  isActive(link.to) ? "text-theme-primary" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/profile"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${
                isActive("/profile")
                  ? "border-theme-primary bg-theme-primary/10 text-theme-primary"
                  : "border-border hover:border-theme-primary text-muted-foreground hover:text-theme-primary"
              }`}
            >
              <div className="w-6 h-6 bg-theme-primary/20 rounded-full flex items-center justify-center">
                <span className="text-xs text-theme-primary telemetry-text">
                  {user?.username?.substring(0, 2).toUpperCase() ?? "?"}
                </span>
              </div>
              <span className="text-sm">{user?.username}</span>
            </Link>
          </div>
        </div>
      </div>
      <div className="h-px bg-border" />
    </nav>
  );
}
