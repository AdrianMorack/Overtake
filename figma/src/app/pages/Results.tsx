import { useParams, Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Trophy, CheckCircle2, XCircle, Zap } from 'lucide-react';
import { races, drivers } from '../data/mockData';

export function Results() {
  const { raceId } = useParams();
  const race = races.find(r => r.id === raceId);

  if (!race) {
    return <div>Race not found</div>;
  }

  // Mock results data
  const officialResults = {
    qualifying: {
      p1: drivers[0], // VER
      p2: drivers[4], // LEC
      p3: drivers[6], // NOR
    },
    race: {
      p1: drivers[0], // VER
      p2: drivers[4], // LEC
      p3: drivers[2], // HAM
    },
    fastestLap: drivers[0], // VER
  };

  const userPredictions = {
    qualifying: {
      p1: drivers[0], // VER
      p2: drivers[6], // NOR (wrong)
      p3: drivers[4], // LEC (wrong position)
    },
    race: {
      p1: drivers[0], // VER
      p2: drivers[4], // LEC
      p3: drivers[6], // NOR (wrong)
    },
    fastestLap: drivers[0], // VER
  };

  const pointsBreakdown = {
    qualifyingP1: 10,
    qualifyingP2: 0,
    qualifyingP3: 0,
    raceP1: 25,
    raceP2: 18,
    raceP3: 0,
    fastestLap: 5,
    total: 58,
  };

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-theme-primary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm telemetry-text">BACK TO DASHBOARD</span>
        </Link>

        {/* Race Header */}
        <div className="grid-panel p-6 rounded-lg mb-6">
          <div className="text-xs text-muted-foreground telemetry-text mb-2">ROUND {race.round} • RESULTS</div>
          <h1 className="text-3xl mb-2">{race.name}</h1>
          <p className="text-muted-foreground">{race.location}, {race.country}</p>
        </div>

        {/* Points Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid-panel p-6 rounded-lg mb-6 bg-gradient-to-r from-theme-primary/20 to-theme-primary/5 border-theme-primary"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Trophy className="w-12 h-12 text-theme-primary" />
              <div>
                <div className="text-sm text-muted-foreground telemetry-text mb-1">YOUR SCORE</div>
                <div className="text-4xl text-theme-primary telemetry-text">{pointsBreakdown.total}</div>
                <div className="text-sm text-muted-foreground">points earned</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Qualifying Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid-panel rounded-lg overflow-hidden mb-6"
        >
          <div className="p-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-theme-primary rounded-full" />
              <h2>Qualifying Results</h2>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* P1 */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex-1">
                <div className="text-xs text-muted-foreground telemetry-text mb-1">POLE POSITION</div>
                <div className="flex items-center gap-3">
                  <div className="w-1 h-10 rounded-full" style={{ backgroundColor: officialResults.qualifying.p1.teamColor }} />
                  <div>
                    <div className="text-theme-primary telemetry-text">{officialResults.qualifying.p1.code}</div>
                    <div className="text-sm">{officialResults.qualifying.p1.name}</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {userPredictions.qualifying.p1.id === officialResults.qualifying.p1.id ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Points</div>
                      <div className="text-lg text-green-500 telemetry-text">+{pointsBreakdown.qualifyingP1}</div>
                    </div>
                  </>
                ) : (
                  <XCircle className="w-6 h-6 text-red-500" />
                )}
              </div>
            </div>

            {/* P2 */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex-1">
                <div className="text-xs text-muted-foreground telemetry-text mb-1">P2</div>
                <div className="flex items-center gap-3">
                  <div className="w-1 h-10 rounded-full" style={{ backgroundColor: officialResults.qualifying.p2.teamColor }} />
                  <div>
                    <div className="text-theme-primary telemetry-text">{officialResults.qualifying.p2.code}</div>
                    <div className="text-sm">{officialResults.qualifying.p2.name}</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
            </div>

            {/* P3 */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex-1">
                <div className="text-xs text-muted-foreground telemetry-text mb-1">P3</div>
                <div className="flex items-center gap-3">
                  <div className="w-1 h-10 rounded-full" style={{ backgroundColor: officialResults.qualifying.p3.teamColor }} />
                  <div>
                    <div className="text-theme-primary telemetry-text">{officialResults.qualifying.p3.code}</div>
                    <div className="text-sm">{officialResults.qualifying.p3.name}</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Race Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid-panel rounded-lg overflow-hidden mb-6"
        >
          <div className="p-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-theme-secondary rounded-full" />
              <h2>Race Results</h2>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* P1 */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex-1">
                <div className="text-xs text-muted-foreground telemetry-text mb-1">RACE WINNER</div>
                <div className="flex items-center gap-3">
                  <div className="w-1 h-10 rounded-full" style={{ backgroundColor: officialResults.race.p1.teamColor }} />
                  <div>
                    <div className="text-theme-primary telemetry-text">{officialResults.race.p1.code}</div>
                    <div className="text-sm">{officialResults.race.p1.name}</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Points</div>
                  <div className="text-lg text-green-500 telemetry-text">+{pointsBreakdown.raceP1}</div>
                </div>
              </div>
            </div>

            {/* P2 */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex-1">
                <div className="text-xs text-muted-foreground telemetry-text mb-1">P2</div>
                <div className="flex items-center gap-3">
                  <div className="w-1 h-10 rounded-full" style={{ backgroundColor: officialResults.race.p2.teamColor }} />
                  <div>
                    <div className="text-theme-primary telemetry-text">{officialResults.race.p2.code}</div>
                    <div className="text-sm">{officialResults.race.p2.name}</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Points</div>
                  <div className="text-lg text-green-500 telemetry-text">+{pointsBreakdown.raceP2}</div>
                </div>
              </div>
            </div>

            {/* P3 */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex-1">
                <div className="text-xs text-muted-foreground telemetry-text mb-1">P3</div>
                <div className="flex items-center gap-3">
                  <div className="w-1 h-10 rounded-full" style={{ backgroundColor: officialResults.race.p3.teamColor }} />
                  <div>
                    <div className="text-theme-primary telemetry-text">{officialResults.race.p3.code}</div>
                    <div className="text-sm">{officialResults.race.p3.name}</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Fastest Lap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid-panel p-6 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Zap className="w-8 h-8 text-purple-500" />
              <div>
                <div className="text-xs text-muted-foreground telemetry-text mb-1">FASTEST LAP</div>
                <div className="flex items-center gap-3">
                  <div className="text-theme-primary telemetry-text">{officialResults.fastestLap.code}</div>
                  <div className="text-sm text-muted-foreground">{officialResults.fastestLap.name}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Points</div>
                <div className="text-lg text-green-500 telemetry-text">+{pointsBreakdown.fastestLap}</div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
