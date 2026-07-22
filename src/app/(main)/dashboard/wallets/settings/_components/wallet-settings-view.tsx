"use client";

// Wallet settings (super admin). Money rules that can be tuned without a
// deploy. Includes a LIVE PREVIEW so the admin sees the effect of a
// change on a real amount before saving.

import { useCallback, useEffect, useState } from "react";

import { Info, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ApiError } from "@/lib/api/client";
import {
  type FeeBreakdown,
  formatUGX,
  getWalletSettings,
  previewFees,
  updateWalletSettings,
  type WalletSettings,
} from "@/lib/api/wallets";

export function WalletSettingsView() {
  const [settings, setSettings] = useState<WalletSettings | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const [previewAmount, setPreviewAmount] = useState("10000");
  const [preview, setPreview] = useState<FeeBreakdown | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await getWalletSettings();
      setSettings(s);
      setForm({
        commission_flat: s.commission_flat,
        commission_percent: s.commission_percent,
        gateway_percent: s.gateway_percent,
        min_payment_amount: s.min_payment_amount,
        min_payout_amount: s.min_payout_amount,
        max_payment_amount: s.max_payment_amount,
        min_balance_to_withdraw: s.min_balance_to_withdraw,
        withdrawal_reserve: s.withdrawal_reserve,
        withdrawal_gateway_percent: s.withdrawal_gateway_percent,
      });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const runPreview = useCallback(async () => {
    if (!previewAmount) return;
    try {
      setPreview(await previewFees(previewAmount));
      setPreviewError(null);
    } catch (error) {
      setPreview(null);
      setPreviewError(error instanceof ApiError ? error.message : "Could not preview.");
    }
  }, [previewAmount]);

  useEffect(() => {
    const timer = setTimeout(() => void runPreview(), 400);
    return () => clearTimeout(timer);
  }, [runPreview]);

  function setField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value.replace(/[^\d.]/g, "") }));
  }

  async function handleSave() {
    setSaving(true);
    setErrors({});
    try {
      const res = await updateWalletSettings(form);
      toast.success(res.message);
      setSettings(res.settings);
      await runPreview();
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.fieldErrors) {
          setErrors(error.fieldErrors);
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error("Something went wrong.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" />
        Loading settings...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex-1">
        <Card>
          <CardHeader>
            <CardTitle>Wallet settings</CardTitle>
            <CardDescription>Money rules for the whole platform. Changes take effect immediately.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-5">
              <div>
                <h3 className="mb-3 font-medium text-sm">Our service fee (paid by the worker)</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field data-invalid={!!errors.commission_flat}>
                    <FieldLabel htmlFor="s-flat">Flat fee (UGX)</FieldLabel>
                    <Input
                      id="s-flat"
                      value={form.commission_flat ?? ""}
                      onChange={(e) => setField("commission_flat", e.target.value)}
                      inputMode="decimal"
                    />
                    {errors.commission_flat && (
                      <FieldError errors={errors.commission_flat.map((m) => ({ message: m }))} />
                    )}
                  </Field>
                  <Field data-invalid={!!errors.commission_percent}>
                    <FieldLabel htmlFor="s-pct">Percentage (%)</FieldLabel>
                    <Input
                      id="s-pct"
                      value={form.commission_percent ?? ""}
                      onChange={(e) => setField("commission_percent", e.target.value)}
                      inputMode="decimal"
                    />
                    <FieldDescription>Added on top of the flat fee.</FieldDescription>
                    {errors.commission_percent && (
                      <FieldError errors={errors.commission_percent.map((m) => ({ message: m }))} />
                    )}
                  </Field>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="mb-3 font-medium text-sm">Gateway fee (paid by the payer)</h3>
                <Field data-invalid={!!errors.gateway_percent}>
                  <FieldLabel htmlFor="s-gw">Gateway percentage (%)</FieldLabel>
                  <Input
                    id="s-gw"
                    value={form.gateway_percent ?? ""}
                    onChange={(e) => setField("gateway_percent", e.target.value)}
                    inputMode="decimal"
                    className="sm:max-w-xs"
                  />
                  <FieldDescription className="flex items-start gap-1.5">
                    <Info className="mt-0.5 size-3.5 shrink-0" />
                    <span>
                      Used only to <strong>estimate</strong> what a worker will receive. Actual wallet credits are based
                      on what the gateway really settles, so this figure cannot cause accounting errors.
                    </span>
                  </FieldDescription>
                  {errors.gateway_percent && (
                    <FieldError errors={errors.gateway_percent.map((m) => ({ message: m }))} />
                  )}
                </Field>
              </div>

              <Separator />

              <div>
                <h3 className="mb-3 font-medium text-sm">Limits</h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field data-invalid={!!errors.min_payment_amount}>
                    <FieldLabel htmlFor="s-minpay">Min payment</FieldLabel>
                    <Input
                      id="s-minpay"
                      value={form.min_payment_amount ?? ""}
                      onChange={(e) => setField("min_payment_amount", e.target.value)}
                      inputMode="decimal"
                    />
                    {errors.min_payment_amount && (
                      <FieldError errors={errors.min_payment_amount.map((m) => ({ message: m }))} />
                    )}
                  </Field>
                  <Field data-invalid={!!errors.min_payout_amount}>
                    <FieldLabel htmlFor="s-minout">Min payout</FieldLabel>
                    <Input
                      id="s-minout"
                      value={form.min_payout_amount ?? ""}
                      onChange={(e) => setField("min_payout_amount", e.target.value)}
                      inputMode="decimal"
                    />
                    <FieldDescription>Smallest cash-out.</FieldDescription>
                    {errors.min_payout_amount && (
                      <FieldError errors={errors.min_payout_amount.map((m) => ({ message: m }))} />
                    )}
                  </Field>
                  <Field data-invalid={!!errors.max_payment_amount}>
                    <FieldLabel htmlFor="s-maxpay">Max payment</FieldLabel>
                    <Input
                      id="s-maxpay"
                      value={form.max_payment_amount ?? ""}
                      onChange={(e) => setField("max_payment_amount", e.target.value)}
                      inputMode="decimal"
                    />
                    {errors.max_payment_amount && (
                      <FieldError errors={errors.max_payment_amount.map((m) => ({ message: m }))} />
                    )}
                  </Field>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="mb-3 font-medium text-sm">Withdrawal rules (worker cash-out)</h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field data-invalid={!!errors.min_balance_to_withdraw}>
                    <FieldLabel htmlFor="s-minbal">Min balance to withdraw</FieldLabel>
                    <Input
                      id="s-minbal"
                      value={form.min_balance_to_withdraw ?? ""}
                      onChange={(e) => setField("min_balance_to_withdraw", e.target.value)}
                      inputMode="decimal"
                    />
                    <FieldDescription>Needed before any cash-out.</FieldDescription>
                    {errors.min_balance_to_withdraw && (
                      <FieldError errors={errors.min_balance_to_withdraw.map((m) => ({ message: m }))} />
                    )}
                  </Field>
                  <Field data-invalid={!!errors.withdrawal_reserve}>
                    <FieldLabel htmlFor="s-reserve">Reserve to keep</FieldLabel>
                    <Input
                      id="s-reserve"
                      value={form.withdrawal_reserve ?? ""}
                      onChange={(e) => setField("withdrawal_reserve", e.target.value)}
                      inputMode="decimal"
                    />
                    <FieldDescription>Must remain after withdrawing.</FieldDescription>
                    {errors.withdrawal_reserve && (
                      <FieldError errors={errors.withdrawal_reserve.map((m) => ({ message: m }))} />
                    )}
                  </Field>
                  <Field data-invalid={!!errors.withdrawal_gateway_percent}>
                    <FieldLabel htmlFor="s-wdpct">Withdrawal fee (%)</FieldLabel>
                    <Input
                      id="s-wdpct"
                      value={form.withdrawal_gateway_percent ?? ""}
                      onChange={(e) => setField("withdrawal_gateway_percent", e.target.value)}
                      inputMode="decimal"
                    />
                    <FieldDescription>Estimate only; shown to the worker.</FieldDescription>
                    {errors.withdrawal_gateway_percent && (
                      <FieldError errors={errors.withdrawal_gateway_percent.map((m) => ({ message: m }))} />
                    )}
                  </Field>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={() => void handleSave()} disabled={saving}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Save settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:w-80">
        <Card className="lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle>Live preview</CardTitle>
            <CardDescription>What a worker receives, using the saved settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <Field className="mb-4">
              <FieldLabel htmlFor="prev-amt">Payment amount (UGX)</FieldLabel>
              <Input
                id="prev-amt"
                value={previewAmount}
                onChange={(e) => setPreviewAmount(e.target.value.replace(/[^\d.]/g, ""))}
                inputMode="decimal"
              />
            </Field>

            {previewError ? (
              <p className="text-destructive text-sm">{previewError}</p>
            ) : preview ? (
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payer pays</span>
                  <span className="font-medium tabular-nums">{formatUGX(preview.gross)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Gateway fee</span>
                  <span className="tabular-nums">− {formatUGX(preview.gateway_fee)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Our commission</span>
                  <span className="tabular-nums">− {formatUGX(preview.commission)}</span>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between">
                  <span className="font-medium">Worker receives</span>
                  <span className="font-semibold text-primary tabular-nums">
                    {formatUGX(preview.net_to_beneficiary)}
                  </span>
                </div>
                {settings && (
                  <p className="mt-3 text-muted-foreground text-xs">
                    Smallest workable payment right now: <strong>{formatUGX(settings.suggested_minimum_gross)}</strong>
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Enter an amount to preview.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
