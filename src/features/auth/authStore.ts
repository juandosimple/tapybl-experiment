// src/features/auth/authStore.ts
import { create } from "zustand";
import { apiLogin, apiRefresh, apiMyOrganization, type AuthResponse } from "./api";

type Org = { id: string; name: string; avatar?: string | null } | null;
type User = AuthResponse | null;

type AuthState = {
  user: User;
  org: Org;
  initializing: boolean;
  hasSession: boolean; // 👈 derivada, pero útil para http.ts
  login: (email: string, password: string) => Promise<boolean>;
  refreshToken: () => Promise<boolean>;
  logout: () => Promise<void>;
  _hydrate: () => void;
};

const LS_USER = "auth:user";
const LS_ORG  = "auth:org";

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  org: null,
  initializing: true,
  hasSession: false,

  _hydrate() {
    try {
      const u = localStorage.getItem(LS_USER);
      if (u) set({ user: JSON.parse(u), hasSession: true });
      const o = localStorage.getItem(LS_ORG);
      if (o) set({ org: JSON.parse(o) });
    } catch {}
  },

  async login(email, password) {
    try {
      const user = await apiLogin(email, password);
      set({ user, hasSession: true });
      localStorage.setItem(LS_USER, JSON.stringify(user));

      const orgRes = await apiMyOrganization();
      const org = { id: orgRes.organization.id, name: orgRes.organization.name, avatar: orgRes.organization.avatar ?? null };
      set({ org });
      localStorage.setItem(LS_ORG, JSON.stringify(org));
      return true;
    } catch {
      set({ user: null, org: null, hasSession: false });
      localStorage.removeItem(LS_USER);
      localStorage.removeItem(LS_ORG);
      return false;
    }
  },

  async refreshToken() {
    try {
      const user = await apiRefresh(); // skipRefresh: true
      set({ user, hasSession: true });
      localStorage.setItem(LS_USER, JSON.stringify(user));

      // traer org siempre después de refresh OK
      const orgRes = await apiMyOrganization();
      const org = { id: orgRes.organization.id, name: orgRes.organization.name, avatar: orgRes.organization.avatar ?? null };
      set({ org });
      localStorage.setItem(LS_ORG, JSON.stringify(org));
      return true;
    } catch {
      // refresh falló → limpiar sesión
      set({ user: null, org: null, hasSession: false });
      localStorage.removeItem(LS_USER);
      localStorage.removeItem(LS_ORG);
      return false;
    }
  },

  async logout() {
    set({ user: null, org: null, hasSession: false });
    localStorage.removeItem(LS_USER);
    localStorage.removeItem(LS_ORG);
  },
}));