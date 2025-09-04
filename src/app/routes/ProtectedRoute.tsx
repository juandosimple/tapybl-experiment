import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../features/auth/authStore";
import { ReactNode } from "react";
import Loader from "../../components/loaders";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { initializing, hasSession } = useAuthStore();

  if (initializing) return <Loader />;
  if (!hasSession) return <Navigate to="/login" replace />;
  return <>{children}</>;
}