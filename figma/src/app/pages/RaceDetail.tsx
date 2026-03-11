import { useParams, Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, MapPin, Calendar, Clock } from 'lucide-react';
import { races } from '../data/mockData';
import { RaceStatusBadge } from '../components/RaceStatusBadge';

export function RaceDetail() {
  const { raceId } = useParams();
  const navigate = useNavigate();
  const race = races.find(r => r.id === raceId);

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

  const handleActionClick = () => {
    if (race.status === 'upcoming') {
      navigate(`/predict/${race.id}`);
    } else if (race.status === 'live') {
      navigate(`/live/${race.id}`);
    } else {
      navigate(`/results/${race.id}`);
    }
  };

  const getActionText = () => {
    if (race.status === 'upcoming') return 'MAKE PREDICTIONS';
    if (race.status === 'live') return 'WATCH LIVE';
    return 'VIEW RESULTS';
  };

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link to="/races" className="inline-flex items-center gap-2 text-muted-foreground hover:text-theme-primary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm telemetry-text">BACK TO RACES</span>
        </Link>

        <div className="grid-panel p-8 rounded-lg mb-6 glow-primary">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-muted-foreground telemetry-text">ROUND {race.round}</span>
              <RaceStatusBadge status={race.status} />
            </div>
            <h1 className="text-4xl mb-4">{race.name}</h1>
            <div className="flex flex-col gap-3 text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>{race.location}, {race.country}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>Race Start: 15:00 Local Time</span>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleActionClick}
            className={`w-full px-6 py-4 rounded-lg telemetry-text transition-all ${
              race.status === 'live'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-theme-primary hover:bg-theme-primary/90 text-black glow-primary'
            }`}
          >
            {getActionText()}
          </motion.button>
        </div>

        {/* Race Weekend Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid-panel p-6 rounded-lg mb-6"
        >
          <h2 className="mb-4">Race Weekend Schedule</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground telemetry-text mb-1">FRIDAY</div>
                <div>Practice 1 & 2</div>
              </div>
              <div className="text-sm text-muted-foreground telemetry-text">12:00 - 16:00</div>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground telemetry-text mb-1">SATURDAY</div>
                <div>Practice 3 & Qualifying</div>
              </div>
              <div className="text-sm text-muted-foreground telemetry-text">11:00 - 15:00</div>
            </div>
            <div className="flex items-center justify-between p-4 bg-theme-primary/20 border border-theme-primary rounded-lg">
              <div>
                <div className="text-sm text-theme-primary telemetry-text mb-1">SUNDAY</div>
                <div className="text-theme-primary">Race Day</div>
              </div>
              <div className="text-sm text-theme-primary telemetry-text">15:00</div>
            </div>
          </div>
        </motion.div>

        {/* Track Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-4"
        >
          <div className="grid-panel p-4 rounded-lg">
            <div className="text-xs text-muted-foreground telemetry-text mb-2">CIRCUIT LENGTH</div>
            <div className="text-2xl text-theme-primary telemetry-text">5.412 km</div>
          </div>
          <div className="grid-panel p-4 rounded-lg">
            <div className="text-xs text-muted-foreground telemetry-text mb-2">TOTAL LAPS</div>
            <div className="text-2xl text-theme-primary telemetry-text">53</div>
          </div>
          <div className="grid-panel p-4 rounded-lg">
            <div className="text-xs text-muted-foreground telemetry-text mb-2">RACE DISTANCE</div>
            <div className="text-2xl text-theme-primary telemetry-text">306.5 km</div>
          </div>
          <div className="grid-panel p-4 rounded-lg">
            <div className="text-xs text-muted-foreground telemetry-text mb-2">LAP RECORD</div>
            <div className="text-2xl text-theme-primary telemetry-text">1:18.234</div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
