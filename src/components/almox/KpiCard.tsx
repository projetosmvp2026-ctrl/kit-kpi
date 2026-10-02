import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import {
  type MetricDef,
  type Status,
  STATUS_LABEL,
  formatMetric,
  statusOf,
  variation,
} from "@/lib/almox";
import { statusDot, statusText } from "./status";
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
        "relative flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/40 p-6 transition-colors hover:border-border",
        compact && "gap-3 p-5",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {metric.label}
        </p>
        <span className={cn("mt-1 size-2.5 shrink-0 rounded-full", statusDot[status])} aria-hidden />
      </div>

      <p className={cn("tabular font-display text-4xl font-light tracking-tight", compact && "text-3xl")}>
        {formatMetric(metric.unit, value)}
      </p>

      {metric.formula ? (
        <p className="text-[0.7rem] text-muted-foreground/80">
          {metric.formula}
        </p>
      ) : null}

      {extra ? <p className="text-xs text-muted-foreground">{extra}</p> : null}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3 text-xs">
        <span className={cn("font-medium", statusText[status])}>{STATUS_LABEL[status]}</span>
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
