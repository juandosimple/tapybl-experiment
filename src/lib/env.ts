/**
 * Centraliza variables VITE_* con tipos.
 * Cambiá VITE_API_BASE por lo que uses realmente.
 */
export const env = {
  API_BASE: (import.meta.env.VITE_API_BASE as string) || "http://localhost:3000",
};