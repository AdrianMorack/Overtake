export interface Driver {
  id: string;
  name: string;
  code: string;
  team: string;
  number: number;
  teamColor: string;
}

export interface Race {
  id: string;
  name: string;
  location: string;
  country: string;
  date: string;
  status: 'upcoming' | 'live' | 'completed';
  round: number;
}

export interface Grid {
  id: string;
  name: string;
  members: number;
  isAdmin: boolean;
  code: string;
}

export interface Prediction {
  raceId: string;
  qualifyingP1?: string;
  qualifyingP2?: string;
  qualifyingP3?: string;
  raceP1?: string;
  raceP2?: string;
  raceP3?: string;
  fastestLap?: string;
  topTeam?: string;
  submitted: boolean;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  points: number;
  racesPlayed: number;
  avatar?: string;
}

export const drivers: Driver[] = [
  { id: '1', name: 'Max Verstappen', code: 'VER', team: 'Red Bull Racing', number: 1, teamColor: '#0600ef' },
  { id: '2', name: 'Sergio Pérez', code: 'PER', team: 'Red Bull Racing', number: 11, teamColor: '#0600ef' },
  { id: '3', name: 'Lewis Hamilton', code: 'HAM', team: 'Mercedes', number: 44, teamColor: '#00d2be' },
  { id: '4', name: 'George Russell', code: 'RUS', team: 'Mercedes', number: 63, teamColor: '#00d2be' },
  { id: '5', name: 'Charles Leclerc', code: 'LEC', team: 'Ferrari', number: 16, teamColor: '#dc0000' },
  { id: '6', name: 'Carlos Sainz', code: 'SAI', team: 'Ferrari', number: 55, teamColor: '#dc0000' },
  { id: '7', name: 'Lando Norris', code: 'NOR', team: 'McLaren', number: 4, teamColor: '#ff8700' },
  { id: '8', name: 'Oscar Piastri', code: 'PIA', team: 'McLaren', number: 81, teamColor: '#ff8700' },
  { id: '9', name: 'Fernando Alonso', code: 'ALO', team: 'Aston Martin', number: 14, teamColor: '#006f62' },
  { id: '10', name: 'Lance Stroll', code: 'STR', team: 'Aston Martin', number: 18, teamColor: '#006f62' },
  { id: '11', name: 'Pierre Gasly', code: 'GAS', team: 'Alpine', number: 10, teamColor: '#0090ff' },
  { id: '12', name: 'Esteban Ocon', code: 'OCO', team: 'Alpine', number: 31, teamColor: '#0090ff' },
  { id: '13', name: 'Alexander Albon', code: 'ALB', team: 'Williams', number: 23, teamColor: '#005aff' },
  { id: '14', name: 'Logan Sargeant', code: 'SAR', team: 'Williams', number: 2, teamColor: '#005aff' },
  { id: '15', name: 'Valtteri Bottas', code: 'BOT', team: 'Alfa Romeo', number: 77, teamColor: '#900000' },
  { id: '16', name: 'Zhou Guanyu', code: 'ZHO', team: 'Alfa Romeo', number: 24, teamColor: '#900000' },
  { id: '17', name: 'Kevin Magnussen', code: 'MAG', team: 'Haas', number: 20, teamColor: '#ffffff' },
  { id: '18', name: 'Nico Hülkenberg', code: 'HUL', team: 'Haas', number: 27, teamColor: '#ffffff' },
  { id: '19', name: 'Yuki Tsunoda', code: 'TSU', team: 'AlphaTauri', number: 22, teamColor: '#2b4562' },
  { id: '20', name: 'Daniel Ricciardo', code: 'RIC', team: 'AlphaTauri', number: 3, teamColor: '#2b4562' },
];

export const races: Race[] = [
  { id: '1', name: 'Bahrain Grand Prix', location: 'Sakhir', country: 'Bahrain', date: '2026-03-15', status: 'completed', round: 1 },
  { id: '2', name: 'Saudi Arabian Grand Prix', location: 'Jeddah', country: 'Saudi Arabia', date: '2026-03-22', status: 'completed', round: 2 },
  { id: '3', name: 'Australian Grand Prix', location: 'Melbourne', country: 'Australia', date: '2026-04-05', status: 'completed', round: 3 },
  { id: '4', name: 'Japanese Grand Prix', location: 'Suzuka', country: 'Japan', date: '2026-04-19', status: 'live', round: 4 },
  { id: '5', name: 'Chinese Grand Prix', location: 'Shanghai', country: 'China', date: '2026-04-26', status: 'upcoming', round: 5 },
  { id: '6', name: 'Miami Grand Prix', location: 'Miami', country: 'USA', date: '2026-05-03', status: 'upcoming', round: 6 },
  { id: '7', name: 'Emilia Romagna Grand Prix', location: 'Imola', country: 'Italy', date: '2026-05-17', status: 'upcoming', round: 7 },
  { id: '8', name: 'Monaco Grand Prix', location: 'Monte Carlo', country: 'Monaco', date: '2026-05-24', status: 'upcoming', round: 8 },
];

export const myGrids: Grid[] = [
  { id: '1', name: 'Office Champions', members: 12, isAdmin: true, code: 'OFF2024' },
  { id: '2', name: 'F1 Fanatics', members: 45, isAdmin: false, code: 'FAN2024' },
  { id: '3', name: 'Family Grid', members: 6, isAdmin: true, code: 'FAM2024' },
];

export const leaderboardData: LeaderboardEntry[] = [
  { id: '1', name: 'You', points: 156, racesPlayed: 4 },
  { id: '2', name: 'Sarah Mitchell', points: 148, racesPlayed: 4 },
  { id: '3', name: 'James Chen', points: 142, racesPlayed: 4 },
  { id: '4', name: 'Emma Rodriguez', points: 138, racesPlayed: 4 },
  { id: '5', name: 'Marcus Johnson', points: 135, racesPlayed: 3 },
  { id: '6', name: 'Olivia Smith', points: 128, racesPlayed: 4 },
  { id: '7', name: 'Liam Brown', points: 122, racesPlayed: 4 },
  { id: '8', name: 'Sophia Taylor', points: 118, racesPlayed: 3 },
  { id: '9', name: 'Noah Williams', points: 112, racesPlayed: 4 },
  { id: '10', name: 'Ava Davis', points: 105, racesPlayed: 3 },
  { id: '11', name: 'Ethan Martinez', points: 98, racesPlayed: 4 },
  { id: '12', name: 'Isabella Wilson', points: 85, racesPlayed: 2 },
];

export const teams = [
  { id: 'red-bull', name: 'Red Bull Racing' },
  { id: 'ferrari', name: 'Ferrari' },
  { id: 'mercedes', name: 'Mercedes' },
  { id: 'mclaren', name: 'McLaren' },
  { id: 'aston-martin', name: 'Aston Martin' },
  { id: 'alpine', name: 'Alpine' },
  { id: 'williams', name: 'Williams' },
  { id: 'alfa-romeo', name: 'Alfa Romeo' },
  { id: 'haas', name: 'Haas' },
  { id: 'alphatauri', name: 'AlphaTauri' },
];

export const liveRaceData = [
  { position: 1, driver: 'VER', name: 'Max Verstappen', team: 'Red Bull Racing', gap: 'LEADER', teamColor: '#0600ef' },
  { position: 2, driver: 'LEC', name: 'Charles Leclerc', team: 'Ferrari', gap: '+2.341s', teamColor: '#dc0000' },
  { position: 3, driver: 'NOR', name: 'Lando Norris', team: 'McLaren', gap: '+5.892s', teamColor: '#ff8700' },
  { position: 4, driver: 'HAM', name: 'Lewis Hamilton', team: 'Mercedes', gap: '+8.124s', teamColor: '#00d2be' },
  { position: 5, driver: 'SAI', name: 'Carlos Sainz', team: 'Ferrari', gap: '+12.567s', teamColor: '#dc0000' },
  { position: 6, driver: 'RUS', name: 'George Russell', team: 'Mercedes', gap: '+15.891s', teamColor: '#00d2be' },
  { position: 7, driver: 'PIA', name: 'Oscar Piastri', team: 'McLaren', gap: '+18.234s', teamColor: '#ff8700' },
  { position: 8, driver: 'ALO', name: 'Fernando Alonso', team: 'Aston Martin', gap: '+22.456s', teamColor: '#006f62' },
  { position: 9, driver: 'PER', name: 'Sergio Pérez', team: 'Red Bull Racing', gap: '+28.789s', teamColor: '#0600ef' },
  { position: 10, driver: 'GAS', name: 'Pierre Gasly', team: 'Alpine', gap: '+32.123s', teamColor: '#0090ff' },
];
