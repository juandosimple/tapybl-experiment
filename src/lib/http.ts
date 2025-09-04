type HttpOptions = RequestInit & {
  skipRefresh?: boolean;
};

type Json = Record<string, any> | undefined;

const BASE_URL = import.meta.env.VITE_API_BASE as string; 

if (!BASE_URL) {
  console.warn("⚠️ VITE_API_BASE It's not defined. Check your .env and restart Vite.");
}

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
    credentials: "include",
    ...opts,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.ok) {
    if (res.status === 204 || res.status === 205) return undefined as unknown as T;
    const ct = res.headers.get("content-type") || "";
    return ct.includes("application/json") ? (await res.json() as T) : (await res.text() as unknown as T);
  }

  if (res.status === 401 && !opts.skipRefresh) {
    try {
      await post("/authentication/refresh-token", undefined, { skipRefresh: true });
      return request<T>(method, url, body, { ...opts, skipRefresh: true });
    } catch {
      // Propagate the 401.
    }
  }

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