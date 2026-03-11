import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { RaceWeekend } from "../types";

export function RacesPage() {
  const [races, setRaces] = useState<RaceWeekend[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getRaceWeekends()
      .then(setRaces)
      .catch((e) => setError(e.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 24 }}>
      <Link to="/dashboard" style={{ color: "#e10600" }}>← Dashboard</Link>
      <h2 style={{ marginTop: 16 }}>Race Calendar</h2>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {!loading && !error && races.length === 0 && <p>No races found.</p>}

      {races.map((r) => (
        <div
          key={r.id}
          style={{
            background: r.status === "COMPLETED" ? "#f0f0f0" : "#fff",
            border: "1px solid #ddd",
            borderLeft: `4px solid ${r.status === "COMPLETED" ? "#28a745" : r.status === "IN_PROGRESS" ? "#ffc107" : "#e10600"}`,
            borderRadius: 6,
            padding: 16,
            marginBottom: 8,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <strong>Round {r.round}: {r.raceName}</strong>
              <p style={{ margin: "4px 0", fontSize: 13, color: "#666" }}>
                {r.circuitName} — {new Date(r.raceDate).toLocaleDateString()}
              </p>
            </div>
            <span
              style={{
                padding: "4px 8px",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                background: r.status === "COMPLETED" ? "#d4edda" : r.status === "IN_PROGRESS" ? "#fff3cd" : "#f8d7da",
                color: r.status === "COMPLETED" ? "#155724" : r.status === "IN_PROGRESS" ? "#856404" : "#721c24",
              }}
            >
              {r.status}
            </span>
          </div>

          {r.status === "COMPLETED" && r.results && (
            <div style={{ marginTop: 8, padding: 8, background: "#e8f5e9", borderRadius: 4, fontSize: 13 }}>
              Race: {r.results.raceFirst} / {r.results.raceSecond} / {r.results.raceThird} &nbsp;|&nbsp;
              Fastest Lap: {r.results.fastestLap} &nbsp;|&nbsp;
              Top Team: {r.results.topTeam}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
