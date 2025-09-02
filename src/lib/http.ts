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
    credentials: "include",                 // 👈 CLAVE (cookies httpOnly)
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const http = {
  get:  <T>(p: string) => request<T>(p),
  post: <T>(p: string, b?: unknown) => request<T>(p, { method: "POST", body: b }),
  put:  <T>(p: string, b?: unknown) => request<T>(p, { method: "PUT", body: b }),
  patch:<T>(p: string, b?: unknown) => request<T>(p, { method: "PATCH", body: b }),
  del:  <T>(p: string) => request<T>(p, { method: "DELETE" }),
};