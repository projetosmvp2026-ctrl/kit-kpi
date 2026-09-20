import { ChevronRight, Timer } from "lucide-react";
import { type FlowStage, bottleneckStage } from "@/lib/almox";
import { cn } from "@/lib/utils";

const hours = (v: number) =>
  `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} h`;

export function FlowStages({ stages }: { stages: FlowStage[] }) {
  const total = stages.reduce((s, st) => s + st.hours, 0);
  const worst = bottleneckStage(stages);
  const max = worst?.hours ?? 1;

  return (
    <div className="panel p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-base font-semibold">
            Fluxo da coleta · onde o material fica retido
          </h3>
          <p className="text-xs text-muted-foreground">
            Solicitação → Separação → Emissão → Coleta → Transporte → Entrega
          </p>
        </div>
        <span className="tabular inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2/60 px-3 py-1 text-xs text-muted-foreground">
          <Timer className="size-3.5" /> Ciclo total {hours(total)}
        </span>
      </div>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
        {stages.map((s, i) => {
          const isWorst = worst?.key === s.key;
          const share = total ? (s.hours / total) * 100 : 0;
          return (
            <div key={s.key} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "flex-1 rounded-xl border p-3 transition-colors",
                  isWorst
                    ? "border-danger/50 bg-danger/10"
                    : "border-border bg-surface-2/50",
                )}
              >
                <p className="text-[0.68rem] uppercase tracking-[0.12em] text-muted-foreground">
                  Etapa {i + 1}
                </p>
                <p className="mt-0.5 text-sm font-semibold">{s.label}</p>
                <p
                  className={cn(
                    "tabular font-display text-xl font-semibold",
                    isWorst ? "text-danger" : "text-foreground",
                  )}
                >
                  {hours(s.hours)}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border/70">
                  <div
                    className={cn("h-full rounded-full", isWorst ? "bg-danger" : "bg-accent")}
                    style={{ width: `${max ? (s.hours / max) * 100 : 0}%` }}
                  />
                </div>
                <p className="tabular mt-1 text-[0.7rem] text-muted-foreground">
                  {share.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}% do ciclo
                  {isWorst ? " · gargalo" : ""}
                </p>
              </div>
              {i < stages.length - 1 && (
                <ChevronRight
                  className="hidden size-4 shrink-0 text-muted-foreground lg:block"
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>

      {worst && (
        <p className="mt-4 rounded-lg border border-warning/35 bg-warning/10 px-3 py-2 text-xs text-warning">
          Maior retenção na etapa <strong>{worst.label}</strong> ({hours(worst.hours)}) — foco de
          ação para reduzir o tempo total de coleta.
        </p>
      )}
    </div>
  );
}
