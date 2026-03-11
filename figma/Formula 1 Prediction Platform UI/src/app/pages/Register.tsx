import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion } from 'motion/react';
import { Flag, Mail, Lock, User, ArrowRight } from 'lucide-react';

export function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock registration
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-card">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#2a2a3510_1px,transparent_1px),linear-gradient(to_bottom,#2a2a3510_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="grid-panel p-8 rounded-2xl glow-primary">
          <div className="flex flex-col items-center mb-8">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mb-4"
            >
              <Flag className="w-16 h-16 text-theme-primary" />
            </motion.div>
            <h1 className="text-3xl mb-2">Join OVERTAKE</h1>
            <p className="text-sm text-muted-foreground telemetry-text">CREATE YOUR ACCOUNT</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-2 text-muted-foreground telemetry-text">NAME</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:border-theme-primary transition-colors"
                  required
                />
              </div>
            </div>

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

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-theme-primary hover:bg-theme-primary/90 text-black rounded-lg transition-all glow-primary"
            >
              <span className="telemetry-text">CREATE ACCOUNT</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-theme-primary transition-colors">
              Already have an account? <span className="text-theme-primary">Login</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
