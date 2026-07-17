// src/lib/api/geography.ts
// Typed wrappers around the geography endpoints. Screens import these
// instead of calling apiFetch directly, so URLs/types live in one place.

import { apiFetch } from "./client";

export interface Country {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
  park_count: number;
  created_at: string;
  updated_at: string;
}

export interface CountryInput {
  name: string;
  code?: string;
  is_active?: boolean;
}

export function listCountries() {
  return apiFetch<Country[]>("/api/geography/countries/");
}

export function createCountry(data: CountryInput) {
  return apiFetch<Country>("/api/geography/countries/", { method: "POST", body: data });
}

export function updateCountry(id: number, data: Partial<CountryInput>) {
  return apiFetch<Country>(`/api/geography/countries/${id}/`, { method: "PATCH", body: data });
}

// DELETE is a SOFT delete on the backend (sets is_active=false) and
// returns a { message } object, not 204.
export function deactivateCountry(id: number) {
  return apiFetch<{ message: string }>(`/api/geography/countries/${id}/`, { method: "DELETE" });
}
