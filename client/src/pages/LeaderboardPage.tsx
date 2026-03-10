import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import { LeaderboardEntry, RaceWeekend } from "../types";

export function LeaderboardPage() {
  const { gridId } = useParams<{ gridId: string }>();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [races, setRaces] = useState<RaceWeekend[]>([]);

  useEffect(() => {
    if (!gridId) return;
    api.getLeaderboard(gridId).then(setEntries).catch(console.error);
    api.getRaceWeekends().then(setRaces).catch(console.error);
  }, [gridId]);

  const upcomingRaces = races.filter((r) => r.status === "UPCOMING");
  const liveRaces     = races.filter((r) => r.status === "IN_PROGRESS");

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 24 }}>
      <Link to="/dashboard" style={{ color: "#e10600" }}>← Dashboard</Link>
      <h2 style={{ marginTop: 16 }}>Grid Leaderboard</h2>

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
      {upcomingRaces.map((r) => (
        <div key={r.id} style={{ background: "#f5f5f5", padding: 12, borderRadius: 6, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong>{r.raceName}</strong>
            <span style={{ marginLeft: 8, fontSize: 13, color: "#666" }}>
              {new Date(r.raceDate).toLocaleDateString()}
            </span>
          </div>
          <Link
            to={`/grids/${gridId}/race/${r.id}/predict`}
            style={{ padding: "6px 12px", background: "#e10600", color: "#fff", borderRadius: 4, textDecoration: "none", fontSize: 13, fontWeight: 600 }}
          >
            Predict
          </Link>
        </div>
      ))}
    </div>
  );
}

const thStyle: React.CSSProperties = { padding: "8px 12px", textAlign: "center" };
const tdStyle: React.CSSProperties = { padding: "8px 12px", textAlign: "center" };
