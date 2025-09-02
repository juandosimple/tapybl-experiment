import { PropsWithChildren, useEffect, useState } from "react";
import { bootstrapAuth } from "../../features/auth/authStore";

export default function AppProviders({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await bootstrapAuth();   // valida cookie/refresh y deja snapshot
      setReady(true);
    })();
  }, []);

  if (!ready) {
    // Loading muy simple mientras hacemos refresh inicial
    return <div style={{ padding: 16, color: "#fff" }}>Checking session…</div>;
  }

  return <>{children}</>;
}