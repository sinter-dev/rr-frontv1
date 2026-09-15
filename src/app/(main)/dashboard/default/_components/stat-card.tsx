"use client";

// Small stat tile used across the dashboard home. `tone` gives each card
// a distinct, light brand-adjacent color so a row of stats doesn't read
// as flat gray; `highlight` (unchanged) is a stronger emphasis for the
// single "headline" stat in a row.

import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StatTone = "green" | "amber" | "blue" | "violet" | "rose" | "teal";

const TONE_STYLES: Record<StatTone, string> = {
  green: "bg-primary/10 text-primary",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
};

interface Props {
  label: string;
  value: number | string;
  icon: LucideIcon;
  hint?: string;
  highlight?: boolean;
  tone?: StatTone;
}

export function StatCard({ label, value, icon: Icon, hint, highlight, tone }: Props) {
  const toneClass = highlight ? TONE_STYLES.green : tone ? TONE_STYLES[tone] : "bg-muted text-muted-foreground";

  return (
    <Card className={cn(highlight && "border-primary/40")}>
      <CardContent className="flex items-start justify-between gap-3 pt-6">
        <div className="min-w-0">
          <p className="truncate text-muted-foreground text-sm">{label}</p>
          <p className="mt-1 font-semibold text-2xl tabular-nums">{value}</p>
          {hint && <p className="mt-1 text-muted-foreground text-xs">{hint}</p>}
        </div>
        <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", toneClass)}>
          <Icon className="size-4" />
        </div>
      </CardContent>
    </Card>
  );
}
