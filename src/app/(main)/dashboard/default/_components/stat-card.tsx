"use client";

// Small stat tile used across the dashboard home.

import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: number | string;
  icon: LucideIcon;
  hint?: string;
  highlight?: boolean;
}

export function StatCard({ label, value, icon: Icon, hint, highlight }: Props) {
  return (
    <Card className={cn(highlight && "border-primary/40")}>
      <CardContent className="flex items-start justify-between gap-3 pt-6">
        <div className="min-w-0">
          <p className="truncate text-muted-foreground text-sm">{label}</p>
          <p className="mt-1 font-semibold text-2xl tabular-nums">{value}</p>
          {hint && <p className="mt-1 text-muted-foreground text-xs">{hint}</p>}
        </div>
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted",
            highlight && "bg-primary/10",
          )}
        >
          <Icon className={cn("size-4 text-muted-foreground", highlight && "text-primary")} />
        </div>
      </CardContent>
    </Card>
  );
}
