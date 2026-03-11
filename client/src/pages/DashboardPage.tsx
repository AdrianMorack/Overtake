import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Grid, RaceWeekend } from "../types";
import { useAuth } from "../contexts/AuthContext";

export function DashboardPage() {
  const { user, logout } = useAuth();
  const [grids, setGrids] = useState<Grid[]>([]);
  const [nextRace, setNextRace] = useState<RaceWeekend | null>(null);

  useEffect(() => {
    api.getGrids().then(setGrids).catch(console.error);
    api.getRaceWeekends().then((weekends) => {
      const upcoming = weekends.find((w) => w.status === "UPCOMING");
      setNextRace(upcoming || null);
    }).catch(console.error);
  }, []);

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>🏁 Dashboard</h1>
        <div>
          <span style={{ marginRight: 12 }}>{user?.username}</span>
          <button onClick={logout} style={{ padding: "6px 12px", cursor: "pointer" }}>Logout</button>
        </div>
      </div>

      {nextRace && (
        <div style={{ 
          background: "#d4edda", 
          borderLeft: "4px solid #28a745",
          padding: 16, 
          borderRadius: 8, 
          marginBottom: 24 
        }}>
          <h3 style={{ color: "#155724" }}>Next Race: {nextRace.raceName}</h3>
          <p>{nextRace.circuitName} — {new Date(nextRace.raceDate).toLocaleDateString()}</p>
          <p style={{ fontSize: 13, color: "#155724" }}>
            Predictions lock: {new Date(nextRace.predictionsLock).toLocaleString()}
          </p>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <Link to="/grids/create" style={linkBtnStyle}>Create Grid</Link>
        <Link to="/grids/join" style={linkBtnStyle}>Join Grid</Link>
      </div>

      <h2>Your Grids</h2>
      {grids.length === 0 ? (
        <p>You haven't joined any grids yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {grids.map((g) => (
            <li key={g.id} style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 8 }}>
              <Link to={`/grids/${g.id}`} style={{ textDecoration: "none", color: "#333" }}>
                <strong>{g.name}</strong>
                <span style={{ marginLeft: 12, color: "#888", fontSize: 13 }}>Code: {g.code}</span>
                <span style={{ marginLeft: 12, color: "#888", fontSize: 13 }}>
                  {g.memberships?.length || 0} members
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <h2 style={{ marginTop: 32 }}>Race Calendar</h2>
      <Link to="/races" style={{ color: "#e10600" }}>View full schedule →</Link>
    </div>
  );
}

const linkBtnStyle: React.CSSProperties = {
  padding: "8px 16px",
  background: "#e10600",
  color: "#fff",
  borderRadius: 6,
  textDecoration: "none",
  fontWeight: 600,
};
