import { AuthResponse, AuthTokens, Driver, Grid, LeaderboardEntry, Prediction, RaceWeekend, StandingsData, Team } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private onAuthFailure?: () => void;

  setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
    localStorage.setItem("accessToken", access);
    localStorage.setItem("refreshToken", refresh);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }

  loadStoredTokens() {
    this.accessToken = localStorage.getItem("accessToken");
    this.refreshToken = localStorage.getItem("refreshToken");
  }

  onAuthError(callback: () => void) {
    this.onAuthFailure = callback;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    let res = await fetch(`${API_URL}${path}`, { ...options, headers });

    // If 401 and we have a refresh token, try to refresh
    if (res.status === 401 && this.refreshToken) {
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        headers["Authorization"] = `Bearer ${this.accessToken}`;
        res = await fetch(`${API_URL}${path}`, { ...options, headers });
      }
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) this.onAuthFailure?.();
      throw new Error(body.error || `Request failed: ${res.status}`);
    }

    // Handle 204 No Content responses (e.g., delete operations)
    if (res.status === 204) {
      return undefined as T;
    }

    return res.json();
  }

  private async tryRefresh(): Promise<boolean> {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
      if (!res.ok) return false;
      const data: AuthTokens = await res.json();
      this.setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  register(email: string, username: string, password: string) {
    return this.request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, username, password }),
    });
  }

  login(email: string, password: string) {
    return this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  logout() {
    const body = JSON.stringify({ refreshToken: this.refreshToken });
    this.clearTokens();
    return this.request("/auth/logout", { method: "POST", body });
  }

  updateProfile(data: { favoriteTeam: string }) {
    return this.request<{ user: { favoriteTeam: string } }>("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // ── Grids ─────────────────────────────────────────────────────────────────
  getGrids() {
    return this.request<Grid[]>("/grids");
  }

  createGrid(name: string, season?: number) {
    return this.request<Grid>("/grids", {
      method: "POST",
      body: JSON.stringify({ name, season }),
    });
  }

  joinGrid(code: string) {
    return this.request<Grid>("/grids/join", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  }

  getLeaderboard(gridId: string) {
    return this.request<LeaderboardEntry[]>(`/grids/${encodeURIComponent(gridId)}/leaderboard`);
  }

  getGrid(gridId: string) {
    return this.request<Grid>(`/grids/${encodeURIComponent(gridId)}`);
  }

  updateGrid(gridId: string, data: { name: string }) {
    return this.request<Grid>(`/grids/${encodeURIComponent(gridId)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  deleteGrid(gridId: string) {
    return this.request(`/grids/${encodeURIComponent(gridId)}`, {
      method: "DELETE",
    });
  }

  kickMember(gridId: string, userId: string) {
    return this.request(`/grids/${encodeURIComponent(gridId)}/members/${encodeURIComponent(userId)}`, {
      method: "DELETE",
    });
  }

  approveMember(gridId: string, userId: string) {
    return this.request(`/grids/${encodeURIComponent(gridId)}/members/${encodeURIComponent(userId)}/approve`, {
      method: "POST",
    });
  }

  // ── Races ─────────────────────────────────────────────────────────────────
  getRaceWeekends(season: number = new Date().getFullYear()) {
    return this.request<RaceWeekend[]>(`/races/weekends?season=${season}`);
  }

  getDrivers(season?: number) {
    const params = season ? `?season=${season}` : "";
    return this.request<Driver[]>(`/races/drivers${params}`);
  }

  getTeams(season?: number) {
    const params = season ? `?season=${season}` : "";
    return this.request<Team[]>(`/races/teams${params}`);
  }

  // ── Predictions ───────────────────────────────────────────────────────────
  submitPrediction(data: {
    raceWeekendId: string;
    gridId: string;
    qualiFirst: string;
    qualiSecond: string;
    qualiThird: string;
    raceFirst: string;
    raceSecond: string;
    raceThird: string;
    fastestLap: string;
    topTeam: string;
    applyToAllGrids?: boolean;
  }) {
    return this.request<Prediction | Prediction[]>("/predictions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  getMyPredictions(gridId: string) {
    return this.request<Prediction[]>(`/predictions/grid/${encodeURIComponent(gridId)}`);
  }

  getRacePredictions(raceWeekendId: string, gridId: string) {
    return this.request<Prediction[]>(
      `/predictions/race/${encodeURIComponent(raceWeekendId)}/grid/${encodeURIComponent(gridId)}`
    );
  }

  // ── Standings ─────────────────────────────────────────────────────────────
  getStandings(season?: number) {
    const params = season ? `?season=${season}` : "";
    return this.request<StandingsData>(`/races/standings${params}`);
  }
}

export const api = new ApiClient();
