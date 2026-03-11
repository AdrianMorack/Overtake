import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Races } from './pages/Races';
import { RaceDetail } from './pages/RaceDetail';
import { Grids } from './pages/Grids';
import { GridLeaderboard } from './pages/GridLeaderboard';
import { Leaderboards } from './pages/Leaderboards';
import { Prediction } from './pages/Prediction';
import { Results } from './pages/Results';
import { LiveRace } from './pages/LiveRace';
import { Profile } from './pages/Profile';
import { JoinGrid } from './pages/JoinGrid';
import { CreateGrid } from './pages/CreateGrid';
import { NotFound } from './pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: Login,
  },
  {
    path: '/register',
    Component: Register,
  },
  {
    path: '/',
    Component: Layout,
    children: [
      {
        index: true,
        Component: Dashboard,
      },
      {
        path: 'dashboard',
        Component: Dashboard,
      },
      {
        path: 'races',
        Component: Races,
      },
      {
        path: 'races/:raceId',
        Component: RaceDetail,
      },
      {
        path: 'grids',
        Component: Grids,
      },
      {
        path: 'grids/join',
        Component: JoinGrid,
      },
      {
        path: 'grids/create',
        Component: CreateGrid,
      },
      {
        path: 'grids/:gridId',
        Component: GridLeaderboard,
      },
      {
        path: 'leaderboards',
        Component: Leaderboards,
      },
      {
        path: 'predict/:raceId',
        Component: Prediction,
      },
      {
        path: 'results/:raceId',
        Component: Results,
      },
      {
        path: 'live/:raceId',
        Component: LiveRace,
      },
      {
        path: 'profile',
        Component: Profile,
      },
      {
        path: '*',
        Component: NotFound,
      },
    ],
  },
]);