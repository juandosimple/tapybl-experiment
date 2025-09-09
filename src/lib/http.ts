// http.ts
type HttpOptions = RequestInit & {
  skipRefresh?: boolean;
};

type Json = Record<string, any> | undefined;

const BASE_URL = import.meta.env.VITE_API_BASE as string;

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

// --- NEW: mutex global para evitar múltiples refresh en paralelo ---
let refreshingPromise: Promise<void> | null = null;

async function refreshOnce(): Promise<void> {
  if (!refreshingPromise) {
    // OJO: POST VACÍO -> body: undefined (sin Content-Type)
    refreshingPromise = fetch(joinUrl(BASE_URL, "/Authentication/refresh-token"), {
      method: "POST",
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
          const msg = await safeJsonMessage(res);
          throw new Error(msg || `Refresh failed ${res.status}`);
        }
        // el server rota la cookie en la respuesta; no necesitamos leer body
      })
      .finally(() => {
        refreshingPromise = null;
      });
  }
  return refreshingPromise;
}

async function safeJsonMessage(res: Response) {
  try {
    const data = await res.json();
    return (data && (data.message || data.error || data.Errors?.[0])) || "";
  } catch {
    return "";
  }
}

async function request<T>(method: string, url: string, body?: Json, opts: HttpOptions = {}): Promise<T> {
  const headers: HeadersInit = {
    Accept: "application/json",
    ...(body ? { "Content-Type": "application/json" } : {}),
    ...(opts.headers || {}),
  };

  const res = await fetch(joinUrl(BASE_URL, url), {
    method,
    credentials: "include",
    ...opts,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.ok) {
    if (res.status === 204 || res.status === 205) return undefined as unknown as T;
    const ct = res.headers.get("content-type") || "";
    return ct.includes("application/json")
      ? ((await res.json()) as T)
      : ((await res.text()) as unknown as T);
  }

  // --- 401: refrescar UNA sola vez y reintentar la request
  if (res.status === 401 && !opts.skipRefresh) {
    try {
      await refreshOnce(); // <- espera el refresh global (single-flight)
      return request<T>(method, url, body, { ...opts, skipRefresh: true }); // retry 1 vez
    } catch {
      // si el refresh falla, seguimos abajo y devolvemos el error original
    }
  }

  let msg = await safeJsonMessage(res);
  if (!msg) msg = `HTTP ${res.status}`;
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