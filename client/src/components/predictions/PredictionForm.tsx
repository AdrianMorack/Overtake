import React, { useState, useEffect } from "react";
import { api } from "../../api/client";
import { Driver, Team } from "../../types";
import { DriverAutocomplete } from "../common/DriverAutocomplete";
import { TeamAutocomplete } from "../common/TeamAutocomplete";

interface Props {
  raceWeekendId: string;
  gridId: string;
  onSuccess: () => void;
}

export function PredictionForm({ raceWeekendId, gridId, onSuccess }: Props) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    qualiFirst: "",
    qualiSecond: "",
    qualiThird: "",
    raceFirst: "",
    raceSecond: "",
    raceThird: "",
    fastestLap: "",
    topTeam: "",
  });

  useEffect(() => {
    Promise.all([api.getDrivers(), api.getTeams()]).then(([d, t]) => {
      setDrivers(d);
      setTeams(t);
    });
  }, []);

  const setField = (field: keyof typeof form) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const allFilled = Object.values(form).every((v) => v.length > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allFilled) return;
    setLoading(true);
    setError("");
    try {
      await api.submitPrediction({ raceWeekendId, gridId, ...form });
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
      <h3>Qualifying Predictions</h3>
      <DriverAutocomplete drivers={drivers} value={form.qualiFirst} onChange={setField("qualiFirst")} label="P1 — Pole Position" />
      <DriverAutocomplete drivers={drivers} value={form.qualiSecond} onChange={setField("qualiSecond")} label="P2" />
      <DriverAutocomplete drivers={drivers} value={form.qualiThird} onChange={setField("qualiThird")} label="P3" />

      <h3 style={{ marginTop: 24 }}>Race Predictions</h3>
      <DriverAutocomplete drivers={drivers} value={form.raceFirst} onChange={setField("raceFirst")} label="P1 — Winner" />
      <DriverAutocomplete drivers={drivers} value={form.raceSecond} onChange={setField("raceSecond")} label="P2" />
      <DriverAutocomplete drivers={drivers} value={form.raceThird} onChange={setField("raceThird")} label="P3" />

      <h3 style={{ marginTop: 24 }}>Bonus Predictions</h3>
      <DriverAutocomplete drivers={drivers} value={form.fastestLap} onChange={setField("fastestLap")} label="Fastest Lap" />
      <TeamAutocomplete teams={teams} value={form.topTeam} onChange={setField("topTeam")} label="Team with Most Points" />

      {error && <p style={{ color: "red" }}>{error}</p>}

      <button
        type="submit"
        disabled={!allFilled || loading}
        style={{
          marginTop: 16,
          padding: "10px 24px",
          background: allFilled ? "#e10600" : "#ccc",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontSize: 16,
          fontWeight: 700,
          cursor: allFilled ? "pointer" : "not-allowed",
        }}
      >
        {loading ? "Submitting…" : "Submit Predictions"}
      </button>
    </form>
  );
}
