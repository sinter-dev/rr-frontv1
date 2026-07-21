"use client";

// Super admin manual credit/debit. Every adjustment requires a reason,
// which is stored permanently on the immutable ledger entry.

import { useEffect, useState } from "react";

import { Loader2 } from "lucide-react";
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
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import { adjustWallet, formatUGX, type LedgerDirection, type Wallet } from "@/lib/api/wallets";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallet: Wallet | null;
  userId: number | null;
  onSaved: () => void;
}

export function AdjustWalletDialog({ open, onOpenChange, wallet, userId, onSaved }: Props) {
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<LedgerDirection>("CREDIT");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (open) {
      setAmount("");
      setDirection("CREDIT");
      setReason("");
      setErrors({});
    }
  }, [open]);

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    setErrors({});
    try {
      const res = await adjustWallet(userId, { amount, direction, reason });
      toast.success(`${res.message} New balance: ${formatUGX(res.wallet.balance)}`);
      onSaved();
      onOpenChange(false);
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

  const canSubmit = amount.trim() !== "" && Number.parseFloat(amount) > 0 && reason.trim() !== "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust wallet</DialogTitle>
          <DialogDescription>
            {wallet
              ? `${wallet.owner_name} · current balance ${formatUGX(wallet.balance)}`
              : "Post a manual entry to this wallet."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <Field>
            <FieldLabel htmlFor="adj-direction">Type</FieldLabel>
            <Select value={direction} onValueChange={(v) => setDirection(v as LedgerDirection)}>
              <SelectTrigger id="adj-direction">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CREDIT">Credit — add money to this wallet</SelectItem>
                <SelectItem value="DEBIT">Debit — take money out</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field data-invalid={!!errors.amount}>
            <FieldLabel htmlFor="adj-amount">Amount (UGX)</FieldLabel>
            <Input
              id="adj-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              inputMode="decimal"
              placeholder="5000"
              aria-invalid={!!errors.amount}
            />
            {errors.amount && <FieldError errors={errors.amount.map((m) => ({ message: m }))} />}
          </Field>

          <Field data-invalid={!!errors.reason}>
            <FieldLabel htmlFor="adj-reason">Reason</FieldLabel>
            <Textarea
              id="adj-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="e.g. Correction for duplicate charge on 12 Jan"
              aria-invalid={!!errors.reason}
            />
            <FieldDescription>
              Stored permanently on the ledger entry. Be specific — this is the audit trail.
            </FieldDescription>
            {errors.reason && <FieldError errors={errors.reason.map((m) => ({ message: m }))} />}
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving || !canSubmit}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Post adjustment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
