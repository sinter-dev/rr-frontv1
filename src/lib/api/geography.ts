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

// ----------------------------------------------------------- Parks

export interface NationalPark {
  id: number;
  name: string;
  country: number;
  country_name: string;
  is_active: boolean;
  community_count: number;
  created_at: string;
  updated_at: string;
}

export interface NationalParkInput {
  name: string;
  country: number;
  is_active?: boolean;
}

export function listParks(countryId?: number) {
  const q = countryId ? `?country=${countryId}` : "";
  return apiFetch<NationalPark[]>(`/api/geography/parks/${q}`);
}

export function createPark(data: NationalParkInput) {
  return apiFetch<NationalPark>("/api/geography/parks/", { method: "POST", body: data });
}

export function updatePark(id: number, data: Partial<NationalParkInput>) {
  return apiFetch<NationalPark>(`/api/geography/parks/${id}/`, { method: "PATCH", body: data });
}

export function deactivatePark(id: number) {
  return apiFetch<{ message: string }>(`/api/geography/parks/${id}/`, { method: "DELETE" });
}

// ----------------------------------------------------------- Communities

export interface Community {
  id: number;
  name: string;
  national_park: number;
  park_name: string;
  country_name: string;
  is_active: boolean;
  group_count: number;
  created_at: string;
  updated_at: string;
}

export interface CommunityInput {
  name: string;
  national_park: number;
  is_active?: boolean;
}

export function listCommunities(parkId?: number) {
  const q = parkId ? `?national_park=${parkId}` : "";
  return apiFetch<Community[]>(`/api/geography/communities/${q}`);
}

export function createCommunity(data: CommunityInput) {
  return apiFetch<Community>("/api/geography/communities/", { method: "POST", body: data });
}

export function updateCommunity(id: number, data: Partial<CommunityInput>) {
  return apiFetch<Community>(`/api/geography/communities/${id}/`, { method: "PATCH", body: data });
}

export function deactivateCommunity(id: number) {
  return apiFetch<{ message: string }>(`/api/geography/communities/${id}/`, { method: "DELETE" });
}
