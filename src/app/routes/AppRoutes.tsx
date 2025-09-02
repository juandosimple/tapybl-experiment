import { Routes, Route, Navigate } from "react-router-dom";
import MobileShell from "../layout/MobileShell";
import ProtectedRoute from "./ProtectedRoute";

import LoginPage from "../../features/auth/pages/LoginPage";
import RegisterPage from "../../features/auth/pages/RegisterPage";

// Stubs/páginas reales
import FeedPage from "../../features/feed/pages/FeedPage";
import ReelsPage from "../../features/feed/pages/ReelsPage";
import NotificationsPage from "../../features/notifications/pages/NotificationsPage";
import ProfilePage from "../../features/profile/pages/ProfilePage";

export default function AppRoutes() {
  return (
    <Routes>
      {/* públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      
      {/* privadas: todo lo demás queda protegido */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MobileShell>
              <Routes>
                <Route path="/" element={<FeedPage />} />
                <Route path="/reels" element={<ReelsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </MobileShell>
          </ProtectedRoute>
        }
      />

      {/* fallback: cualquier otra ruta → login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
