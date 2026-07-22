"use client";

// Withdraw dialog. Shows the worker their withdrawable maximum, quotes
// "you'll receive ~X, balance will be Y" live as they type, then executes
// to their OWN registered phone and polls the result.

import { useCallback, useEffect, useRef, useState } from "react";

import { Check, Loader2, Smartphone, TriangleAlert, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ApiError } from "@/lib/api/client";
import {
  formatUGX,
  getPayoutStatus,
  getWithdrawalInfo,
  type PayoutRecord,
  quoteWithdrawal,
  requestWithdrawal,
  type WithdrawalInfo,
  type WithdrawalQuote,
} from "@/lib/api/wallets";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void; // refresh the wallet after a finished withdrawal
}

type Phase = "form" | "processing" | "done";

export function WithdrawDialog({ open, onOpenChange, onDone }: Props) {
  const [phase, setPhase] = useState<Phase>("form");
  const [info, setInfo] = useState<WithdrawalInfo | null>(null);
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<WithdrawalQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [payout, setPayout] = useState<PayoutRecord | null>(null);

  // load rules/balance when opened
  useEffect(() => {
    if (!open) return;
    setPhase("form");
    setAmount("");
    setQuote(null);
    setQuoteError(null);
    setPayout(null);
    getWithdrawalInfo()
      .then(setInfo)
      .catch(() => toast.error("Could not load withdrawal details."));
  }, [open]);

  // live quote (debounced)
  useEffect(() => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      setQuote(null);
      setQuoteError(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setQuote(await quoteWithdrawal(amount));
        setQuoteError(null);
      } catch (error) {
        setQuote(null);
        if (error instanceof ApiError) {
          setQuoteError(error.fieldErrors?.amount?.[0] ?? error.message);
        } else {
          setQuoteError("Could not price this amount.");
        }
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [amount]);

  async function handleWithdraw() {
    setSubmitting(true);
    try {
      const rec = await requestWithdrawal(amount);
      setPayout(rec);
      if (rec.status === "SUCCEEDED" || rec.status === "FAILED") {
        setPhase("done");
        onDone();
      } else {
        setPhase("processing");
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.fieldErrors?.amount?.[0] ?? error.message);
      } else {
        toast.error("Withdrawal could not be started.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = quote !== null && !quoteError && info?.can_withdraw;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {phase === "form" && (
          <>
            <DialogHeader>
              <DialogTitle>Withdraw to mobile money</DialogTitle>
              <DialogDescription>
                {info
                  ? `Sent to your number ${info.recipient}. You can withdraw up to ${formatUGX(
                      info.withdrawable_maximum,
                    )} right now.`
                  : "Loading…"}
              </DialogDescription>
            </DialogHeader>

            {info && !info.can_withdraw ? (
              <div className="flex items-start gap-2 rounded-lg bg-muted p-3 text-sm">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">
                  You need at least {formatUGX(info.min_balance_to_withdraw)} in your wallet to withdraw. Your balance
                  is {formatUGX(info.balance)}.
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-4 py-2">
                <Field data-invalid={!!quoteError}>
                  <FieldLabel htmlFor="wd-amount">Amount to withdraw (UGX)</FieldLabel>
                  <Input
                    id="wd-amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
                    inputMode="numeric"
                    placeholder={info ? info.min_withdrawal : "1000"}
                    aria-invalid={!!quoteError}
                  />
                  {quoteError && <FieldError errors={[{ message: quoteError }]} />}
                </Field>

                {quote && !quoteError && (
                  <div className="rounded-lg bg-muted/60 p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">You'll receive approximately</span>
                      <span className="font-semibold text-primary tabular-nums">
                        {formatUGX(quote.estimated_received)}
                      </span>
                    </div>
                    <div className="mt-1 flex justify-between text-muted-foreground text-xs">
                      <span>After gateway fee {formatUGX(quote.estimated_fee)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Balance after withdrawal</span>
                      <span className="tabular-nums">{formatUGX(quote.reserve_after)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={() => void handleWithdraw()} disabled={!canSubmit || submitting}>
                {submitting && <Loader2 className="size-4 animate-spin" />}
                {quote ? `Withdraw ${formatUGX(quote.amount)}` : "Withdraw"}
              </Button>
            </DialogFooter>
          </>
        )}

        {phase === "processing" && payout && (
          <ProcessingPayout
            payout={payout}
            onResolved={setPayout}
            onDone={() => {
              setPhase("done");
              onDone();
            }}
          />
        )}

        {phase === "done" && payout && <PayoutResult payout={payout} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function ProcessingPayout({
  payout,
  onResolved,
  onDone,
}: {
  payout: PayoutRecord;
  onResolved: (p: PayoutRecord) => void;
  onDone: () => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const poll = useCallback(async () => {
    try {
      const updated = await getPayoutStatus(payout.public_id);
      onResolved(updated);
      if (updated.status === "SUCCEEDED" || updated.status === "FAILED") {
        onDone();
        return;
      }
    } catch {
      /* keep polling */
    }
    timerRef.current = setTimeout(() => void poll(), 3000);
  }, [payout.public_id, onResolved, onDone]);

  useEffect(() => {
    timerRef.current = setTimeout(() => void poll(), 3000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [poll]);

  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
        <Smartphone className="size-7 text-primary" />
      </div>
      <div>
        <h3 className="font-semibold text-lg">Sending your money</h3>
        <p className="mt-1 text-muted-foreground text-sm">
          We're sending {formatUGX(payout.estimated_received)} to {payout.recipient_msisdn}. This usually takes a
          moment.
        </p>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="size-4 animate-spin" />
        Processing…
      </div>
    </div>
  );
}

function PayoutResult({ payout, onClose }: { payout: PayoutRecord; onClose: () => void }) {
  const succeeded = payout.status === "SUCCEEDED";
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div
        className={`flex size-14 items-center justify-center rounded-full ${
          succeeded ? "bg-primary/10" : "bg-destructive/10"
        }`}
      >
        {succeeded ? <Check className="size-7 text-primary" /> : <X className="size-7 text-destructive" />}
      </div>
      <div>
        <h3 className="font-semibold text-lg">{succeeded ? "Money sent" : "Withdrawal didn't go through"}</h3>
        <p className="mt-1 text-muted-foreground text-sm">
          {succeeded
            ? `${formatUGX(payout.actual_received ?? payout.estimated_received)} is on its way to ${payout.recipient_msisdn}.`
            : `${payout.gateway_status_message || "The withdrawal failed."} Your money has been returned to your wallet.`}
        </p>
      </div>
      <Button className="w-full" variant={succeeded ? "default" : "outline"} onClick={onClose}>
        Done
      </Button>
    </div>
  );
}
