import { http } from "../../lib/http";

// Shapes devueltos por tu API (según ejemplo)
export type AuthResponse = { userIdentityId: string; emailConfirmed: boolean };

export function apiLogin(email: string, password: string) {
  return http.post<AuthResponse>(
    "/authentication/login",
    { email, password },
    { skipRefresh: true }
  );
}

export function apiRefresh() {
  return http.post<AuthResponse>("/Authentication/refresh-token", undefined, {
    skipRefresh: true,
  });
}

// Si tu backend tiene logout explícito, podrías llamarlo aquí.
// export async function apiLogout(): Promise<void> {
//   await http.post<void>("/authentication/logout");
// }

export type OrganizationDetailsResponse = {
  organization: {
    id: string;
    name: string;
    avatar: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
    // ...otros campos si los necesitás
  };
  // permissions, subscription, etc. están disponibles si los usás luego
};

export function apiMyOrganization() {
  return http.get<{
    organization: { id: string; name: string; avatar?: string | null };
  }>("/organization/my_organization_details");
}
