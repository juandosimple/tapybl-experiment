import { Routes, Route, Navigate } from "react-router-dom";
import MobileShell from "@/app/layout/MobileShell";
import ProtectedRoute from "./ProtectedRoute";

import LoginPage from "@/features/auth/pages/LoginPage";

import FeedPage from "@/features/feed/pages/FeedPage";
import NotificationsPage from "@/features/notifications/pages/NotificationsPage";
import ProfilePage from "@/features/profile/pages/ProfilePage";
import ChannelPage from "@/features/channel/pages/ChannelPage";
import ExplorePage from "@/features/explore/pages/ExplorePage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MobileShell>
              <Routes>
                <Route path="/" element={<FeedPage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route
                  path="/channel/:organization_id"
                  element={<ChannelPage />}
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </MobileShell>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
