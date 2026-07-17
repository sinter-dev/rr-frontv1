// src/lib/api/client.ts
// One authenticated fetch wrapper used by every CRUD screen.
// - attaches the JWT access token
// - parses DRF error shapes into a readable message
// - on 401 clears the session and bounces to login

import { clearSession, getAccessToken } from "@/lib/auth/auth-storage";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  // field -> messages, when DRF returns per-field validation errors
  fieldErrors?: Record<string, string[]>;
  constructor(status: number, message: string, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

// Turn a DRF error body into a single readable string + field map.
function parseErrorBody(body: unknown): { message: string; fieldErrors?: Record<string, string[]> } {
  if (body && typeof body === "object") {
    const obj = body as Record<string, unknown>;
    if (typeof obj.detail === "string") return { message: obj.detail };

    // collect field errors like { name: ["This field is required."] }
    const fieldErrors: Record<string, string[]> = {};
    const parts: string[] = [];
    for (const [key, val] of Object.entries(obj)) {
      const msgs = Array.isArray(val) ? val.map(String) : [String(val)];
      fieldErrors[key] = msgs;
      parts.push(`${key}: ${msgs.join(" ")}`);
    }
    if (parts.length) return { message: parts.join(" · "), fieldErrors };
  }
  return { message: "Something went wrong. Please try again." };
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  // set false to skip the auth header (not needed for our screens)
  auth?: boolean;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = options;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const token = getAccessToken();
    // if (token) headers["Authorization"] = `Bearer ${token}`;
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Cannot reach the server. Check your connection and try again.");
  }

  // 401 -> session is dead; clear and send to login
  if (res.status === 401) {
    clearSession();
    if (typeof window !== "undefined") window.location.href = "/auth/v1/login";
    throw new ApiError(401, "Your session has expired. Please log in again.");
  }

  // 204 No Content (e.g. some deletes) -> nothing to parse
  if (res.status === 204) return undefined as T;

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* some responses have no body */
  }

  if (!res.ok) {
    const { message, fieldErrors } = parseErrorBody(data);
    throw new ApiError(res.status, message, fieldErrors);
  }

  return data as T;
}
