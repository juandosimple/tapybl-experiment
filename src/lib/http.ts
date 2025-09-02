// src/lib/http.ts
type HttpOptions = RequestInit & {
  skipRefresh?: boolean; // para no recursar en el refresh
};

type Json = Record<string, any> | undefined;

const BASE_URL = import.meta.env.VITE_API_BASE as string; 
// Ej.: "https://api-dev.edu.tapybl.com/api"

if (!BASE_URL) {
  console.warn("⚠️ VITE_API_BASE no está definido. Revisá tu .env y reiniciá Vite.");
}

// Normaliza unión de rutas evitando dobles slashes
function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

async function request<T>(method: string, url: string, body?: Json, opts: HttpOptions = {}): Promise<T> {
  const headers: HeadersInit = {
    "Accept": "application/json",
    ...(body ? { "Content-Type": "application/json" } : {}),
    ...(opts.headers || {}),
  };

  const res = await fetch(joinUrl(BASE_URL, url), {
    method,
    credentials: "include", // si usás cookies
    ...opts,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.ok) {
    // 204/205 no traen JSON
    if (res.status === 204 || res.status === 205) return undefined as unknown as T;
    const ct = res.headers.get("content-type") || "";
    return ct.includes("application/json") ? (await res.json() as T) : (await res.text() as unknown as T);
  }

  // Si vence la sesión y no marcamos skipRefresh, intentamos refresh y repetimos
  if (res.status === 401 && !opts.skipRefresh) {
    try {
      await post("/authentication/refresh-token", undefined, { skipRefresh: true });
      // Reintento una sola vez
      return request<T>(method, url, body, { ...opts, skipRefresh: true });
    } catch {
      // Propagá el 401
    }
  }

  // Propagar error con mensaje legible
  let msg = `HTTP ${res.status}`;
  try {
    const data = await res.json();
    msg = data?.message || msg;
  } catch { /* ignore */ }
  const err = new Error(msg) as Error & { status?: number };
  err.status = res.status;
  throw err;
}

export function get<T>(url: string, opts?: HttpOptions) {
  return request<T>("GET", url, undefined, opts);
}
export function post<T>(url: string, body?: Json, opts?: HttpOptions) {
  return request<T>("POST", url, body, opts);
}
export function patch<T>(url: string, body?: Json, opts?: HttpOptions) {
  return request<T>("PATCH", url, body, opts);
}
export function del<T>(url: string, opts?: HttpOptions) {
  return request<T>("DELETE", url, undefined, opts);
}

export const http = { get, post, patch, delete: del };