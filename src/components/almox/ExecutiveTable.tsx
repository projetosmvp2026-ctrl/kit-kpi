import {
  METRICS,
  type MonthlyRecord,
  type Targets,
  STATUS_LABEL,
  formatMetric,
  monthLabelLong,
  statusOf,
  variation,
} from "@/lib/almox";
import { statusChip, statusDot } from "./status";
import { cn } from "@/lib/utils";

interface Props {
  current: MonthlyRecord;
  previous?: MonthlyRecord;
  targets: Targets;
}

export function ExecutiveTable({ current, previous, targets }: Props) {
  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-5 py-4">
        <h2 className="font-display text-lg font-semibold">Visão executiva comparativa</h2>
        <p className="text-xs text-muted-foreground">
          {monthLabelLong(current.month)}
          {previous ? ` × ${monthLabelLong(previous.month)}` : ""} × Meta
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[46rem] text-sm">
          <thead>
            <tr className="text-left text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">
              <th className="px-5 py-3 font-medium">Indicador</th>
              <th className="px-3 py-3 text-right font-medium">Mês atual</th>
              <th className="px-3 py-3 text-right font-medium">Mês anterior</th>
              <th className="px-3 py-3 text-right font-medium">Meta</th>
              <th className="px-3 py-3 text-right font-medium">Variação</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {METRICS.map((m) => {
              const v = current[m.key];
              const p = previous?.[m.key];
              const t = targets[m.key];
              const st = statusOf(v, t, m.direction);
              const varPct = variation(v, p);
              const improving =
                varPct === null ? null : m.direction === "up" ? varPct >= 0 : varPct <= 0;
              return (
                <tr key={m.key} className="border-t border-border/70">
                  <td className="px-5 py-3">
                    <span className="font-medium">{m.label}</span>
                    <span className="block text-xs text-muted-foreground">{m.help}</span>
                  </td>
                  <td className="tabular px-3 py-3 text-right font-semibold">
                    {formatMetric(m.unit, v)}
                  </td>
                  <td className="tabular px-3 py-3 text-right text-muted-foreground">
                    {p === undefined ? "—" : formatMetric(m.unit, p)}
                  </td>
                  <td className="tabular px-3 py-3 text-right text-muted-foreground">
                    {formatMetric(m.unit, t)}
                  </td>
                  <td
                    className={cn(
                      "tabular px-3 py-3 text-right font-medium",
                      improving === null
                        ? "text-muted-foreground"
                        : improving
                          ? "text-success"
                          : "text-danger",
                    )}
                  >
                    {varPct === null
                      ? "—"
                      : `${varPct > 0 ? "+" : ""}${varPct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium",
                        statusChip[st],
                      )}
                    >
                      <span className={cn("size-2 rounded-full", statusDot[st])} aria-hidden />
                      {STATUS_LABEL[st]}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
