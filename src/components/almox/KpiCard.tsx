import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import {
  type MetricDef,
  type Status,
  STATUS_LABEL,
  formatMetric,
  statusOf,
  variation,
} from "@/lib/almox";
import { statusChip, statusDot, statusRing, statusText } from "./status";
import { cn } from "@/lib/utils";

interface Props {
  metric: MetricDef;
  value: number;
  previous?: number | undefined;
  target: number;
  extra?: string | undefined;
  compact?: boolean | undefined;
}

export function KpiCard({ metric, value, previous, target, extra, compact }: Props) {
  const status: Status = statusOf(value, target, metric.direction);
  const varPct = variation(value, previous);
  const improving =
    varPct === null || metric.direction === "info"
      ? null
      : metric.direction === "up"
        ? varPct >= 0
        : varPct <= 0;

  return (
    <div
      className={cn(
        "panel relative flex flex-col gap-3 overflow-hidden p-5 transition-colors",
        statusRing[status],
        compact && "gap-2 p-4",
      )}
    >
      <span
        className={cn("absolute inset-x-0 top-0 h-[3px]", statusDot[status], "opacity-80")}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.72rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {metric.label}
        </p>
        <span className={cn("mt-1 size-2.5 shrink-0 rounded-full", statusDot[status])} aria-hidden />
      </div>

      <p className={cn("tabular font-display text-3xl font-semibold", compact && "text-2xl")}>
        {formatMetric(metric.unit, value)}
      </p>

      {metric.formula ? (
        <p className="rounded-md bg-surface-2/70 px-2 py-1 text-[0.7rem] text-accent">
          {metric.formula}
        </p>
      ) : null}

      {extra ? <p className="text-xs text-muted-foreground">{extra}</p> : null}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1 text-xs">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium",
            statusChip[status],
          )}
        >
          {STATUS_LABEL[status]}
        </span>
        {metric.direction !== "info" && (
          <span className="tabular text-muted-foreground">
            Meta {formatMetric(metric.unit, target)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-xs">
        {varPct === null ? (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Minus className="size-3.5" /> sem base anterior
          </span>
        ) : (
          <span
            className={cn(
              "tabular inline-flex items-center gap-1 font-medium",
              improving === null
                ? "text-muted-foreground"
                : improving
                  ? statusText.ok
                  : statusText.critico,
            )}
          >
            {varPct >= 0 ? (
              <ArrowUpRight className="size-3.5" />
            ) : (
              <ArrowDownRight className="size-3.5" />
            )}
            {Math.abs(varPct).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
            <span className="font-normal text-muted-foreground">vs. mês anterior</span>
          </span>
        )}
      </div>
    </div>
  );
}
