import { env } from "./env";

type HttpOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
};

async function request<T>(path: string, opts: HttpOptions = {}): Promise<T> {
  const { method = "GET", body, headers } = opts;
  const res = await fetch(`${env.API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(headers ?? {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include", // quitalo si no usás cookies
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || `HTTP ${res.status}`);
  }
  // si tu API a veces responde vacío (204), evitá parsear JSON
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const http = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  put:  <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body }),
  patch:<T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  del:  <T>(path: string) => request<T>(path, { method: "DELETE" }),
};