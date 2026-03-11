import { motion } from 'motion/react';
import { ChevronRight, MapPin, Calendar } from 'lucide-react';
import { Race } from '../data/mockData';
import { RaceStatusBadge } from './RaceStatusBadge';
import { Link } from 'react-router';

interface RaceCardProps {
  race: Race;
  predicted?: boolean;
  isUpcoming?: boolean;
}

export function RaceCard({ race, predicted, isUpcoming }: RaceCardProps) {
  const date = new Date(race.date);
  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={`grid-panel p-4 rounded-lg transition-all ${
        isUpcoming ? 'border-theme-primary glow-primary' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground telemetry-text">ROUND {race.round}</span>
            <RaceStatusBadge status={race.status} />
            {predicted && (
              <span className="px-2 py-0.5 bg-theme-primary/20 border border-theme-primary rounded text-xs text-theme-primary telemetry-text">
                PREDICTED
              </span>
            )}
          </div>
          <h3 className="mb-1">{race.name}</h3>
          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>{race.location}, {race.country}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>
        <Link to={`/races/${race.id}`}>
          <motion.button
            whileHover={{ x: 4 }}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </Link>
      </div>
    </motion.div>
  );
}
