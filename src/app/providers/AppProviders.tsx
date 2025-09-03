// src/app/providers/AppProviders.tsx (o similar)
import { useEffect } from "react";
import { useAuthStore } from "../../features/auth/authStore";
import Loader from "../../components/Loaders";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const initializing = useAuthStore(s => s.initializing);
  const setState = useAuthStore.setState;

  useEffect(() => {
    const s = useAuthStore.getState();
    s._hydrate();
    s.refreshToken().finally(() => setState({ initializing: false }));
  }, []);

  if (initializing) return <Loader />;
  return <>{children}</>;
}