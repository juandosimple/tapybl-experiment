import { useAuthStore } from "./authStore";

export function useAuth() {
  const { user, org, initializing, login, refreshToken, logout } = useAuthStore();
  return {
    user,
    org,                                  // { id, name, avatar } | null
    organizationId: org?.id ?? null,      // 👈 siempre string o null
    isAuthenticated: !!user,
    initializing,
    login, refreshToken, logout,
  };
}