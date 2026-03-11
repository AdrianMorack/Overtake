import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import { DashboardPage } from "./pages/DashboardPage";
import { CreateGridPage, JoinGridPage } from "./pages/GridPages";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { PredictPage } from "./pages/PredictPage";
import { RacesPage } from "./pages/RacesPage";
import { ResultsPage } from "./pages/ResultsPage";
import { LiveRacePage } from "./pages/LiveRacePage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p>Loading…</p>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/grids/create" element={<ProtectedRoute><CreateGridPage /></ProtectedRoute>} />
      <Route path="/grids/join" element={<ProtectedRoute><JoinGridPage /></ProtectedRoute>} />
      <Route path="/grids/:gridId" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
      <Route path="/grids/:gridId/race/:raceId/predict" element={<ProtectedRoute><PredictPage /></ProtectedRoute>} />
      <Route path="/grids/:gridId/race/:raceId/results" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
      <Route path="/grids/:gridId/live/:raceWeekendId" element={<ProtectedRoute><LiveRacePage /></ProtectedRoute>} />
      <Route path="/races" element={<ProtectedRoute><RacesPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
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
