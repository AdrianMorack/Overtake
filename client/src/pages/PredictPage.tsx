import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api/client";
import { RaceWeekend } from "../types";
import { PredictionForm } from "../components/predictions/PredictionForm";

export function PredictPage() {
  const { gridId, raceId } = useParams<{ gridId: string; raceId: string }>();
  const navigate = useNavigate();
  const [race, setRace] = useState<RaceWeekend | null>(null);

  useEffect(() => {
    if (!raceId) return;
    api.getRaceWeekends().then((weekends) => {
      setRace(weekends.find((w) => w.id === raceId) || null);
    });
  }, [raceId]);

  if (!race || !gridId || !raceId) return <p>Loading…</p>;

  const locked = new Date() > new Date(race.predictionsLock);

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: 24 }}>
      <Link to={`/grids/${gridId}`} style={{ color: "#e10600" }}>← Back to Grid</Link>
      <h2 style={{ marginTop: 16 }}>{race.raceName}</h2>
      <p>{race.circuitName} — {new Date(race.raceDate).toLocaleDateString()}</p>

      {locked ? (
        <div style={{ background: "#fff3cd", padding: 16, borderRadius: 8 }}>
          <strong>Predictions are locked for this race.</strong>
        </div>
      ) : (
        <PredictionForm
          raceWeekendId={raceId}
          gridId={gridId}
          onSuccess={() => navigate(`/grids/${gridId}`)}
        />
      )}
    </div>
  );
}
