import { useEffect, useRef, useState } from "react";

export interface DriverLiveData {
  number: number;
  code: string;
  firstName: string;
  lastName: string;
  teamName: string;
  teamColor: string | null;
  position: number;
  gap: string;
  interval: string;
  lastLapTime: string | null;
  fastestLapTime: string | null;
  isFastest: boolean;
  pitStops: number;
  compound: string | null;
}

export interface RaceControlMsg {
  date: string;
  category: string;
  message: string;
  flag: string | null;
}

export interface WeatherSnapshot {
  airTemp: number;
  trackTemp: number;
  humidity: number;
  windSpeed: number;
  rainfall: boolean;
}

export interface LiveRaceSnapshot {
  sessionKey: number;
  sessionName: string;
  sessionType: string;
  isActive: boolean;
  updatedAt: string;
  drivers: DriverLiveData[];
  raceControl: RaceControlMsg[];
  weather: WeatherSnapshot | null;
  fastestLapDriverCode: string | null;
  topTeamByF1Points: string | null;
  totalLaps: number | null;
}

export interface PointBreakdownLive {
  qualiFirst: number;
  qualiSecond: number;
  qualiThird: number;
  raceFirst: number;
  raceSecond: number;
  raceThird: number;
  fastestLap: number;
  topTeam: number;
}

export interface UserLivePoints {
  userId: string;
  username: string;
  avatarUrl: string | null;
  livePoints: number;
  breakdown: PointBreakdownLive;
}

interface LiveRaceState {
  snapshot: LiveRaceSnapshot | null;
  livePoints: UserLivePoints[];
  connected: boolean;
  error: string | null;
}

const BASE_URL = import.meta.env.VITE_API_URL?.replace("/api", "") ?? "http://localhost:4000";

export function useLiveRace(raceWeekendId: string | undefined, gridId: string | undefined) {
  const [state, setState] = useState<LiveRaceState>({
    snapshot: null,
    livePoints: [],
    connected: false,
    error: null,
  });

  const esRef = useRef<EventSource | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!raceWeekendId) return;

    const token = localStorage.getItem("accessToken");
    if (!token) {
      setState((s) => ({ ...s, error: "Not authenticated" }));
      return;
    }

    let destroyed = false;

    function connect() {
      if (destroyed) return;

      const params = new URLSearchParams();
      if (gridId) params.set("gridId", gridId);
      // Pass token as query param because EventSource doesn't support custom headers
      params.set("token", token!);

      const url = `${BASE_URL}/api/live/${raceWeekendId}/stream?${params.toString()}`;
      const es = new EventSource(url);
      esRef.current = es;

      es.onopen = () => {
        if (!destroyed) setState((s) => ({ ...s, connected: true, error: null }));
      };

      es.onmessage = (event) => {
        if (destroyed) return;
        try {
          const data = JSON.parse(event.data) as {
            snapshot: LiveRaceSnapshot;
            livePoints: UserLivePoints[];
          };
          setState({
            snapshot: data.snapshot,
            livePoints: data.livePoints ?? [],
            connected: true,
            error: null,
          });
        } catch {
          // malformed event, ignore
        }
      };

      es.onerror = () => {
        es.close();
        esRef.current = null;
        if (!destroyed) {
          setState((s) => ({ ...s, connected: false }));
          // Reconnect after 5 s
          reconnectTimer.current = setTimeout(connect, 5_000);
        }
      };
    }

    connect();

    return () => {
      destroyed = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [raceWeekendId, gridId]);

  return state;
}
