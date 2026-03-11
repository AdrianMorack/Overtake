import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, CheckCircle2, Save } from 'lucide-react';
import { DriverSelector } from '../components/DriverSelector';
import { races, teams } from '../data/mockData';
import { Link } from 'react-router';

export function Prediction() {
  const { raceId } = useParams();
  const navigate = useNavigate();
  const race = races.find(r => r.id === raceId);

  const [showSuccess, setShowSuccess] = useState(false);

  // Qualifying predictions
  const [qualP1, setQualP1] = useState('');
  const [qualP2, setQualP2] = useState('');
  const [qualP3, setQualP3] = useState('');

  // Race predictions
  const [raceP1, setRaceP1] = useState('');
  const [raceP2, setRaceP2] = useState('');
  const [raceP3, setRaceP3] = useState('');

  // Extras
  const [fastestLap, setFastestLap] = useState('');
  const [topTeam, setTopTeam] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuccess(true);
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  const selectedDrivers = [qualP1, qualP2, qualP3, raceP1, raceP2, raceP3, fastestLap].filter(Boolean);

  if (!race) {
    return <div>Race not found</div>;
  }

  const date = new Date(race.date);
  const formattedDate = date.toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-theme-primary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm telemetry-text">BACK TO DASHBOARD</span>
        </Link>

        <div className="grid-panel p-6 rounded-lg mb-6">
          <div className="text-xs text-muted-foreground telemetry-text mb-2">ROUND {race.round}</div>
          <h1 className="text-3xl mb-2">{race.name}</h1>
          <p className="text-muted-foreground">{race.location}, {race.country}</p>
          <p className="text-sm text-muted-foreground mt-1">{formattedDate}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Qualifying Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid-panel p-6 rounded-lg mb-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-theme-primary rounded-full" />
              <div>
                <h2 className="mb-1">Qualifying Predictions</h2>
                <p className="text-sm text-muted-foreground">Predict the top 3 qualifiers</p>
              </div>
            </div>

            <div className="space-y-4">
              <DriverSelector
                label="P1 - POLE POSITION"
                value={qualP1}
                onChange={setQualP1}
                excludeDrivers={selectedDrivers.filter(d => d !== qualP1)}
              />
              <DriverSelector
                label="P2"
                value={qualP2}
                onChange={setQualP2}
                excludeDrivers={selectedDrivers.filter(d => d !== qualP2)}
              />
              <DriverSelector
                label="P3"
                value={qualP3}
                onChange={setQualP3}
                excludeDrivers={selectedDrivers.filter(d => d !== qualP3)}
              />
            </div>
          </motion.div>

          {/* Race Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid-panel p-6 rounded-lg mb-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-theme-secondary rounded-full" />
              <div>
                <h2 className="mb-1">Race Predictions</h2>
                <p className="text-sm text-muted-foreground">Predict the top 3 finishers</p>
              </div>
            </div>

            <div className="space-y-4">
              <DriverSelector
                label="P1 - RACE WINNER"
                value={raceP1}
                onChange={setRaceP1}
                excludeDrivers={selectedDrivers.filter(d => d !== raceP1)}
              />
              <DriverSelector
                label="P2"
                value={raceP2}
                onChange={setRaceP2}
                excludeDrivers={selectedDrivers.filter(d => d !== raceP2)}
              />
              <DriverSelector
                label="P3"
                value={raceP3}
                onChange={setRaceP3}
                excludeDrivers={selectedDrivers.filter(d => d !== raceP3)}
              />
            </div>
          </motion.div>

          {/* Extras Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid-panel p-6 rounded-lg mb-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-theme-primary rounded-full" />
              <div>
                <h2 className="mb-1">Bonus Predictions</h2>
                <p className="text-sm text-muted-foreground">Extra points available</p>
              </div>
            </div>

            <div className="space-y-4">
              <DriverSelector
                label="FASTEST LAP"
                value={fastestLap}
                onChange={setFastestLap}
                excludeDrivers={[]}
              />

              <div>
                <label className="block text-sm mb-2 text-muted-foreground telemetry-text">TOP TEAM</label>
                <select
                  value={topTeam}
                  onChange={(e) => setTopTeam(e.target.value)}
                  className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:border-theme-primary transition-colors"
                >
                  <option value="">Select team...</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={!qualP1 || !qualP2 || !qualP3 || !raceP1 || !raceP2 || !raceP3}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-theme-primary hover:bg-theme-primary/90 disabled:bg-muted disabled:text-muted-foreground text-black rounded-lg transition-all glow-primary telemetry-text sticky bottom-20 md:bottom-6"
          >
            <Save className="w-5 h-5" />
            SUBMIT PREDICTIONS
          </motion.button>
        </form>
      </motion.div>

      {/* Success Banner */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-4 bg-green-600 text-white rounded-lg shadow-xl flex items-center gap-3"
          >
            <CheckCircle2 className="w-6 h-6" />
            <div>
              <div className="telemetry-text">PREDICTIONS SUBMITTED</div>
              <div className="text-sm opacity-90">Redirecting to dashboard...</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
