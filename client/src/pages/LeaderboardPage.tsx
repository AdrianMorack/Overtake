import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
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

  useEffect(() => {
    if (!gridId) return;
    
    // Clear previous data when gridId changes
    setGrid(null);
    setEntries([]);
    setMyPredictions([]);
    
    // Load new data
    api.getGrid(gridId).then(setGrid).catch(console.error);
    api.getLeaderboard(gridId).then(setEntries).catch(console.error);
    api.getRaceWeekends().then(setRaces).catch(console.error);
    api.getMyPredictions(gridId).then(setMyPredictions).catch(console.error);
  }, [gridId]);

  const loadData = () => {
    if (!gridId) return;
    api.getGrid(gridId).then(setGrid).catch(console.error);
    api.getLeaderboard(gridId).then(setEntries).catch(console.error);
    api.getRaceWeekends().then(setRaces).catch(console.error);
    api.getMyPredictions(gridId).then(setMyPredictions).catch(console.error);
  };

  const upcomingRaces = races.filter((r) => r.status === "UPCOMING");
  const liveRaces     = races.filter((r) => r.status === "IN_PROGRESS");
  const isOwner = user && grid && user.id === grid.ownerId;

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 24 }}>
      <Link to="/dashboard" style={{ color: "#e10600" }}>← Dashboard</Link>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
        <h2 style={{ margin: 0 }}>{grid?.name || "Grid Leaderboard"}</h2>
        {isOwner && grid && (
          <GridAdminMenu gridId={grid.id} gridName={grid.name} onUpdate={loadData} />
        )}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #e10600" }}>
            <th style={thStyle}>#</th>
            <th style={{ ...thStyle, textAlign: "left" }}>Player</th>
            <th style={thStyle}>Points</th>
            <th style={thStyle}>Races</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => (
            <tr key={entry.userId} style={{ borderBottom: "1px solid #eee" }}>
              <td style={tdStyle}>{i + 1}</td>
              <td style={{ ...tdStyle, textAlign: "left", fontWeight: i === 0 ? 700 : 400 }}>{entry.username}</td>
              <td style={tdStyle}>{entry.totalPoints}</td>
              <td style={tdStyle}>{entry.racesPlayed}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ marginTop: 32 }}>Upcoming Races</h3>
      {liveRaces.map((r) => (
        <div key={r.id} style={{ background: "#1a0000", border: "1px solid #e10600", padding: 12, borderRadius: 6, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ background: "#e10600", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, marginRight: 8 }}>● LIVE</span>
            <strong>{r.raceName}</strong>
          </div>
          <Link
            to={`/grids/${gridId}/live/${r.id}`}
            style={{ padding: "6px 12px", background: "#e10600", color: "#fff", borderRadius: 4, textDecoration: "none", fontSize: 13, fontWeight: 600 }}
          >
            Watch Live
          </Link>
        </div>
      ))}
      {upcomingRaces.map((r, index) => {
        const isNextRace = index === 0; // First upcoming race
        // Only check predictions for THIS grid
        const hasPrediction = myPredictions.some(p => p.raceWeekendId === r.id && p.gridId === gridId);
        return (
        <div key={r.id} style={{ 
          background: hasPrediction ? "#d4edda" : "#f5f5f5", 
          borderLeft: hasPrediction ? "4px solid #28a745" : "none",
          padding: 12, 
          borderRadius: 6, 
          marginBottom: 8, 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center" 
        }}>
          <div>
            <strong style={{ color: hasPrediction ? "#155724" : "inherit" }}>{r.raceName}</strong>
            <span style={{ marginLeft: 8, fontSize: 13, color: hasPrediction ? "#155724" : "#666" }}>
              {new Date(r.raceDate).toLocaleDateString()}
            </span>
          </div>
          <Link
            to={`/grids/${gridId}/race/${r.id}/predict`}
            style={{ 
              padding: "6px 12px", 
              background: hasPrediction ? "#28a745" : "#e10600", 
              color: "#fff", 
              borderRadius: 4, 
              textDecoration: "none", 
              fontSize: 13, 
              fontWeight: 600 
            }}
          >
            {hasPrediction ? "Edit" : "Predict"}
          </Link>
        </div>
      )})}
    </div>
  );
}

const thStyle: React.CSSProperties = { padding: "8px 12px", textAlign: "center" };
const tdStyle: React.CSSProperties = { padding: "8px 12px", textAlign: "center" };
