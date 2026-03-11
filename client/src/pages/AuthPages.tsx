import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import { Flag, Mail, Lock, User, ArrowRight } from "lucide-react";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-card overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#2a2a3510_1px,transparent_1px),linear-gradient(to_bottom,#2a2a3510_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="grid-panel p-8 rounded-2xl glow-primary">
          <div className="flex flex-col items-center mb-8">
            <div className="mb-4">
              <Flag className="w-16 h-16 text-theme-primary" />
            </div>
            <h1 className="text-3xl mb-2">OVERTAKE</h1>
            <p className="text-sm text-muted-foreground telemetry-text">F1 PREDICTION PLATFORM</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-2 text-muted-foreground telemetry-text">EMAIL</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="driver@overtake.com"
                  className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:border-theme-primary transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2 text-muted-foreground telemetry-text">PASSWORD</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:border-theme-primary transition-colors"
                  required
                />
              </div>
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-theme-primary hover:bg-theme-primary/90 text-black rounded-lg transition-all glow-primary disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="telemetry-text">{loading ? "LOGGING IN…" : "LOGIN"}</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/register" className="text-sm text-muted-foreground hover:text-theme-primary transition-colors">
              Don't have an account? <span className="text-theme-primary">Register</span>
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await register(email, username, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-card overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#2a2a3510_1px,transparent_1px),linear-gradient(to_bottom,#2a2a3510_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="grid-panel p-8 rounded-2xl glow-primary">
          <div className="flex flex-col items-center mb-8">
            <div className="mb-4">
              <Flag className="w-16 h-16 text-theme-primary" />
            </div>
            <h1 className="text-3xl mb-2">OVERTAKE</h1>
            <p className="text-sm text-muted-foreground telemetry-text">F1 PREDICTION PLATFORM</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-2 text-muted-foreground telemetry-text">EMAIL</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="driver@overtake.com"
                  className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:border-theme-primary transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2 text-muted-foreground telemetry-text">USERNAME</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your_username"
                  className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:border-theme-primary transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2 text-muted-foreground telemetry-text">PASSWORD</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="min 8 characters"
                  className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:border-theme-primary transition-colors"
                  required
                  minLength={8}
                />
              </div>
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-theme-primary hover:bg-theme-primary/90 text-black rounded-lg transition-all glow-primary disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="telemetry-text">{loading ? "CREATING ACCOUNT…" : "REGISTER"}</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-theme-primary transition-colors">
              Already have an account? <span className="text-theme-primary">Login</span>
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <div className="text-xs text-center text-muted-foreground telemetry-text">
              SEASON 2026
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


