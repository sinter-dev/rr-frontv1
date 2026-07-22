// src/lib/api/wallets.ts
// Wallet, ledger and settings endpoints.
//
// NOTE ON MONEY: the backend sends amounts as STRINGS ("9300.00") to
// preserve exact decimal precision — JavaScript numbers lose accuracy on
// money arithmetic. Never parseFloat these for calculation; only for
// display via formatUGX().

import { apiFetch } from "./client";

export interface Wallet {
  id: number;
  user_id: number;
  phone_number: string;
  owner_name: string;
  balance: string;
  is_frozen: boolean;
  created_at: string;
}

export type LedgerDirection = "CREDIT" | "DEBIT";

export interface LedgerEntry {
  id: number;
  amount: string;
  signed_amount: string;
  direction: LedgerDirection;
  entry_type: string;
  entry_type_display: string;
  balance_after: string;
  description: string;
  reference: string;
  created_at: string;
}

export interface FeeBreakdown {
  gross: string;
  gateway_fee: string;
  commission: string;
  net_to_beneficiary: string;
  amount_into_float: string;
}

export interface WalletSettings {
  commission_flat: string;
  commission_percent: string;
  gateway_percent: string;
  min_payment_amount: string;
  min_payout_amount: string;
  max_payment_amount: string;
  suggested_minimum_gross: string;
  updated_at: string;
}

export interface AdminWalletList {
  total_balance: string;
  wallet_count: number;
  wallets: Wallet[];
}

export interface WalletDetail {
  wallet: Wallet;
  entries: LedgerEntry[];
}

// ---------------------------------------------------- display helper

/** Format a money string for display, e.g. "9300.00" -> "UGX 9,300". */
export function formatUGX(amount: string | number, showDecimals = false): string {
  const value = typeof amount === "number" ? amount : Number.parseFloat(amount);
  if (Number.isNaN(value)) return "—";
  return `UGX ${value.toLocaleString("en-UG", {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  })}`;
}

// ---------------------------------------------------- public

export function previewFees(amount: string) {
  return apiFetch<FeeBreakdown>("/api/wallets/fee-preview/", {
    method: "POST",
    body: { amount },
    auth: false,
  });
}

// ---------------------------------------------------- any user

export function getMyWallet() {
  return apiFetch<Wallet>("/api/wallets/me/");
}

export function getMyLedger() {
  return apiFetch<LedgerEntry[]>("/api/wallets/me/entries/");
}

// ---------------------------------------------------- super admin

export function listWallets(search?: string) {
  const q = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch<AdminWalletList>(`/api/wallets/${q}`);
}

export function getWalletDetail(userId: number) {
  return apiFetch<WalletDetail>(`/api/wallets/${userId}/`);
}

export interface AdjustInput {
  amount: string;
  direction: LedgerDirection;
  reason: string;
}

export function adjustWallet(userId: number, data: AdjustInput) {
  return apiFetch<{ message: string; entry: LedgerEntry; wallet: Wallet }>(`/api/wallets/${userId}/adjust/`, {
    method: "POST",
    body: data,
  });
}

export function getWalletSettings() {
  return apiFetch<WalletSettings>("/api/wallets/settings/");
}

export interface WalletSettingsInput {
  commission_flat?: string;
  commission_percent?: string;
  gateway_percent?: string;
  min_payment_amount?: string;
  min_payout_amount?: string;
  max_payment_amount?: string;
}

export function updateWalletSettings(data: WalletSettingsInput) {
  return apiFetch<{ message: string; settings: WalletSettings }>("/api/wallets/settings/", {
    method: "PATCH",
    body: data,
  });
}

// ===================================================================
// APPEND THESE to src/lib/api/wallets.ts
// (public payment flow — no auth required)
// ===================================================================

export interface PublicWorker {
  id: number;
  name: string;
  phone_number: string;
  role: string | null;
}

export type PaymentStatus = "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "CANCELLED";

export interface PaymentRecord {
  public_id: string;
  status: PaymentStatus;
  is_test: boolean;
  gross_amount: string;
  estimated_net: string;
  net_credited: string | null;
  beneficiary_name: string;
  payer_msisdn: string;
  gateway_status_message: string;
  created_at: string;
  completed_at: string | null;
}

export function searchWorkers(q: string) {
  return apiFetch<PublicWorker[]>(`/api/wallets/pay/workers/?q=${encodeURIComponent(q)}`, {
    auth: false,
  });
}

export interface InitiatePaymentInput {
  beneficiary_id: number;
  amount: string;
  payer_msisdn: string;
  payer_name?: string;
}

export function initiatePayment(data: InitiatePaymentInput) {
  return apiFetch<PaymentRecord>("/api/wallets/pay/", {
    method: "POST",
    body: data,
    auth: false,
  });
}

export function getPaymentStatus(publicId: string) {
  return apiFetch<PaymentRecord>(`/api/wallets/pay/${publicId}/`, { auth: false });
}
