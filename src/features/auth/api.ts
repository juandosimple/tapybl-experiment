import { http } from "../../lib/http";

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

export type OrganizationDetailsResponse = {
  organization: {
    id: string;
    name: string;
    avatar: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
  };
};

export function apiMyOrganization() {
  return http.get<{
    organization: { id: string; name: string; avatar?: string | null };
  }>("/organization/my_organization_details");
}
