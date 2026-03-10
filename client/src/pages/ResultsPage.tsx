import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import { Prediction, RaceWeekend } from "../types";

export function ResultsPage() {
  const { gridId, raceId } = useParams<{ gridId: string; raceId: string }>();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [race, setRace] = useState<RaceWeekend | null>(null);

  useEffect(() => {
    if (!raceId || !gridId) return;
    api.getRacePredictions(raceId, gridId).then(setPredictions).catch(console.error);
    api.getRaceWeekends().then((weekends) => {
      setRace(weekends.find((w) => w.id === raceId) || null);
    });
  }, [raceId, gridId]);

  if (!race) return <p>Loading…</p>;

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: 24 }}>
      <Link to={`/grids/${gridId}`} style={{ color: "#e10600" }}>← Back to Grid</Link>
      <h2 style={{ marginTop: 16 }}>{race.raceName} — Results</h2>

      {race.results && (
        <div style={{ background: "#e8f5e9", padding: 16, borderRadius: 8, marginBottom: 24 }}>
          <h4>Official Results</h4>
          <p>Qualifying: {race.results.qualiFirst} / {race.results.qualiSecond} / {race.results.qualiThird}</p>
          <p>Race: {race.results.raceFirst} / {race.results.raceSecond} / {race.results.raceThird}</p>
          <p>Fastest Lap: {race.results.fastestLap} | Top Team: {race.results.topTeam}</p>
        </div>
      )}

      <h3>Player Predictions</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #e10600" }}>
            <th style={th}>Player</th>
            <th style={th}>Q1</th>
            <th style={th}>Q2</th>
            <th style={th}>Q3</th>
            <th style={th}>R1</th>
            <th style={th}>R2</th>
            <th style={th}>R3</th>
            <th style={th}>FL</th>
            <th style={th}>Team</th>
            <th style={th}>Pts</th>
          </tr>
        </thead>
        <tbody>
          {predictions.map((p) => (
            <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ ...td, fontWeight: 600 }}>{p.user?.username}</td>
              <td style={td}>{p.qualiFirst}</td>
              <td style={td}>{p.qualiSecond}</td>
              <td style={td}>{p.qualiThird}</td>
              <td style={td}>{p.raceFirst}</td>
              <td style={td}>{p.raceSecond}</td>
              <td style={td}>{p.raceThird}</td>
              <td style={td}>{p.fastestLap}</td>
              <td style={td}>{p.topTeam}</td>
              <td style={{ ...td, fontWeight: 700, color: "#e10600" }}>{p.totalPoints}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th: React.CSSProperties = { padding: "6px 8px", textAlign: "center" };
const td: React.CSSProperties = { padding: "6px 8px", textAlign: "center" };
