import { useAuthStore } from "./authStore";

export function useAuth() {
  const { user, org, initializing, login, refreshToken, logout } = useAuthStore();
  return {
    user,
    org,
    organizationId: org?.id ?? null,
    isAuthenticated: !!user,
    initializing,
    login, refreshToken, logout,
  };
}