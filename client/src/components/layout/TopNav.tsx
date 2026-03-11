import { Link, useLocation } from "react-router-dom";
import { Trophy, Flag, Home, MapPin } from "lucide-react";

export function TopNav() {
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/races", label: "Races" },
  ];

  return (
    <nav className="hidden md:block border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
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
          </div>
        </div>
      </div>
    </nav>
  );
}
