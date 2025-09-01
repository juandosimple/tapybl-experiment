import { PropsWithChildren } from "react";

/**
 * Punto único para agregar providers globales más adelante
 * (tema, router, React Query, i18n, etc.).
 */
export default function AppProviders({ children }: PropsWithChildren) {
  return <>{children}</>;
}