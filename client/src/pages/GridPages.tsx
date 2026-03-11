import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Users, Type, Key, Loader2 } from "lucide-react";
import { api } from "../api/client";

export function CreateGridPage() {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const grid = await api.createGrid(name);
      navigate(`/grids/${grid.id}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-theme-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm telemetry-text">BACK TO DASHBOARD</span>
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter grid name..."
                  className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-lg focus:outline-none focus:border-theme-primary transition-colors"
                  required
                  minLength={2}
                  maxLength={50}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Choose a memorable name for your grid</p>
            </div>

            <div className="grid-panel p-4 rounded-lg bg-muted/30">
              <div className="text-sm mb-2">What you'll get:</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  "Unique grid code to share with friends",
                  "Admin controls to manage members",
                  "Private leaderboard for your group",
                  "Track predictions across the season",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-theme-primary">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {error && <p className="text-red-500 text-sm telemetry-text">{error}</p>}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={name.length < 2}
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

export function JoinGridPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const grid = await api.joinGrid(code.toUpperCase());
      navigate(`/grids/${grid.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-theme-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm telemetry-text">BACK TO DASHBOARD</span>
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
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Enter grid code..."
                  className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-lg focus:outline-none focus:border-theme-primary transition-colors text-lg telemetry-text"
                  required
                  maxLength={8}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Ask the grid admin for the invite code</p>
            </div>

            {error && <p className="text-red-500 text-sm telemetry-text">{error}</p>}

            <motion.button
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              type="submit"
              disabled={code.length < 3 || loading}
              className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg transition-all telemetry-text ${
                loading
                  ? "bg-theme-primary/70 text-black cursor-wait glow-primary"
                  : code.length < 3
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-theme-primary hover:bg-theme-primary/90 text-black glow-primary"
              }`}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> JOINING…</>
              ) : "JOIN GRID"}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
