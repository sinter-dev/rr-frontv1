// src/lib/api/marketplace.ts
//
// Craft seller marketplace — admin-managed categories, and (soon) product
// CRUD. Categories follow the exact same admin CRUD pattern as
// geography.ts's countries: list/create/update/soft-delete.

import { apiFetch } from "./client";

export interface Category {
  id: number;
  name: string;
  is_active: boolean;
  product_count: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryInput {
  name: string;
  is_active?: boolean;
}

export function listCategories() {
  return apiFetch<Category[]>("/api/marketplace/categories/");
}

export function createCategory(data: CategoryInput) {
  return apiFetch<Category>("/api/marketplace/categories/", { method: "POST", body: data });
}

export function updateCategory(id: number, data: Partial<CategoryInput>) {
  return apiFetch<Category>(`/api/marketplace/categories/${id}/`, { method: "PATCH", body: data });
}

export function deactivateCategory(id: number) {
  return apiFetch<{ message: string }>(`/api/marketplace/categories/${id}/`, { method: "DELETE" });
}
