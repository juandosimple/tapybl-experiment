// src/app/routes/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../features/auth/authStore";
import { ReactNode } from "react";   // 👈 importar acá

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { initializing, hasSession } = useAuthStore();

  if (initializing) return <div style={{ padding: 16 }}>Loading...</div>;
  if (!hasSession) return <Navigate to="/login" replace />;
  return <>{children}</>;   // 👈 envolver en fragment
}