import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Layout } from "./components/layout/Layout";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import { DashboardPage } from "./pages/DashboardPage";
import { CreateGridPage, JoinGridPage } from "./pages/GridPages";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { PredictPage } from "./pages/PredictPage";
import { RacesPage } from "./pages/RacesPage";
import { ResultsPage } from "./pages/ResultsPage";
import { LiveRacePage } from "./pages/LiveRacePage";

function ProtectedLayout() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground telemetry-text">LOADING…</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/races" element={<RacesPage />} />
        <Route path="/grids/create" element={<CreateGridPage />} />
        <Route path="/grids/join" element={<JoinGridPage />} />
        <Route path="/grids/:gridId" element={<LeaderboardPage />} />
        <Route path="/grids/:gridId/race/:raceId/predict" element={<PredictPage />} />
        <Route path="/grids/:gridId/race/:raceId/results" element={<ResultsPage />} />
        <Route path="/grids/:gridId/live/:raceWeekendId" element={<LiveRacePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
