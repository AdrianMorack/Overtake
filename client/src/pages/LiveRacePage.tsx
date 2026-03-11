import { useParams, Link } from "react-router-dom";
import {
  useLiveRace,
  DriverLiveData,
  RaceControlMsg,
  UserLivePoints,
  WeatherSnapshot,
} from "../hooks/useLiveRace";


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

// ─── Sub-components ───────────────────────────────────────────────────────────

function WeatherBar({ weather }: { weather: WeatherSnapshot }) {
  return (
    <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#ccc", flexWrap: "wrap" }}>
      <span>Air: {weather.airTemp.toFixed(1)}°C</span>
      <span>Track: {weather.trackTemp.toFixed(1)}°C</span>
      <span>Humidity: {weather.humidity.toFixed(0)}%</span>
      <span>Wind: {weather.windSpeed.toFixed(1)} m/s</span>
      {weather.rainfall && <span style={{ color: "#4fc3f7" }}>🌧 Rain</span>}
    </div>
  );
}

function TimingTower({ drivers }: { drivers: DriverLiveData[] }) {
  const sorted = [...drivers].sort((a, b) => a.position - b.position);
  return (
    <div style={{ flex: "1 1 340px", background: "#111", borderRadius: 8, overflow: "hidden" }}>
      <h3 style={sectionHeading}>Timing Tower</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #333" }}>
            <th style={th}>POS</th>
            <th style={{ ...th, textAlign: "left" }}>Driver</th>
            <th style={th}>Gap</th>
            <th style={th}>Interval</th>
            <th style={th}>Last Lap</th>
            <th style={th}>Tyre</th>
            <th style={th}>Pits</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((d) => (
            <tr key={d.number} style={{ borderBottom: "1px solid #1a1a1a" }}>
              <td style={td}>{d.position}</td>
              <td style={{ ...td, textAlign: "left" }}>
                <span
                  style={{
                    display: "inline-block",
                    width: 3,
                    height: 14,
                    background: d.teamColor ?? "#888",
                    borderRadius: 2,
                    marginRight: 6,
                    verticalAlign: "middle",
                  }}
                />
                <span style={{ color: d.isFastest ? "#a700ff" : undefined }}>{d.code}</span>
              </td>
              <td style={td}>{d.gap}</td>
              <td style={td}>{d.interval}</td>
              <td style={{ ...td, color: d.isFastest ? "#a700ff" : undefined }}>
                {d.lastLapTime ?? "—"}
              </td>
              <td style={td}>{d.compound ?? "—"}</td>
              <td style={td}>{d.pitStops}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LivePointsTable({ points, maxPoints }: { points: UserLivePoints[]; maxPoints: number }) {
  const sorted = [...points].sort((a, b) => b.livePoints - a.livePoints);
  return (
    <div style={{ flex: "1 1 260px", background: "#111", borderRadius: 8, overflow: "hidden" }}>
      <h3 style={sectionHeading}>Live Points</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #333" }}>
            <th style={th}>#</th>
            <th style={{ ...th, textAlign: "left" }}>User</th>
            <th style={th}>Pts</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, i) => (
            <tr key={p.userId} style={{ borderBottom: "1px solid #1a1a1a" }}>
              <td style={td}>{i + 1}</td>
              <td style={{ ...td, textAlign: "left" }}>{p.username}</td>
              <td style={td}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      height: 6,
                      width: Math.max(4, (p.livePoints / maxPoints) * 80),
                      background: "#e10600",
                      borderRadius: 3,
                    }}
                  />
                  {p.livePoints}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RaceControlFeed({ messages }: { messages: RaceControlMsg[] }) {
  const flagColors: Record<string, string> = {
    GREEN: "#00c853",
    YELLOW: "#ffd600",
    RED: "#e10600",
    SC: "#ff9800",
    VSC: "#ff9800",
    BLUE: "#2979ff",
    CHEQUERED: "#fff",
  };
  return (
    <div style={{ background: "#111", borderRadius: 8, padding: "12px 16px" }}>
      <h3 style={sectionHeading}>Race Control</h3>
      {messages.length === 0 && <p style={{ color: "#555", fontSize: 12 }}>No messages yet.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {[...messages].reverse().map((m, i) => (
          <div
            key={i}
            style={{
              fontSize: 12,
              padding: "6px 10px",
              borderRadius: 4,
              background: "#1a1a1a",
              borderLeft: `3px solid ${m.flag ? (flagColors[m.flag] ?? "#555") : "#555"}`,
            }}
          >
            <span style={{ color: "#666", marginRight: 8 }}>
              {new Date(m.date).toLocaleTimeString()}
            </span>
            {m.flag && (
              <span
                style={{
                  marginRight: 8,
                  padding: "1px 6px",
                  borderRadius: 3,
                  background: flagColors[m.flag] ?? "#555",
                  color: "#000",
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {m.flag}
              </span>
            )}
            {m.message}
          </div>
        ))}
      </div>
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


