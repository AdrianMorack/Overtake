import React from "react";
import { useParams, Link } from "react-router-dom";
import {
  useLiveRace,
  DriverLiveData,
  RaceControlMsg,
  UserLivePoints,
  WeatherSnapshot,
} from "../hooks/useLiveRace";

// ─── Sub-components ────────────────────────────────────────────────────────────

function CompoundBadge({ compound }: { compound: string | null }) {
  const colours: Record<string, string> = {
    SOFT: "#e8002d",
    MEDIUM: "#ffd700",
    HARD: "#ebebeb",
    INTERMEDIATE: "#43b02a",
    WET: "#0067ff",
  };
  if (!compound) return null;
  return (
    <span
      style={{
        display: "inline-block",
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: colours[compound] ?? "#999",
        border: "1px solid rgba(0,0,0,.2)",
        marginRight: 4,
      }}
      title={compound}
    />
  );
}

function TimingTower({ drivers }: { drivers: DriverLiveData[] }) {
  return (
    <div style={{ flex: "0 0 auto", minWidth: 360 }}>
      <h3 style={sectionHeading}>Timing Tower</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #e10600", color: "#888" }}>
            <th style={th}>P</th>
            <th style={{ ...th, textAlign: "left" }}>Driver</th>
            <th style={th}>Gap</th>
            <th style={{ ...th, minWidth: 70 }}>Last Lap</th>
            <th style={th}>Pit</th>
          </tr>
        </thead>
        <tbody>
          {drivers.map((d) => (
            <tr
              key={d.number}
              style={{
                borderBottom: "1px solid #222",
                background: d.isFastest ? "rgba(167,0,255,.08)" : "transparent",
              }}
            >
              <td style={{ ...td, fontWeight: 700, color: "#e10600" }}>{d.position}</td>
              <td style={{ ...td, textAlign: "left" }}>
                <span
                  style={{
                    display: "inline-block",
                    width: 3,
                    height: 16,
                    background: d.teamColor ?? "#555",
                    borderRadius: 2,
                    marginRight: 8,
                    verticalAlign: "middle",
                  }}
                />
                <span style={{ fontWeight: 600 }}>{d.code}</span>
                <span style={{ color: "#888", marginLeft: 6, fontSize: 11 }}>{d.teamName}</span>
              </td>
              <td style={{ ...td, fontFamily: "monospace" }}>
                {d.gap || "—"}
              </td>
              <td style={{ ...td, fontFamily: "monospace" }}>
                <CompoundBadge compound={d.compound} />
                {d.isFastest ? (
                  <span style={{ color: "#a700ff", fontWeight: 700 }}>
                    {d.fastestLapTime ?? d.lastLapTime ?? "—"}
                  </span>
                ) : (
                  d.lastLapTime ?? "—"
                )}
              </td>
              <td style={td}>{d.pitStops > 0 ? `×${d.pitStops}` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LivePointsTable({
  points,
  maxPoints,
}: {
  points: UserLivePoints[];
  maxPoints: number;
}) {
  const sorted = [...points].sort((a, b) => b.livePoints - a.livePoints);
  return (
    <div style={{ flex: "1 1 260px", minWidth: 240 }}>
      <h3 style={sectionHeading}>Live Points</h3>
      {sorted.length === 0 ? (
        <p style={{ color: "#888", fontSize: 13 }}>No predictions found for this grid.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {sorted.map((entry, i) => (
            <div
              key={entry.userId}
              style={{
                background: "#111",
                borderRadius: 6,
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ width: 20, color: "#888", fontSize: 12 }}>{i + 1}</span>
              <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{entry.username}</span>
              <span
                style={{ fontWeight: 700, fontSize: 15, color: "#e10600", minWidth: 30, textAlign: "right" }}
              >
                {entry.livePoints}
              </span>
              {/* Progress bar */}
              <div
                style={{
                  width: 60,
                  height: 6,
                  background: "#333",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    background: "#e10600",
                    width: maxPoints > 0 ? `${(entry.livePoints / maxPoints) * 100}%` : "0%",
                    borderRadius: 3,
                    transition: "width .4s ease",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RaceControlFeed({ messages }: { messages: RaceControlMsg[] }) {
  const flagColor: Record<string, string> = {
    GREEN: "#43b02a",
    YELLOW: "#ffd700",
    "DOUBLE YELLOW": "#ffa500",
    RED: "#e10600",
    CHEQUERED: "#fff",
    BLUE: "#0067ff",
    SC: "#ffa500",
    VSC: "#ffa500",
  };

  return (
    <div>
      <h3 style={sectionHeading}>Race Control</h3>
      <div
        style={{
          maxHeight: 160,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {messages.length === 0 ? (
          <p style={{ color: "#888", fontSize: 13 }}>No messages yet.</p>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              style={{
                background: "#111",
                borderRadius: 4,
                padding: "5px 10px",
                fontSize: 12,
                display: "flex",
                gap: 10,
                alignItems: "center",
              }}
            >
              <span style={{ color: "#555", fontFamily: "monospace", flexShrink: 0 }}>
                {new Date(msg.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
              {msg.flag && (
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: flagColor[msg.flag] ?? "#888",
                    flexShrink: 0,
                  }}
                />
              )}
              <span style={{ color: "#ddd" }}>{msg.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function WeatherBar({ weather }: { weather: WeatherSnapshot }) {
  return (
    <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#aaa", flexWrap: "wrap" }}>
      <span>🌡 Track {weather.trackTemp}°C</span>
      <span>💨 Air {weather.airTemp}°C</span>
      <span>💧 Humidity {weather.humidity}%</span>
      <span>🌬 Wind {weather.windSpeed} m/s</span>
      {weather.rainfall && <span style={{ color: "#0af" }}>🌧 Rain</span>}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function LiveRacePage() {
  const { gridId, raceWeekendId } = useParams<{
    gridId: string;
    raceWeekendId: string;
  }>();

  const { snapshot, livePoints, connected, error } = useLiveRace(raceWeekendId, gridId);

  const maxPoints = livePoints.length > 0 ? Math.max(...livePoints.map((p) => p.livePoints), 1) : 1;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "#fff",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#111",
          borderBottom: "2px solid #e10600",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <Link
          to={`/grids/${gridId}`}
          style={{ color: "#e10600", fontSize: 13, textDecoration: "none" }}
        >
          ← Grid
        </Link>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>
            {snapshot?.sessionName ?? "Live Race"}
            <span
              style={{
                marginLeft: 10,
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 10,
                background: connected && snapshot?.isActive ? "#e10600" : "#444",
                fontWeight: 600,
              }}
            >
              {connected && snapshot?.isActive ? "● LIVE" : connected ? "CONNECTED" : "CONNECTING…"}
            </span>
          </h2>
          {snapshot?.weather && (
            <div style={{ marginTop: 4 }}>
              <WeatherBar weather={snapshot.weather} />
            </div>
          )}
        </div>
        {snapshot && (
          <div style={{ fontSize: 12, color: "#888", textAlign: "right" }}>
            <div>Updated {new Date(snapshot.updatedAt).toLocaleTimeString()}</div>
            {snapshot.fastestLapDriverCode && (
              <div style={{ color: "#a700ff" }}>FL: {snapshot.fastestLapDriverCode}</div>
            )}
            {snapshot.topTeamByF1Points && (
              <div style={{ color: "#ffd700" }}>Top Team: {snapshot.topTeamByF1Points}</div>
            )}
          </div>
        )}
      </div>

      {/* Main content */}
      <div style={{ padding: 24 }}>
        {error && (
          <div
            style={{
              background: "#3a0000",
              border: "1px solid #e10600",
              borderRadius: 6,
              padding: "10px 16px",
              marginBottom: 16,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {!snapshot && !error && (
          <div style={{ textAlign: "center", padding: 60, color: "#888" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <p>Waiting for live data…</p>
          </div>
        )}

        {snapshot && (
          <>
            {/* Timing + Points row */}
            <div
              style={{
                display: "flex",
                gap: 24,
                flexWrap: "wrap",
                alignItems: "flex-start",
                marginBottom: 24,
              }}
            >
              <TimingTower drivers={snapshot.drivers} />
              <LivePointsTable points={livePoints} maxPoints={maxPoints} />
            </div>

            {/* Race Control */}
            <RaceControlFeed messages={snapshot.raceControl} />
          </>
        )}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const sectionHeading: React.CSSProperties = {
  margin: "0 0 10px",
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "#e10600",
};

const th: React.CSSProperties = {
  padding: "6px 8px",
  textAlign: "center",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
};

const td: React.CSSProperties = {
  padding: "7px 8px",
  textAlign: "center",
};
