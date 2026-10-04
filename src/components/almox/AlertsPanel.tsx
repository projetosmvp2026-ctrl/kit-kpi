import { AlertTriangle, BellRing, CheckCircle2 } from "lucide-react";
import {
  type AlmoxData,
  type MonthlyRecord,
  METRICS,
  brl,
  metricValue,
  statusOf,
} from "@/lib/almox";

interface Alert {
  level: "critico" | "alerta";
  title: string;
  detail: string;
}

export function buildAlerts(data: AlmoxData, rec: MonthlyRecord): Alert[] {
  const list: Alert[] = [];
  const below = data.criticalItems.filter((i) => i.kind === "abaixo_minimo");
  for (const i of below) {
    list.push({
      level: "critico",
      title: `Estoque abaixo do mínimo: ${i.name}`,
      detail: `${i.code}${i.qty !== undefined ? ` · ${i.qty} un.` : ""} · ${brl(i.value)}`,
    });
  }
  if (rec.collectionsLate > 0)
    list.push({
      level: "critico",
      title: `${rec.collectionsLate} coleta(s) atrasada(s)`,
      detail: "Verifique transportadora e fornecedor.",
    });
  if (rec.collectionsPending > 0)
    list.push({ level: "alerta", title: `${rec.collectionsPending} coleta(s) pendente(s)`, detail: "Aguardando realização." });
  if (rec.stockouts > 0)
    list.push({ level: "critico", title: `${rec.stockouts} ruptura(s) no mês`, detail: "Itens faltaram no atendimento." });
  for (const m of METRICS) {
    if (m.direction === "info" || ["collectionsLate", "collectionsPending", "stockouts"].includes(m.key)) continue;
    if (statusOf(metricValue(rec, m), data.targets[m.key] ?? 0, m.direction) === "critico")
      list.push({ level: "alerta", title: `${m.label} fora da meta`, detail: "Indicador em vermelho neste mês." });
  }
  return list;
}

export function AlertsPanel({ data, rec }: { data: AlmoxData; rec: MonthlyRecord }) {
  const alerts = buildAlerts(data, rec);
  return (
    <section className="rounded-2xl border border-border/60 bg-card/40 p-5">
      <div className="mb-3 flex items-center gap-2">
        <BellRing className="size-4 text-muted-foreground" />
        <h2 className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Alertas do mês ({alerts.length})
        </h2>
      </div>
      {alerts.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="size-4 text-primary" /> Nenhum alerta. Tudo dentro do esperado.
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {alerts.map((a, i) => (
            <li key={i} className="flex items-start gap-2 rounded-xl border border-border/50 p-3">
              <AlertTriangle
                className={a.level === "critico" ? "mt-0.5 size-4 shrink-0 text-destructive" : "mt-0.5 size-4 shrink-0 text-accent"}
              />
              <div>
                <p className="text-sm font-medium leading-tight">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
