"use client";

// Super admin's wallet overview. The headline number is the FLOAT
// LIABILITY — the total the platform owes its workers. In Step 2 this
// gets reconciled against the actual Yo account balance.

import { useCallback, useEffect, useState } from "react";

import { Loader2, Search, Wallet as WalletIcon, Wrench } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import { type AdminWalletList, formatUGX, listWallets, type Wallet } from "@/lib/api/wallets";

import { AdjustWalletDialog } from "./adjust-wallet-dialog";

export function AdminWalletsView() {
  const [data, setData] = useState<AdminWalletList | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [adjusting, setAdjusting] = useState<Wallet | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await listWallets(search || undefined));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load wallets.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 300); // debounce the search
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-primary/40">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <WalletIcon className="size-4" />
              Total held for workers
            </div>
            <p className="mt-2 font-semibold text-3xl tabular-nums">{data ? formatUGX(data.total_balance) : "—"}</p>
            <p className="mt-1 text-muted-foreground text-xs">
              Real money owed. Your gateway float should cover at least this.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              Test balance
              <Badge variant="outline" className="text-[10px]">
                Test
              </Badge>
            </div>
            <p className="mt-2 font-semibold text-3xl tabular-nums">
              {data ? formatUGX(data.total_test_balance) : "—"}
            </p>
            <p className="mt-1 text-muted-foreground text-xs">
              Not real money. From testing; excluded from what you owe.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">Wallets</p>
            <p className="mt-2 font-semibold text-3xl tabular-nums">{data?.wallet_count ?? "—"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All wallets</CardTitle>
          <CardDescription>Balances held by each worker.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4 max-w-sm">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or phone"
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 size-5 animate-spin" />
              Loading...
            </div>
          ) : !data || data.wallets.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {search ? "No wallets match that search." : "No wallets yet."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Owner</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Test</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.wallets.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">{w.owner_name}</TableCell>
                    <TableCell>{w.phone_number}</TableCell>
                    <TableCell>
                      {w.is_frozen ? (
                        <Badge variant="outline">Frozen</Badge>
                      ) : (
                        <Badge variant="secondary">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatUGX(w.balance_live)}</TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {Number.parseFloat(w.balance_test) > 0 ? formatUGX(w.balance_test) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setAdjusting(w)}>
                        <Wrench className="size-4" />
                        Adjust
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AdjustWalletDialog
        open={!!adjusting}
        onOpenChange={(o) => !o && setAdjusting(null)}
        wallet={adjusting}
        userId={adjusting ? adjusting.user_id : null}
        onSaved={load}
      />
    </div>
  );
}
