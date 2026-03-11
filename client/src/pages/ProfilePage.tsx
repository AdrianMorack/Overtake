import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Palette, LogOut, CheckCircle2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../api/client";
import { TEAM_COLORS, applyTeamTheme } from "./LiveRacePage";

const TEAMS = [
  { id: "ferrari", name: "Ferrari", primary: TEAM_COLORS.ferrari.primary, secondary: TEAM_COLORS.ferrari.secondary },
  { id: "mercedes", name: "Mercedes", primary: TEAM_COLORS.mercedes.primary, secondary: TEAM_COLORS.mercedes.secondary },
  { id: "redbull", name: "Red Bull", primary: TEAM_COLORS.redbull.primary, secondary: TEAM_COLORS.redbull.secondary },
  { id: "mclaren", name: "McLaren", primary: TEAM_COLORS.mclaren.primary, secondary: TEAM_COLORS.mclaren.secondary },
  { id: "alpine", name: "Alpine", primary: TEAM_COLORS.alpine.primary, secondary: TEAM_COLORS.alpine.secondary },
  { id: "astonmartin", name: "Aston Martin", primary: TEAM_COLORS.astonmartin.primary, secondary: TEAM_COLORS.astonmartin.secondary },
  { id: "williams", name: "Williams", primary: TEAM_COLORS.williams.primary, secondary: TEAM_COLORS.williams.secondary },
  { id: "haas", name: "Haas", primary: TEAM_COLORS.haas.primary, secondary: TEAM_COLORS.haas.secondary },
  { id: "racingbulls", name: "Racing Bulls", primary: TEAM_COLORS.racingbulls.primary, secondary: TEAM_COLORS.racingbulls.secondary },
  { id: "cadillac", name: "Cadillac", primary: TEAM_COLORS.cadillac.primary, secondary: TEAM_COLORS.cadillac.secondary },
  { id: "audi", name: "Audi", primary: TEAM_COLORS.audi.primary, secondary: TEAM_COLORS.audi.secondary },
];

export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedTeam, setSelectedTeam] = useState(() => {
    const key = user ? `favoriteTeam:${user.id}` : "favoriteTeam";
    return localStorage.getItem(key) ?? "ferrari";
  });

  const handleTeamSelect = (teamId: string) => {
    setSelectedTeam(teamId);
    const key = user ? `favoriteTeam:${user.id}` : "favoriteTeam";
    localStorage.setItem(key, teamId);
    applyTeamTheme(teamId);
    api.updateProfile({ favoriteTeam: teamId }).catch(() => {});
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
          <div className="p-4 panel-header">
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
          <div className="p-4 panel-header">
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
