import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Trophy, Crown, Users as UsersIcon, Eye, EyeOff, Check, X, ChevronDown, ChevronUp, CheckCircle2, XCircle } from "lucide-react";
import { TEAM_COLORS } from "./LiveRacePage";
import { api } from "../api/client";
import { LeaderboardEntry, RaceWeekend, Prediction, Grid } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { GridAdminMenu } from "../components/grid/GridAdminMenu";

export function LeaderboardPage() {
  const { gridId } = useParams<{ gridId: string }>();
  const { user } = useAuth();
  const [grid, setGrid] = useState<Grid | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [races, setRaces] = useState<RaceWeekend[]>([]);
  const [myPredictions, setMyPredictions] = useState<Prediction[]>([]);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [viewPicksRaceId, setViewPicksRaceId] = useState<string | null>(null);
  const [allPredictions, setAllPredictions] = useState<Prediction[]>([]);
  const [viewPicksLoading, setViewPicksLoading] = useState(false);
  const [expandedPickUser, setExpandedPickUser] = useState<string | null>(null);

  const handleApprove = async (userId: string) => {
    if (!gridId) return;
    setActionUserId(userId);
    try {
      await api.approveMember(gridId, userId);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionUserId(null);
    }
  };

  const handleDecline = async (userId: string) => {
    if (!gridId) return;
    setActionUserId(userId);
    try {
      await api.kickMember(gridId, userId);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionUserId(null);
    }
  };

  const loadData = () => {
    if (!gridId) return;
    api.getGrid(gridId).then(setGrid).catch(console.error);
    api.getLeaderboard(gridId).then(setEntries).catch(console.error);
    api.getRaceWeekends().then(setRaces).catch(console.error);
    api.getMyPredictions(gridId).then(setMyPredictions).catch(console.error);
  };

  const handleViewPicks = async (raceId: string) => {
    if (viewPicksRaceId === raceId) {
      setViewPicksRaceId(null);
      setAllPredictions([]);
      setExpandedPickUser(null);
      return;
    }
    if (!gridId) return;
    setViewPicksRaceId(raceId);
    setExpandedPickUser(null);
    setViewPicksLoading(true);
    try {
      const preds = await api.getRacePredictions(raceId, gridId);
      setAllPredictions(preds);
    } catch (err) {
      console.error(err);
    } finally {
      setViewPicksLoading(false);
    }
  };

  useEffect(() => {
    setGrid(null);
    setEntries([]);
    setMyPredictions([]);
    loadData();
  }, [gridId]);

  const liveRaces = races.filter((r) => r.status === "IN_PROGRESS");
  const upcomingRaces = races.filter((r) => r.status === "UPCOMING" || r.status === "QUALI_COMPLETE");
  const completedRaces = races.filter((r) => r.status === "COMPLETED");
  const isOwner = user && grid && user.id === grid.ownerId;
  const myMembership = grid?.memberships?.find((m) => m.userId === user?.id);
  const isPending = myMembership?.status === "PENDING";
  const activeCount = grid?.memberships?.filter((m) => m.status === "ACTIVE").length ?? 0;
  const pendingCount = grid?.memberships?.filter((m) => m.status === "PENDING").length ?? 0;
  const [codeVisible, setCodeVisible] = useState(false);
  const viewPicksRace = viewPicksRaceId ? races.find((r) => r.id === viewPicksRaceId) ?? null : null;
  const viewPicksResults = viewPicksRace?.results ?? null;

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-theme-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm telemetry-text">BACK TO DASHBOARD</span>
        </Link>

        {/* Grid Header */}
        <div className="grid-panel p-6 rounded-lg mb-6 glow-primary theme-gradient-bg overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl">{grid?.name || "Grid Leaderboard"}</h1>
                {isOwner && <Crown className="w-6 h-6 text-theme-primary" />}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <UsersIcon className="w-4 h-4" />
                  <span>{activeCount} member{activeCount !== 1 ? "s" : ""}</span>
                  {isOwner && pendingCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-yellow-500/20 border border-yellow-500/30 rounded text-xs text-yellow-400 telemetry-text">
                      {pendingCount} PENDING
                    </span>
                  )}
                </div>
                {isOwner && grid?.code && (
                  <div className="flex items-center gap-1.5 telemetry-text">
                    <span className="text-muted-foreground">CODE:</span>
                    <span className="text-theme-primary">
                      {codeVisible ? grid.code : "••••••••"}
                    </span>
                    <button
                      onClick={() => setCodeVisible((v) => !v)}
                      className="ml-1 text-muted-foreground hover:text-theme-primary transition-colors"
                      title={codeVisible ? "Hide code" : "Show code"}
                    >
                      {codeVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
            {isOwner && grid && (
              <GridAdminMenu gridId={grid.id} gridName={grid.name} onUpdate={loadData} />
            )}
          </div>
        </div>

        {/* Pending approval banner */}
        {isPending && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10 flex items-center gap-3"
          >
            <div>
              <p className="text-sm font-medium text-yellow-300 telemetry-text">MEMBERSHIP PENDING</p>
              <p className="text-xs text-muted-foreground mt-0.5">Waiting for the grid owner to approve your request. You can browse the grid but cannot submit predictions yet.</p>
            </div>
          </motion.div>
        )}

        {/* All Picks Panel */}
        {viewPicksRaceId && (() => {
          const matchCell = (picked: string, official: string | null | undefined) => {
            if (!official) return "text-muted-foreground";
            return picked === official ? "text-green-500" : "text-red-400";
          };
          return (
            <motion.div
              key={viewPicksRaceId}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid-panel rounded-lg overflow-hidden mb-6"
            >
              <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
                <h2>All Picks — {viewPicksRace?.raceName}</h2>
                <button
                  onClick={() => { setViewPicksRaceId(null); setAllPredictions([]); setExpandedPickUser(null); }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {viewPicksLoading ? (
                <div className="p-8 text-center text-muted-foreground text-sm animate-pulse telemetry-text">LOADING…</div>
              ) : (
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
                        <th className="px-3 py-3 text-center text-xs telemetry-text text-muted-foreground">TT</th>
                        <th className="px-3 py-3 text-right text-xs telemetry-text text-muted-foreground">PTS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allPredictions
                        .sort((a, b) => (b.totalPoints ?? 0) - (a.totalPoints ?? 0))
                        .map((p) => {
                          const isExpanded = expandedPickUser === p.id;
                          const pBreakdown = (p.breakdown ?? {}) as Record<string, number>;
                          return (
                            <>
                              <tr
                                key={p.id}
                                onClick={() => setExpandedPickUser(isExpanded ? null : p.id)}
                                className={`border-b border-border hover:bg-muted/30 transition-colors cursor-pointer ${p.userId === user?.id ? "bg-theme-primary/10" : ""}`}
                              >
                                <td className="px-3 py-3 font-medium">
                                  <div className="flex items-center gap-2">
                                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    {p.user?.username ?? "—"}
                                  </div>
                                </td>
                                <td className={`px-3 py-3 text-center telemetry-text text-xs ${matchCell(p.qualiFirst, viewPicksResults?.qualiFirst)}`}>{p.qualiFirst}</td>
                                <td className={`px-3 py-3 text-center telemetry-text text-xs ${matchCell(p.qualiSecond, viewPicksResults?.qualiSecond)}`}>{p.qualiSecond}</td>
                                <td className={`px-3 py-3 text-center telemetry-text text-xs ${matchCell(p.qualiThird, viewPicksResults?.qualiThird)}`}>{p.qualiThird}</td>
                                <td className={`px-3 py-3 text-center telemetry-text text-xs ${matchCell(p.raceFirst, viewPicksResults?.raceFirst)}`}>{p.raceFirst}</td>
                                <td className={`px-3 py-3 text-center telemetry-text text-xs ${matchCell(p.raceSecond, viewPicksResults?.raceSecond)}`}>{p.raceSecond}</td>
                                <td className={`px-3 py-3 text-center telemetry-text text-xs ${matchCell(p.raceThird, viewPicksResults?.raceThird)}`}>{p.raceThird}</td>
                                <td className={`px-3 py-3 text-center telemetry-text text-xs ${matchCell(p.fastestLap, viewPicksResults?.fastestLap)}`}>{p.fastestLap}</td>
                                <td className={`px-3 py-3 text-center telemetry-text text-xs ${matchCell(p.topTeam, viewPicksResults?.topTeam)}`}>{p.topTeam}</td>
                                <td className="px-3 py-3 text-right">
                                  <span className="text-theme-primary telemetry-text font-bold">{p.totalPoints}</span>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr key={`${p.id}-detail`} className="bg-muted/20">
                                  <td colSpan={10} className="px-4 py-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                      {[
                                        { label: "Quali P1", picked: p.qualiFirst, official: viewPicksResults?.qualiFirst, key: "qualiFirst" },
                                        { label: "Quali P2", picked: p.qualiSecond, official: viewPicksResults?.qualiSecond, key: "qualiSecond" },
                                        { label: "Quali P3", picked: p.qualiThird, official: viewPicksResults?.qualiThird, key: "qualiThird" },
                                        { label: "Race P1", picked: p.raceFirst, official: viewPicksResults?.raceFirst, key: "raceFirst" },
                                        { label: "Race P2", picked: p.raceSecond, official: viewPicksResults?.raceSecond, key: "raceSecond" },
                                        { label: "Race P3", picked: p.raceThird, official: viewPicksResults?.raceThird, key: "raceThird" },
                                        { label: "Fastest Lap", picked: p.fastestLap, official: viewPicksResults?.fastestLap, key: "fastestLap" },
                                        { label: "Top Team", picked: p.topTeam, official: viewPicksResults?.topTeam, key: "topTeam" },
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
                      {allPredictions.length === 0 && !viewPicksLoading && (
                        <tr>
                          <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground text-sm">
                            No predictions submitted yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          );
        })()}

        {/* Leaderboard Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid-panel rounded-lg overflow-hidden mb-6"
        >
          <div className="p-4 panel-header">
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-theme-primary" />
              <h2>Leaderboard</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/20 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs telemetry-text text-muted-foreground">POS</th>
                  <th className="px-4 py-3 text-left text-xs telemetry-text text-muted-foreground">PLAYER</th>
                  <th className="px-4 py-3 text-right text-xs telemetry-text text-muted-foreground">POINTS</th>
                  <th className="px-4 py-3 text-right text-xs telemetry-text text-muted-foreground">RACES</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <motion.tr
                    key={entry.userId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    className={`border-b border-border hover:bg-muted/30 transition-colors ${
                      entry.userId === user?.id
                        ? "bg-theme-primary/10 border-l-2 border-l-theme-primary"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {index === 0 && <Trophy className="w-4 h-4 text-yellow-500" />}
                        {index === 1 && <Trophy className="w-4 h-4 text-gray-400" />}
                        {index === 2 && <Trophy className="w-4 h-4 text-orange-600" />}
                        <span className="telemetry-text">{index + 1}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {(() => {
                          const tc = (entry.favoriteTeam && TEAM_COLORS[entry.favoriteTeam]) || TEAM_COLORS.ferrari;
                          return entry.avatarUrl ? (
                            <img src={entry.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover ring-2" style={{ "--tw-ring-color": tc.primary } as React.CSSProperties} />
                          ) : (
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs telemetry-text"
                              style={{ background: tc.primary, color: tc.secondary }}
                            >
                              {entry.username.substring(0, 2).toUpperCase()}
                            </div>
                          );
                        })()}
                        <span className={entry.userId === user?.id ? "text-theme-primary" : ""}>
                          {entry.username}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-theme-primary telemetry-text">{entry.totalPoints}</span>
                    </td>
                    <td className="px-4 py-4 text-right text-muted-foreground">{entry.racesPlayed}</td>
                  </motion.tr>
                ))}
                {entries.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      No predictions submitted yet.
                    </td>
                  </tr>
                )}
                {/* Pending members at the bottom */}
                {grid?.memberships?.filter((m) => m.status === "PENDING").map((m) => (
                  <tr key={m.userId} className="border-b border-border/50 opacity-60">
                    <td className="px-4 py-4">
                      <span className="telemetry-text text-muted-foreground">—</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-xs telemetry-text text-muted-foreground">
                          {m.user.username.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-muted-foreground">{m.user.username}</span>
                        <span className="px-1.5 py-0.5 bg-yellow-500/20 border border-yellow-500/30 rounded text-xs text-yellow-500 telemetry-text">
                          PENDING
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right text-muted-foreground telemetry-text">—</td>
                    <td className="px-4 py-4 text-right">
                      {isOwner ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(m.userId)}
                            disabled={actionUserId === m.userId}
                            className="p-1.5 rounded-full bg-green-500/20 hover:bg-green-500/40 text-green-400 transition-colors disabled:opacity-50"
                            title="Approve"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDecline(m.userId)}
                            disabled={actionUserId === m.userId}
                            className="p-1.5 rounded-full bg-destructive/20 hover:bg-destructive/40 text-destructive transition-colors disabled:opacity-50"
                            title="Decline"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Race List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid-panel rounded-lg overflow-hidden"
        >
          <div className="p-4 border-b border-border bg-muted/30">
            <h2>Races</h2>
          </div>
          <div className="divide-y divide-border">
            {/* Live */}
            {liveRaces.map((r) => (
              <div key={r.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground telemetry-text">ROUND {r.round}</span>
                      <span className="px-2 py-0.5 bg-theme-primary/20 border border-theme-primary rounded text-xs text-theme-primary telemetry-text animate-pulse">
                        LIVE
                      </span>
                    </div>
                    <h4 className="mb-1">{r.raceName}</h4>
                    <p className="text-sm text-muted-foreground">{r.circuitName}, {r.country}</p>
                  </div>
                  <Link to={`/grids/${gridId}/live/${r.id}`}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      className="px-4 py-2 bg-theme-secondary hover:bg-theme-secondary/80 text-theme-secondary-fg rounded telemetry-text text-sm"
                    >
                      WATCH LIVE
                    </motion.button>
                  </Link>
                </div>
              </div>
            ))}

            {/* Upcoming */}
            {upcomingRaces.map((r) => {
              const hasPrediction = myPredictions.some(
                (p) => p.raceWeekendId === r.id && p.gridId === gridId
              );
              const isLocked = new Date() > new Date(r.predictionsLock);
              const isQualiDone = r.status === "QUALI_COMPLETE";
              return (
                <div key={r.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground telemetry-text">ROUND {r.round}</span>
                        {isQualiDone ? (
                          <span className="px-2 py-0.5 bg-purple-600/20 border border-purple-600 rounded text-xs text-purple-400 telemetry-text">
                            QUALI DONE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-blue-600/20 border border-blue-600 rounded text-xs text-blue-500 telemetry-text">
                            UPCOMING
                          </span>
                        )}
                        {hasPrediction && (
                          <span className="px-2 py-0.5 bg-green-600/20 border border-green-600 rounded text-xs text-green-500 telemetry-text">
                            PREDICTED
                          </span>
                        )}
                      </div>
                      <h4 className="mb-1">{r.raceName}</h4>
                      <p className="text-sm text-muted-foreground">{r.circuitName}, {r.country}</p>
                      <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                        <span>Race: {new Date(r.raceDate).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isLocked && hasPrediction && (
                        <Link to={`/grids/${gridId}/race/${r.id}/predict`}>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            className="px-4 py-2 bg-purple-600/20 border border-purple-600 text-purple-400 hover:bg-purple-600/30 rounded telemetry-text text-sm"
                          >
                            VIEW PICKS
                          </motion.button>
                        </Link>
                      )}
                      {isLocked && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          onClick={() => handleViewPicks(r.id)}
                          className={`px-4 py-2 rounded telemetry-text text-sm ${
                            viewPicksRaceId === r.id
                              ? "bg-theme-primary/20 border border-theme-primary text-theme-primary"
                              : "bg-muted hover:bg-muted/80 text-muted-foreground"
                          }`}
                        >
                          {viewPicksRaceId === r.id ? "HIDE" : "VIEW"}
                        </motion.button>
                      )}
                      {!isLocked && (
                        <Link to={`/grids/${gridId}/race/${r.id}/predict`}>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            className={`px-4 py-2 rounded telemetry-text text-sm ${
                              hasPrediction
                                ? "bg-green-600/20 border border-green-600 text-green-500 hover:bg-green-600/30"
                                : "bg-theme-secondary hover:bg-theme-secondary/80 text-theme-secondary-fg"
                            }`}
                          >
                            {hasPrediction ? "EDIT" : "PREDICT"}
                          </motion.button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Completed */}
            {completedRaces.map((r) => (
              <div key={r.id} className="p-4 hover:bg-muted/30 transition-colors opacity-70">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground telemetry-text">ROUND {r.round}</span>
                      <span className="px-2 py-0.5 bg-muted border border-border rounded text-xs text-muted-foreground telemetry-text">
                        COMPLETED
                      </span>
                    </div>
                    <h4 className="mb-1">{r.raceName}</h4>
                    <p className="text-sm text-muted-foreground">{r.circuitName}, {r.country}</p>
                  </div>
                  <Link to={`/grids/${gridId}/race/${r.id}/results`}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      className="px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded telemetry-text text-sm"
                    >
                      RESULTS
                    </motion.button>
                  </Link>
                </div>
              </div>
            ))}

            {liveRaces.length === 0 && upcomingRaces.length === 0 && completedRaces.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">No races scheduled yet.</div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
