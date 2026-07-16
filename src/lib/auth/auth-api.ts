// src/lib/auth/auth-api.ts
// Talks to the Django backend. The base URL comes from .env.local:
//   NEXT_PUBLIC_API_URL=http://localhost:8000   (dev)
//   NEXT_PUBLIC_API_URL=https://mydomain.com    (prod)

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ---- Types mirroring the Django serializers ----

export interface Role {
  id: number;
  code: string;
  name: string;
  description: string;
  is_active: boolean;
}

export interface AuthUser {
  id: number;
  phone_number: string;
  email: string | null;
  first_name: string;
  last_name: string;
  role: Role | null;
  is_group_leader: boolean;
  must_change_password: boolean;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: AuthUser;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// ---- Calls ----

export async function loginRequest(phoneNumber: string, password: string): Promise<LoginResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone_number: phoneNumber, password }),
    });
  } catch {
    throw new ApiError(0, "Cannot reach the server. Check your connection and try again.");
  }

  if (!res.ok) {
    // SimpleJWT returns {"detail": "..."} for bad credentials (401)
    let detail = "Login failed. Please try again.";
    try {
      const body = await res.json();
      if (typeof body?.detail === "string") detail = body.detail;
    } catch {
      /* non-JSON body — keep default message */
    }
    if (res.status === 401) detail = "Incorrect phone number or password.";
    throw new ApiError(res.status, detail);
  }

  return (await res.json()) as LoginResponse;
}
