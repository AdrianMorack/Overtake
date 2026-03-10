export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: User;
}

export interface Grid {
  id: string;
  name: string;
  code: string;
  ownerId: string;
  season: number;
  memberships?: GridMembership[];
}

export interface GridMembership {
  id: string;
  userId: string;
  gridId: string;
  user: Pick<User, "id" | "username" | "avatarUrl">;
}

export interface Driver {
  id: string;
  externalId: number | null;
  firstName: string;
  lastName: string;
  code: string;
  headshotUrl: string | null;
  team: Team | null;
}

export interface Team {
  id: string;
  name: string;
  color: string | null;
  drivers?: Driver[];
}

export interface RaceWeekend {
  id: string;
  season: number;
  round: number;
  raceName: string;
  circuitName: string;
  country: string;
  raceDate: string;
  qualifyingDate: string | null;
  predictionsLock: string;
  status: "UPCOMING" | "IN_PROGRESS" | "COMPLETED";
  results: RaceResult | null;
}

export interface RaceResult {
  id: string;
  qualiFirst: string;
  qualiSecond: string;
  qualiThird: string;
  raceFirst: string;
  raceSecond: string;
  raceThird: string;
  fastestLap: string;
  topTeam: string;
}

export interface Prediction {
  id: string;
  userId: string;
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
  totalPoints: number;
  breakdown: Record<string, number> | null;
  raceWeekend?: RaceWeekend;
  user?: Pick<User, "id" | "username" | "avatarUrl">;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatarUrl: string | null;
  totalPoints: number;
  racesPlayed: number;
}
