import { create } from "zustand";
import {
  apiLogin,
  apiRefresh,
  apiMyOrganization,
  type AuthResponse,
} from "./api";

type OrgSnapshot = { id: string; name: string; avatar?: string | null } | null;
type UserSnapshot = AuthResponse | null;

type AuthState = {
  user: UserSnapshot;
  org: OrgSnapshot; // 👈 organización actual
  initializing: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  refreshToken: () => Promise<boolean>;
  logout: () => Promise<void>;
  _hydrateFromStorage: () => void;
};

const LS_USER = "auth:user";
const LS_ORG = "auth:org";

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  org: null,
  initializing: true,

  _hydrateFromStorage() {
    try {
      const raw = localStorage.getItem(LS_ORG);
      if (raw) {
        const parsed = JSON.parse(raw);
        // 🛠️ migración: si quedó guardado el objeto completo (tiene "organization"),
        // lo convertimos a snapshot {id, name, avatar}.
        const org: OrgSnapshot = parsed?.organization
          ? {
              id: parsed.organization.id,
              name: parsed.organization.name,
              avatar: parsed.organization.avatar,
            }
          : parsed?.id
          ? parsed
          : null;
        if (org) set({ org });
      }
      // ...hidrata también el user si lo tenés en LS
    } catch {}
  },

  async login(email, password) {
    const user = await apiLogin(email, password);
    set({ user });
    localStorage.setItem("auth:user", JSON.stringify(user));

    const orgRes = await apiMyOrganization();
    const org: OrgSnapshot = {
      id: orgRes.organization.id,
      name: orgRes.organization.name,
      avatar: orgRes.organization.avatar,
    };
    set({ org });
    localStorage.setItem(LS_ORG, JSON.stringify(org));
    return true;
  },

  async refreshToken() {
    const user = await apiRefresh();
    set({ user });
    localStorage.setItem("auth:user", JSON.stringify(user));

    const orgRes = await apiMyOrganization();
    const org: OrgSnapshot = {
      id: orgRes.organization.id,
      name: orgRes.organization.name,
      avatar: orgRes.organization.avatar,
    };
    set({ org });
    localStorage.setItem(LS_ORG, JSON.stringify(org));
    return true;
  },

  async logout() {
    // si luego tenés endpoint /authentication/logout, llámalo aquí
    set({ user: null, org: null });
    localStorage.removeItem(LS_USER);
    localStorage.removeItem(LS_ORG);
  },
}));

export async function bootstrapAuth() {
  const s = useAuthStore.getState();
  s._hydrateFromStorage(); // evita parpadeos
  await s.refreshToken(); // valida cookie y trae organización
  useAuthStore.setState({ initializing: false });
}
