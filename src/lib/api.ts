// ════════════════════════════════════════════════════
// STANDARDIZED API FETCH WRAPPER
// All React Query hooks use this to call our API routes.
// ════════════════════════════════════════════════════

const BASE = ''; // Same origin — no need for full URL

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: string[];
}

export class ApiError extends Error {
  code: string;
  status: number;
  details?: string[];

  constructor(message: string, code: string, status: number, details?: string[]) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  const json: ApiResponse<T> = await res.json();

  if (!res.ok || !json.success) {
    throw new ApiError(
      json.error || 'Something went wrong',
      json.code || 'UNKNOWN',
      res.status,
      json.details
    );
  }

  return json.data as T;
}

// Convenience methods
export const api = {
  get: <T>(path: string) => apiFetch<T>(path),

  post: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }),

  patch: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),

  delete: <T>(path: string) =>
    apiFetch<T>(path, { method: 'DELETE' }),
};
