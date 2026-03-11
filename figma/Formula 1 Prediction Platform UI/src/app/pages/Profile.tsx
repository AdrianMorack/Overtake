import { motion } from 'motion/react';
import { User, Trophy, Target, TrendingUp, Palette, LogOut } from 'lucide-react';
import { useTheme, F1Team } from '../context/ThemeContext';
import { useNavigate } from 'react-router';

const teamThemes = [
  { id: 'ferrari' as F1Team, name: 'Ferrari', primary: '#dc0000', secondary: '#fff100' },
  { id: 'mercedes' as F1Team, name: 'Mercedes', primary: '#00d2be', secondary: '#c0c0c0' },
  { id: 'redbull' as F1Team, name: 'Red Bull', primary: '#0600ef', secondary: '#dc0000' },
  { id: 'mclaren' as F1Team, name: 'McLaren', primary: '#ff8700', secondary: '#0090ff' },
  { id: 'alpine' as F1Team, name: 'Alpine', primary: '#0090ff', secondary: '#ff87bc' },
  { id: 'aston-martin' as F1Team, name: 'Aston Martin', primary: '#006f62', secondary: '#00f5d4' },
  { id: 'williams' as F1Team, name: 'Williams', primary: '#005aff', secondary: '#00a0de' },
];

export function Profile() {
  const { team, setTeam } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl mb-2">Profile</h1>
          <p className="text-muted-foreground telemetry-text">YOUR DRIVER PROFILE</p>
        </div>

        {/* User Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid-panel p-6 rounded-lg mb-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-theme-primary to-theme-secondary rounded-full flex items-center justify-center">
              <User className="w-10 h-10" />
            </div>
            <div>
              <h2 className="mb-1">Your Name</h2>
              <p className="text-sm text-muted-foreground telemetry-text">driver@overtake.com</p>
              <p className="text-xs text-muted-foreground mt-1">Member since March 2026</p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          <div className="grid-panel p-4 rounded-lg">
            <Trophy className="w-6 h-6 text-theme-primary mb-2" />
            <div className="text-2xl text-theme-primary telemetry-text mb-1">456</div>
            <div className="text-xs text-muted-foreground telemetry-text">TOTAL POINTS</div>
          </div>

          <div className="grid-panel p-4 rounded-lg">
            <Target className="w-6 h-6 text-theme-primary mb-2" />
            <div className="text-2xl text-theme-primary telemetry-text mb-1">12</div>
            <div className="text-xs text-muted-foreground telemetry-text">PREDICTIONS</div>
          </div>

          <div className="grid-panel p-4 rounded-lg">
            <TrendingUp className="w-6 h-6 text-theme-primary mb-2" />
            <div className="text-2xl text-theme-primary telemetry-text mb-1">68%</div>
            <div className="text-xs text-muted-foreground telemetry-text">ACCURACY</div>
          </div>

          <div className="grid-panel p-4 rounded-lg">
            <Trophy className="w-6 h-6 text-yellow-500 mb-2" />
            <div className="text-2xl text-theme-primary telemetry-text mb-1">2</div>
            <div className="text-xs text-muted-foreground telemetry-text">WINS</div>
          </div>
        </motion.div>

        {/* Theme Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid-panel p-6 rounded-lg mb-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Palette className="w-6 h-6 text-theme-primary" />
            <div>
              <h2 className="mb-1">Theme Colors</h2>
              <p className="text-sm text-muted-foreground">Choose your favorite F1 team colors</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {teamThemes.map((theme) => (
              <motion.button
                key={theme.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTeam(theme.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  team === theme.id
                    ? 'border-theme-primary bg-theme-primary/10'
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                <div className="flex gap-2 mb-3">
                  <div
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: theme.primary }}
                  />
                  <div
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: theme.secondary }}
                  />
                </div>
                <div className="text-sm telemetry-text">{theme.name}</div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-destructive text-destructive hover:bg-destructive/10 rounded-lg transition-colors telemetry-text"
          >
            <LogOut className="w-5 h-5" />
            LOGOUT
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}
