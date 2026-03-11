import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Palette, LogOut, CheckCircle2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const TEAMS = [
  { id: "ferrari", name: "Ferrari", primary: "#dc0000", secondary: "#fff100" },
  { id: "mercedes", name: "Mercedes", primary: "#00d2be", secondary: "#c0c0c0" },
  { id: "redbull", name: "Red Bull", primary: "#0600ef", secondary: "#dc0000" },
  { id: "mclaren", name: "McLaren", primary: "#ff8700", secondary: "#0090ff" },
  { id: "alpine", name: "Alpine", primary: "#0090ff", secondary: "#ff87bc" },
  { id: "aston-martin", name: "Aston Martin", primary: "#006f62", secondary: "#00f5d4" },
  { id: "williams", name: "Williams", primary: "#005aff", secondary: "#00a0de" },
];

export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedTeam, setSelectedTeam] = useState(() => {
    return localStorage.getItem("favoriteTeam") ?? "ferrari";
  });

  const handleTeamSelect = (teamId: string) => {
    setSelectedTeam(teamId);
    localStorage.setItem("favoriteTeam", teamId);
    document.body.setAttribute("data-team", teamId);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Profile Header */}
        <div className="grid-panel p-6 rounded-lg mb-6 glow-primary">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-theme-primary/20 rounded-full flex items-center justify-center border-2 border-theme-primary">
              <span className="text-2xl text-theme-primary telemetry-text font-bold">
                {user?.username?.substring(0, 2).toUpperCase() ?? "??"}
              </span>
            </div>
            <div>
              <h1 className="text-3xl mb-1">{user?.username}</h1>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-muted-foreground telemetry-text">ACTIVE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Favorite Team */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid-panel rounded-lg overflow-hidden mb-6"
        >
          <div className="p-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <Palette className="w-5 h-5 text-theme-primary" />
              <div>
                <h2 className="mb-0.5">Favorite Team</h2>
                <p className="text-xs text-muted-foreground">Controls the accent color across the app</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TEAMS.map((team) => {
                const active = selectedTeam === team.id;
                return (
                  <motion.button
                    key={team.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleTeamSelect(team.id)}
                    className="relative p-4 rounded-lg border-2 transition-all text-left"
                    style={{
                      borderColor: active ? team.primary : "var(--border)",
                      boxShadow: active ? `0 0 16px ${team.primary}40` : "none",
                      background: active ? `${team.primary}15` : "transparent",
                    }}
                  >
                    {/* Color swatches */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: team.primary }} />
                      <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: team.secondary }} />
                      {active && (
                        <CheckCircle2 className="w-4 h-4 ml-auto" style={{ color: team.primary }} />
                      )}
                    </div>

                    <div className="text-sm font-medium">{team.name}</div>

                    {/* color gradient bar */}
                    <div
                      className="mt-2 h-1 rounded-full"
                      style={{ background: `linear-gradient(to right, ${team.primary}, ${team.secondary})` }}
                    />
                  </motion.button>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground mt-4 telemetry-text text-center">
              CURRENTLY: {TEAMS.find((t) => t.id === selectedTeam)?.name.toUpperCase()}
            </p>
          </div>
        </motion.div>

        {/* Account Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid-panel rounded-lg overflow-hidden"
        >
          <div className="p-4 border-b border-border bg-muted/30">
            <h2>Account</h2>
          </div>
          <div className="p-4">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="telemetry-text text-sm">SIGN OUT</span>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
