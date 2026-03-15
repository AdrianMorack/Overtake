import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Trophy, CheckCircle2, XCircle, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { api } from "../api/client";
import { Prediction, RaceWeekend } from "../types";
import { useAuth } from "../contexts/AuthContext";

function ResultRow({
  label,
  official,
  predicted,
  points,
}: {
  label: string;
  official: string | null | undefined;
  predicted: string;
  points?: number;
}) {
  const hasResult = official != null && official !== "";
  const correct = hasResult && predicted && official === predicted;
  return (
    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
      <div className="flex-1">
        <div className="text-xs text-muted-foreground telemetry-text mb-1">{label}</div>
        <div className="flex items-center gap-3">
          <div>
            <div className="text-theme-primary telemetry-text">{hasResult ? official : "—"}</div>
            {hasResult && predicted && predicted !== official && (
              <div className="text-xs text-muted-foreground">You picked: {predicted}</div>
            )}
            {!hasResult && predicted && (
              <div className="text-xs text-muted-foreground">You picked: {predicted}</div>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {hasResult && predicted ? (
          correct ? (
            <>
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              {points !== undefined && points > 0 && (
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Points</div>
                  <div className="text-lg text-green-500 telemetry-text">+{points}</div>
                </div>
              )}
            </>
          ) : (
            <>
              <XCircle className="w-6 h-6 text-red-500" />
              {points !== undefined && points > 0 && (
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Podium</div>
                  <div className="text-lg text-yellow-500 telemetry-text">+{points}</div>
                </div>
              )}
            </>
          )
        ) : !hasResult ? (
          <span className="text-xs text-muted-foreground telemetry-text">PENDING</span>
        ) : null}
      </div>
    </div>
  );
}

export function ResultsPage() {
  const { gridId, raceId } = useParams<{ gridId: string; raceId: string }>();
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [race, setRace] = useState<RaceWeekend | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => {
    if (!raceId || !gridId) return;
    api.getRacePredictions(raceId, gridId).then(setPredictions).catch(console.error);
    api.getRaceWeekends().then((weekends) => {
      setRace(weekends.find((w) => w.id === raceId) || null);
    });
  }, [raceId, gridId]);

  if (!race) {
    return (
      <div className="container mx-auto px-4 py-6 flex items-center justify-center min-h-64">
        <div className="text-muted-foreground telemetry-text text-sm animate-pulse">LOADING…</div>
      </div>
    );
  }

  const myPrediction = predictions.find((p) => p.userId === user?.id);
  const results = race.results;
  const breakdown = myPrediction?.breakdown ?? {};
  const total = myPrediction?.totalPoints ?? 0;

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          to={`/grids/${gridId}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-theme-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm telemetry-text">BACK TO GRID</span>
        </Link>

        {/* Race Header */}
        <div className="grid-panel p-6 rounded-lg mb-6">
          <div className="text-xs text-muted-foreground telemetry-text mb-2">
            ROUND {race.round} • RESULTS
          </div>
          <h1 className="text-3xl mb-2">{race.raceName}</h1>
          <p className="text-muted-foreground">{race.circuitName}, {race.country}</p>
        </div>

        {/* My Score */}
        {myPrediction && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid-panel p-6 rounded-lg mb-6 bg-gradient-to-r from-theme-primary/20 to-theme-primary/5 border-theme-primary"
          >
            <div className="flex items-center gap-4">
              <Trophy className="w-12 h-12 text-theme-primary" />
              <div>
                <div className="text-sm text-muted-foreground telemetry-text mb-1">YOUR SCORE</div>
                <div className="text-4xl text-theme-primary telemetry-text">{total}</div>
                <div className="text-sm text-muted-foreground">points earned</div>
              </div>
            </div>
          </motion.div>
        )}

        {results ? (
          <>
            {/* Qualifying Results */}
            {results.qualiFirst && (
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
                <ResultRow
                  label="POLE POSITION"
                  official={results.qualiFirst}
                  predicted={myPrediction?.qualiFirst ?? ""}
                  points={(breakdown as Record<string, number>)["qualiFirst"]}
                />
                <ResultRow
                  label="P2"
                  official={results.qualiSecond}
                  predicted={myPrediction?.qualiSecond ?? ""}
                  points={(breakdown as Record<string, number>)["qualiSecond"]}
                />
                <ResultRow
                  label="P3"
                  official={results.qualiThird}
                  predicted={myPrediction?.qualiThird ?? ""}
                  points={(breakdown as Record<string, number>)["qualiThird"]}
                />
              </div>
            </motion.div>
            )}

            {/* Race Results */}
            {results.raceFirst && (
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
                <ResultRow
                  label="RACE WINNER"
                  official={results.raceFirst}
                  predicted={myPrediction?.raceFirst ?? ""}
                  points={(breakdown as Record<string, number>)["raceFirst"]}
                />
                <ResultRow
                  label="P2"
                  official={results.raceSecond}
                  predicted={myPrediction?.raceSecond ?? ""}
                  points={(breakdown as Record<string, number>)["raceSecond"]}
                />
                <ResultRow
                  label="P3"
                  official={results.raceThird}
                  predicted={myPrediction?.raceThird ?? ""}
                  points={(breakdown as Record<string, number>)["raceThird"]}
                />
              </div>
            </motion.div>
            )}

            {/* Fastest Lap */}
            {results.fastestLap && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid-panel p-6 rounded-lg mb-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Zap className="w-8 h-8 text-purple-500" />
                  <div>
                    <div className="text-xs text-muted-foreground telemetry-text mb-1">FASTEST LAP</div>
                    <div className="text-theme-primary telemetry-text">{results.fastestLap}</div>
                    {myPrediction?.fastestLap && myPrediction.fastestLap !== results.fastestLap && (
                      <div className="text-xs text-muted-foreground">You picked: {myPrediction.fastestLap}</div>
                    )}
                  </div>
                </div>
                {myPrediction?.fastestLap && (
                  <div className="flex items-center gap-3">
                    {myPrediction.fastestLap === results.fastestLap ? (
                      <>
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                        {(breakdown as Record<string, number>)["fastestLap"] > 0 && (
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">Points</div>
                            <div className="text-lg text-green-500 telemetry-text">
                              +{(breakdown as Record<string, number>)["fastestLap"]}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500" />
                    )}
                  </div>
                )}
              </div>
            </motion.div>
            )}
          </>
        ) : (
          <div className="grid-panel p-6 rounded-lg mb-6 text-center text-muted-foreground">
            Official results not yet available.
          </div>
        )}

        {/* All Players Table */}
        {predictions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid-panel rounded-lg overflow-hidden"
          >
            <div className="p-4 border-b border-border bg-muted/30">
              <h2>All Predictions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/20 border-b border-border">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs telemetry-text text-muted-foreground">PLAYER</th>
                    <th className="px-3 py-3 text-center text-xs telemetry-text text-muted-foreground">Q1</th>
                    <th className="px-3 py-3 text-center text-xs telemetry-text text-muted-foreground">Q2</th>
                    <th className="px-3 py-3 text-center text-xs telemetry-text text-muted-foreground">Q3</th>
                    <th className="px-3 py-3 text-center text-xs telemetry-text text-muted-foreground">R1</th>
                    <th className="px-3 py-3 text-center text-xs telemetry-text text-muted-foreground">R2</th>
                    <th className="px-3 py-3 text-center text-xs telemetry-text text-muted-foreground">R3</th>
                    <th className="px-3 py-3 text-center text-xs telemetry-text text-muted-foreground">FL</th>
                    <th className="px-3 py-3 text-right text-xs telemetry-text text-muted-foreground">PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions
                    .sort((a, b) => (b.totalPoints ?? 0) - (a.totalPoints ?? 0))
                    .map((p) => {
                    const isExpanded = expandedUser === p.id;
                    const pBreakdown = (p.breakdown ?? {}) as Record<string, number>;
                    const matchCell = (picked: string, official: string | null | undefined) => {
                      if (!official) return "text-muted-foreground";
                      return picked === official ? "text-green-500" : "text-red-400";
                    };
                    return (
                      <>
                        <tr
                          key={p.id}
                          onClick={() => setExpandedUser(isExpanded ? null : p.id)}
                          className={`border-b border-border hover:bg-muted/30 transition-colors cursor-pointer ${
                            p.userId === user?.id ? "bg-theme-primary/10" : ""
                          }`}
                        >
                          <td className="px-3 py-3 font-medium">
                            <div className="flex items-center gap-2">
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              {p.user?.username ?? "—"}
                            </div>
                          </td>
                          <td className={`px-3 py-3 text-center telemetry-text text-xs ${matchCell(p.qualiFirst, results?.qualiFirst)}`}>{p.qualiFirst}</td>
                          <td className={`px-3 py-3 text-center telemetry-text text-xs ${matchCell(p.qualiSecond, results?.qualiSecond)}`}>{p.qualiSecond}</td>
                          <td className={`px-3 py-3 text-center telemetry-text text-xs ${matchCell(p.qualiThird, results?.qualiThird)}`}>{p.qualiThird}</td>
                          <td className={`px-3 py-3 text-center telemetry-text text-xs ${matchCell(p.raceFirst, results?.raceFirst)}`}>{p.raceFirst}</td>
                          <td className={`px-3 py-3 text-center telemetry-text text-xs ${matchCell(p.raceSecond, results?.raceSecond)}`}>{p.raceSecond}</td>
                          <td className={`px-3 py-3 text-center telemetry-text text-xs ${matchCell(p.raceThird, results?.raceThird)}`}>{p.raceThird}</td>
                          <td className={`px-3 py-3 text-center telemetry-text text-xs ${matchCell(p.fastestLap, results?.fastestLap)}`}>{p.fastestLap}</td>
                          <td className="px-3 py-3 text-right">
                            <span className="text-theme-primary telemetry-text font-bold">{p.totalPoints}</span>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${p.id}-detail`} className="bg-muted/20">
                            <td colSpan={9} className="px-4 py-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                {[
                                  { label: "Quali P1", picked: p.qualiFirst, official: results?.qualiFirst, key: "qualiFirst" },
                                  { label: "Quali P2", picked: p.qualiSecond, official: results?.qualiSecond, key: "qualiSecond" },
                                  { label: "Quali P3", picked: p.qualiThird, official: results?.qualiThird, key: "qualiThird" },
                                  { label: "Race P1", picked: p.raceFirst, official: results?.raceFirst, key: "raceFirst" },
                                  { label: "Race P2", picked: p.raceSecond, official: results?.raceSecond, key: "raceSecond" },
                                  { label: "Race P3", picked: p.raceThird, official: results?.raceThird, key: "raceThird" },
                                  { label: "Fastest Lap", picked: p.fastestLap, official: results?.fastestLap, key: "fastestLap" },
                                ].map((item) => {
                                  const hasOfficial = item.official != null && item.official !== "";
                                  const correct = hasOfficial && item.picked === item.official;
                                  const pts = pBreakdown[item.key] ?? 0;
                                  return (
                                    <div key={item.key} className="flex items-center justify-between p-2 rounded bg-muted/40">
                                      <div>
                                        <div className="text-[10px] text-muted-foreground telemetry-text">{item.label}</div>
                                        <div className="telemetry-text">{item.picked}</div>
                                        {hasOfficial && item.picked !== item.official && (
                                          <div className="text-[10px] text-muted-foreground">Actual: {item.official}</div>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        {hasOfficial ? (
                                          correct ? (
                                            <><CheckCircle2 className="w-4 h-4 text-green-500" />{pts > 0 && <span className="text-green-500 telemetry-text text-xs">+{pts}</span>}</>
                                          ) : (
                                            <><XCircle className="w-4 h-4 text-red-500" />{pts > 0 && <span className="text-yellow-500 telemetry-text text-xs">+{pts}</span>}</>
                                          )
                                        ) : (
                                          <span className="text-[10px] text-muted-foreground telemetry-text">PENDING</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                                {p.topTeam && (
                                  <div className="flex items-center justify-between p-2 rounded bg-muted/40">
                                    <div>
                                      <div className="text-[10px] text-muted-foreground telemetry-text">Top Team</div>
                                      <div className="telemetry-text">{p.topTeam}</div>
                                    </div>
                                    {pBreakdown["topTeam"] > 0 && (
                                      <span className="text-green-500 telemetry-text text-xs">+{pBreakdown["topTeam"]}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="mt-3 text-right">
                                <span className="text-muted-foreground text-xs">Total: </span>
                                <span className="text-theme-primary telemetry-text font-bold">{p.totalPoints} pts</span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
