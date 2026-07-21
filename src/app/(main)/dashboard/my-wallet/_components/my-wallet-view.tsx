"use client";

// "My Wallet" — every user's own balance and transaction history.

import { useCallback, useEffect, useState } from "react";

import { ArrowDownLeft, ArrowUpRight, Loader2, Wallet as WalletIcon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import { formatUGX, getMyLedger, getMyWallet, type LedgerEntry, type Wallet } from "@/lib/api/wallets";
import { cn } from "@/lib/utils";

function EntryRow({ entry }: { entry: LedgerEntry }) {
  const isCredit = entry.direction === "CREDIT";
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex size-7 items-center justify-center rounded-full",
              isCredit ? "bg-primary/10" : "bg-muted",
            )}
          >
            {isCredit ? (
              <ArrowDownLeft className="size-3.5 text-primary" />
            ) : (
              <ArrowUpRight className="size-3.5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-sm">{entry.entry_type_display}</p>
            {entry.description && <p className="truncate text-muted-foreground text-xs">{entry.description}</p>}
          </div>
        </div>
      </TableCell>
      <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
        {new Date(entry.created_at).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </TableCell>
      <TableCell className={cn("text-right font-medium tabular-nums", isCredit ? "text-primary" : "text-foreground")}>
        {isCredit ? "+" : "−"}
        {formatUGX(entry.amount)}
      </TableCell>
      <TableCell className="text-right text-muted-foreground tabular-nums">{formatUGX(entry.balance_after)}</TableCell>
    </TableRow>
  );
}

export function MyWalletView() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [w, e] = await Promise.all([getMyWallet(), getMyLedger()]);
      setWallet(w);
      setEntries(e);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load wallet.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" />
        Loading wallet...
      </div>
    );
  }

  const totalIn = entries
    .filter((e) => e.direction === "CREDIT")
    .reduce((sum, e) => sum + Number.parseFloat(e.amount), 0);
  const totalOut = entries
    .filter((e) => e.direction === "DEBIT")
    .reduce((sum, e) => sum + Number.parseFloat(e.amount), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="sm:col-span-1">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <WalletIcon className="size-4" />
              Available balance
            </div>
            <p className="mt-2 font-semibold text-3xl tabular-nums">{wallet ? formatUGX(wallet.balance) : "—"}</p>
            {wallet?.is_frozen && (
              <Badge variant="outline" className="mt-2">
                Frozen
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">Total received</p>
            <p className="mt-2 font-semibold text-2xl text-primary tabular-nums">{formatUGX(totalIn)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">Total paid out</p>
            <p className="mt-2 font-semibold text-2xl tabular-nums">{formatUGX(totalOut)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction history</CardTitle>
          <CardDescription>Every movement in and out of your wallet.</CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No transactions yet. Payments you receive will appear here.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance after</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <EntryRow key={entry.id} entry={entry} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
