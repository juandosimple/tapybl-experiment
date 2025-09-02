import { http } from "../../lib/http";

// Shapes devueltos por tu API (según ejemplo)
export type AuthResponse = {
  userIdentityId: string;
  emailConfirmed: boolean;
};

export async function apiLogin(
  email: string,
  password: string
): Promise<AuthResponse> {
  // POST https://api-dev.edu.tapybl.com/api/authentication/login
  return http.post<AuthResponse>("/authentication/login", { email, password });
}

export async function apiRefresh(): Promise<AuthResponse> {
  // POST https://api-dev.edu.tapybl.com/api/Authentication/refresh-token
  // (observa la A mayúscula en Authentication según tu ejemplo)
  return http.post<AuthResponse>("/Authentication/refresh-token");
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

export async function apiMyOrganization(): Promise<OrganizationDetailsResponse> {
  return http.get<OrganizationDetailsResponse>(
    "/organization/my_organization_details"
  );
}
