import { http } from "../../lib/http";
import type { MicrolessonListResponse } from "./types";

export async function fetchMicrolessons(organizationId: string, page: number, pageSize = 12) {
  const body = { page, pageSize, orderBy: "", search: "", orderAsk: false };
  const orgId = encodeURIComponent(organizationId);
  return http.post<MicrolessonListResponse>(`/microlessons/${orgId}/list`, body);
}

// 🔹 PREVIEW: devuelve los nodos / media del contenido
export async function fetchLessonPreview(organizationId: string, lessonId: string) {
  const orgId = encodeURIComponent(organizationId);
  const mid = encodeURIComponent(lessonId);
  return http.get<any>(`/microlessons/${orgId}/preview/${mid}`);
}