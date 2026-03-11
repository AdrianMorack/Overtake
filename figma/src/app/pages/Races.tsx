import { motion } from 'motion/react';
import { races } from '../data/mockData';
import { RaceCard } from '../components/RaceCard';

export function Races() {
  const upcomingRaces = races.filter(r => r.status === 'upcoming' || r.status === 'live');
  const completedRaces = races.filter(r => r.status === 'completed');

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl mb-2">2026 Season</h1>
          <p className="text-muted-foreground telemetry-text">FORMULA 1 RACE CALENDAR</p>
        </div>

        {/* Upcoming Races */}
        <div className="mb-8">
          <h2 className="mb-4 flex items-center gap-3">
            <div className="w-1 h-6 bg-theme-primary rounded-full" />
            Upcoming Races
          </h2>
          <div className="space-y-4">
            {upcomingRaces.map((race, index) => (
              <motion.div
                key={race.id}
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <RaceCard race={race} isUpcoming={race.status === 'live'} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Completed Races */}
        <div>
          <h2 className="mb-4 flex items-center gap-3">
            <div className="w-1 h-6 bg-green-600 rounded-full" />
            Completed Races
          </h2>
          <div className="space-y-4">
            {completedRaces.map((race, index) => (
              <motion.div
                key={race.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <RaceCard race={race} predicted />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
