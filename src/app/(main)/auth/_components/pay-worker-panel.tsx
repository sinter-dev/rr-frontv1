"use client";

// Public "Pay a worker" panel — lives on the left of the login screen.
// No account needed. Flow: search a worker -> enter amount + your phone ->
// see a live fee estimate -> pay -> watch the status resolve.

import { useCallback, useEffect, useRef, useState } from "react";

import { Check, Loader2, Search, Smartphone, TriangleAlert, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/client";
import {
  type FeeBreakdown,
  formatUGX,
  getPaymentStatus,
  initiatePayment,
  type PaymentRecord,
  type PublicWorker,
  previewFees,
  searchWorkers,
} from "@/lib/api/wallets";

const PHONE_RE = /^\d{12}$/;

type Phase = "form" | "processing" | "done";

export function PayWorkerPanel() {
  const [phase, setPhase] = useState<Phase>("form");

  // worker search
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublicWorker[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<PublicWorker | null>(null);
  const [showResults, setShowResults] = useState(false);

  // amount + payer
  const [amount, setAmount] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [fee, setFee] = useState<FeeBreakdown | null>(null);
  const [feeError, setFeeError] = useState<string | null>(null);

  // submission
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentRecord | null>(null);

  // ---- worker search (debounced) ----
  useEffect(() => {
    if (selected && query === selected.name) return;
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        setResults(await searchWorkers(query));
        setShowResults(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, selected]);

  // ---- fee estimate (debounced) ----
  useEffect(() => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      setFee(null);
      setFeeError(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setFee(await previewFees(amount));
        setFeeError(null);
      } catch (error) {
        setFee(null);
        setFeeError(error instanceof ApiError ? error.message : "Could not estimate.");
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [amount]);

  function pickWorker(w: PublicWorker) {
    setSelected(w);
    setQuery(w.name);
    setShowResults(false);
  }

  function resetWorker() {
    setSelected(null);
    setQuery("");
    setResults([]);
  }

  const canSubmit =
    selected !== null &&
    PHONE_RE.test(payerPhone) &&
    amount !== "" &&
    Number.parseFloat(amount) > 0 &&
    fee !== null &&
    !feeError;

  async function handlePay() {
    if (!selected) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const rec = await initiatePayment({
        beneficiary_id: selected.id,
        amount,
        payer_msisdn: payerPhone,
        payer_name: "",
      });
      setPayment(rec);
      setPhase(rec.status === "FAILED" ? "done" : "processing");
    } catch (error) {
      if (error instanceof ApiError) {
        const first = error.fieldErrors ? Object.values(error.fieldErrors)[0]?.[0] : error.message;
        setFormError(first ?? "Payment could not be started.");
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setPhase("form");
    setPayment(null);
    setSelected(null);
    setQuery("");
    setAmount("");
    setPayerPhone("");
    setFee(null);
    setFormError(null);
  }

  if (phase === "processing" && payment) {
    return <ProcessingView payment={payment} onResolved={setPayment} onDone={() => setPhase("done")} onReset={reset} />;
  }

  if (phase === "done" && payment) {
    return <ResultView payment={payment} onReset={reset} />;
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-6">
        <h2 className="font-semibold text-2xl text-primary-foreground">Pay a worker directly</h2>
        <p className="mt-1 text-primary-foreground/80 text-sm">
          Support a porter, guide, dancer or craft seller straight to their mobile money. No account needed.
        </p>
      </div>

      <div className="space-y-4 rounded-xl bg-background p-6 shadow-lg">
        {/* worker search */}
        <div className="relative">
          <Label htmlFor="worker">Who are you paying?</Label>
          <div className="relative mt-1.5">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
            <Input
              id="worker"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (selected) setSelected(null);
              }}
              onFocus={() => results.length > 0 && setShowResults(true)}
              placeholder="Search by name or phone"
              className="pl-9"
              autoComplete="off"
            />
            {searching && (
              <Loader2 className="-translate-y-1/2 absolute top-1/2 right-3 size-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {showResults && results.length > 0 && !selected && (
            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border bg-popover shadow-md">
              {results.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => pickWorker(w)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{w.name}</span>
                    <span className="block truncate text-muted-foreground text-xs">
                      {w.phone_number}
                      {w.role ? ` · ${w.role}` : ""}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {selected && (
          <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate font-medium text-sm">{selected.name}</p>
              <p className="truncate text-muted-foreground text-xs">
                {selected.phone_number}
                {selected.role ? ` · ${selected.role}` : ""}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={resetWorker} title="Change">
              <X className="size-4" />
            </Button>
          </div>
        )}

        {/* amount */}
        <div>
          <Label htmlFor="amount">Amount (UGX)</Label>
          <Input
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
            inputMode="numeric"
            placeholder="10000"
            className="mt-1.5"
          />
          {feeError && <p className="mt-1 text-destructive text-xs">{feeError}</p>}
          {fee && !feeError && (
            <div className="mt-2 rounded-lg bg-muted/60 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Worker receives approximately</span>
                <span className="font-semibold text-primary tabular-nums">{formatUGX(fee.net_to_beneficiary)}</span>
              </div>
              <p className="mt-1 text-muted-foreground text-xs">
                After gateway fee {formatUGX(fee.gateway_fee)} and service fee {formatUGX(fee.commission)}. Final amount
                confirmed after payment.
              </p>
            </div>
          )}
        </div>

        {/* payer phone */}
        <div>
          <Label htmlFor="payer">Your mobile money number</Label>
          <Input
            id="payer"
            value={payerPhone}
            onChange={(e) => setPayerPhone(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            maxLength={12}
            placeholder="256772123456"
            className="mt-1.5"
          />
          <p className="mt-1 text-muted-foreground text-xs">You'll approve the payment with a prompt on this phone.</p>
        </div>

        {formError && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-destructive text-sm">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <Button className="w-full" onClick={() => void handlePay()} disabled={!canSubmit || submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {fee ? `Pay ${formatUGX(fee.gross)}` : "Pay"}
        </Button>
      </div>
    </div>
  );
}

function ProcessingView({
  payment,
  onResolved,
  onDone,
  onReset,
}: {
  payment: PaymentRecord;
  onResolved: (p: PaymentRecord) => void;
  onDone: () => void;
  onReset: () => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const poll = useCallback(async () => {
    try {
      const updated = await getPaymentStatus(payment.public_id);
      onResolved(updated);
      if (updated.status === "SUCCEEDED" || updated.status === "FAILED" || updated.status === "CANCELLED") {
        onDone();
        return;
      }
    } catch {
      /* keep polling */
    }
    timerRef.current = setTimeout(() => void poll(), 3000);
  }, [payment.public_id, onResolved, onDone]);

  useEffect(() => {
    timerRef.current = setTimeout(() => void poll(), 3000);
    const tick = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      clearInterval(tick);
    };
  }, [poll]);

  return (
    <div className="w-full max-w-md">
      <div className="space-y-4 rounded-xl bg-background p-8 text-center shadow-lg">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10">
          <Smartphone className="size-7 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Check your phone</h3>
          <p className="mt-1 text-muted-foreground text-sm">
            We've sent a payment request to <strong>{payment.payer_msisdn}</strong>. Enter your mobile money PIN to
            approve paying <strong>{payment.beneficiary_name}</strong>.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="size-4 animate-spin" />
          Waiting for approval… {elapsed}s
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-muted-foreground text-xs underline underline-offset-2 hover:text-foreground"
        >
          Cancel and start over
        </button>
      </div>
    </div>
  );
}

function ResultView({ payment, onReset }: { payment: PaymentRecord; onReset: () => void }) {
  const succeeded = payment.status === "SUCCEEDED";
  return (
    <div className="w-full max-w-md">
      <div className="space-y-4 rounded-xl bg-background p-8 text-center shadow-lg">
        <div
          className={`mx-auto flex size-14 items-center justify-center rounded-full ${
            succeeded ? "bg-primary/10" : "bg-destructive/10"
          }`}
        >
          {succeeded ? <Check className="size-7 text-primary" /> : <X className="size-7 text-destructive" />}
        </div>
        <div>
          <h3 className="font-semibold text-lg">{succeeded ? "Payment successful" : "Payment not completed"}</h3>
          {succeeded ? (
            <p className="mt-1 text-muted-foreground text-sm">
              {payment.beneficiary_name} has received <strong>{formatUGX(payment.net_credited ?? "0")}</strong> in their
              wallet. Thank you!
            </p>
          ) : (
            <p className="mt-1 text-muted-foreground text-sm">
              {payment.gateway_status_message || "The payment was not approved. No money was taken."}
            </p>
          )}
        </div>
        <Button variant={succeeded ? "default" : "outline"} className="w-full" onClick={onReset}>
          {succeeded ? "Pay someone else" : "Try again"}
        </Button>
      </div>
    </div>
  );
}
