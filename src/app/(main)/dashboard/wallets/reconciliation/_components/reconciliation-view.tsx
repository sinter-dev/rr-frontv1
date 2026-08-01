"use client";

// Reconciliation (super admin): compares the money owed to workers (live
// wallet liability) against the actual Yo float. Confirms solvency and
// surfaces the gap, which should be accumulated fees.

import { useCallback, useEffect, useState } from "react";

import { CircleCheck, Loader2, RefreshCw, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ApiError } from "@/lib/api/client";
import { formatUGX, getReconciliation, type Reconciliation } from "@/lib/api/wallets";

export function ReconciliationView() {
  const [data, setData] = useState<Reconciliation | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await getReconciliation());
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load reconciliation.");
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
        Checking the books…
      </div>
    );
  }

  const hasFloat = data?.float_balance != null;
  const covers = data?.covers_liability;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-xl">Reconciliation</h2>
          <p className="text-muted-foreground text-sm">Does your gateway float cover what you owe workers?</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </div>

      {data && !data.is_live_gateway && (
        <Alert>
          <TriangleAlert className="size-4" />
          <AlertTitle>Simulated figures</AlertTitle>
          <AlertDescription>
            The live gateway isn't enabled here, so the float shown is a stand-in for testing. Run this on the
            production server to reconcile against your real Yo balance.
          </AlertDescription>
        </Alert>
      )}

      {data?.gateway_error && (
        <Alert variant="destructive">
          <TriangleAlert className="size-4" />
          <AlertTitle>Couldn't reach the gateway</AlertTitle>
          <AlertDescription>{data.gateway_error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">Owed to workers</p>
            <p className="mt-2 font-semibold text-2xl tabular-nums">{data ? formatUGX(data.total_liability) : "—"}</p>
            <p className="mt-1 text-muted-foreground text-xs">Total live wallet balances.</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">Gateway float</p>
            <p className="mt-2 font-semibold text-2xl tabular-nums">
              {hasFloat && data ? formatUGX(data.float_balance ?? "0") : "—"}
            </p>
            <p className="mt-1 text-muted-foreground text-xs">Actual balance at Yo.</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">Difference</p>
            <p className={`mt-2 font-semibold text-2xl tabular-nums ${covers === false ? "text-destructive" : ""}`}>
              {data?.difference != null ? formatUGX(data.difference) : "—"}
            </p>
            <p className="mt-1 text-muted-foreground text-xs">Float minus liability.</p>
          </CardContent>
        </Card>
      </div>

      {hasFloat && (
        <Card>
          <CardHeader>
            <CardTitle>Solvency</CardTitle>
            <CardDescription>Whether your float can cover all withdrawals.</CardDescription>
          </CardHeader>
          <CardContent>
            {covers ? (
              <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
                <CircleCheck className="mt-0.5 size-5 text-primary" />
                <div>
                  <p className="font-medium">Float covers your liability</p>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Your gateway balance exceeds what you owe workers by{" "}
                    {data?.difference ? formatUGX(data.difference) : "—"}. This surplus is expected to be your
                    accumulated fees. Everyone could withdraw in full right now.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
                <TriangleAlert className="mt-0.5 size-5 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">Float is below your liability</p>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Your gateway balance is less than what you owe workers. Not everyone could withdraw at once.
                    Investigate before processing more payouts — check for pending settlements or top up your float.
                  </p>
                </div>
              </div>
            )}

            <Separator className="my-4" />
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <span>Gateway mode:</span>
              {data?.is_live_gateway ? (
                <Badge variant="secondary">Live</Badge>
              ) : (
                <Badge variant="outline">Test / simulated</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
