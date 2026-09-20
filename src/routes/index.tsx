import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Download,
  FileSpreadsheet,
  Maximize2,
  Minimize2,
  PencilLine,
  RotateCcw,
  Truck,
  Warehouse,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KpiCard } from "@/components/almox/KpiCard";
import { ExecutiveTable } from "@/components/almox/ExecutiveTable";
import {
  CriticalItemsChart,
  QualityChart,
  StockEvolutionChart,
} from "@/components/almox/Charts";
import {
  CollectionsVolumeChart,
  DelayReasonsChart,
} from "@/components/almox/CollectionsCharts";
import { FlowStages } from "@/components/almox/FlowStages";
import { DataEntryDialog } from "@/components/almox/DataEntryDialog";
import { ImportDialog } from "@/components/almox/ImportDialog";
import { statusChip, statusDot } from "@/components/almox/status";
import { useAlmoxData } from "@/hooks/use-almox-data";
import {
  GROUP_LABEL,
  METRICS,
  type MetricGroup,
  STATUS_LABEL,
  bottleneckStage,
  brl,
  collectionsFulfillment,
  collectionsSla,
  downloadText,
  metricValue,
  monthLabelLong,
  monthReportCsv,
  previousOf,
  recordsToCsv,
  sortRecords,
  statusOf,
} from "@/lib/almox";
import { cn } from "@/lib/utils";

const TITLE = "Painel de Indicadores do Almoxarifado";
const DESCRIPTION =
  "Dashboard executivo do almoxarifado: estoque, atendimento, controle, risco e o módulo de coletas com SLA, pendências, atrasos e gargalos por etapa do fluxo.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${TITLE} | Gestão de Estoques e Coletas` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const BLOCKS: MetricGroup[] = ["estoque", "atendimento", "controle", "risco"];

function Dashboard() {
  const {
    data,
    hydrated,
    upsertRecord,
    upsertMany,
    setTargets,
    setStages,
    setDelayReasons,
    reset,
  } = useAlmoxData();
  const [month, setMonth] = useState<string>("");
  const [entryOpen, setEntryOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [presenting, setPresenting] = useState(false);

  const sorted = useMemo(() => sortRecords(data.records), [data.records]);

  useEffect(() => {
    const last = sorted[sorted.length - 1];
    if (!last) return;
    if (!month || !sorted.some((r) => r.month === month)) {
      setMonth(last.month);
    }
  }, [sorted, month]);

  const current = sorted.find((r) => r.month === month) ?? sorted[sorted.length - 1];
  const previous = current ? previousOf(data.records, current.month) : undefined;

  const history = useMemo(() => {
    if (!current) return sorted;
    const idx = sorted.findIndex((r) => r.month === current.month);
    return sorted.slice(Math.max(0, idx - 11), idx + 1);
  }, [sorted, current]);

  const overall = useMemo(() => {
    const acc = { ok: 0, alerta: 0, critico: 0, info: 0 };
    if (!current) return acc;
    for (const m of METRICS) {
      acc[statusOf(metricValue(current, m), data.targets[m.key] ?? 0, m.direction)] += 1;
    }
    return acc;
  }, [current, data.targets]);

  const scored = METRICS.filter((m) => m.direction !== "info").length;

  const togglePresentation = async () => {
    const next = !presenting;
    setPresenting(next);
    try {
      if (next) await document.documentElement.requestFullscreen?.();
      else if (document.fullscreenElement) await document.exitFullscreen?.();
    } catch {
      /* tela cheia indisponível: modo visual continua ativo */
    }
  };

  const saveFlow = (stages: typeof data.stages, reasons: typeof data.delayReasons) => {
    setStages(stages);
    setDelayReasons(reasons);
  };

  if (!current) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold">Nenhum mês cadastrado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Importe uma planilha ou lance os valores do mês para começar.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={() => setEntryOpen(true)}>
            <PencilLine className="size-4" /> Lançar indicadores
          </Button>
          <Button variant="secondary" onClick={reset}>
            <RotateCcw className="size-4" /> Restaurar exemplo
          </Button>
        </div>
        <DataEntryDialog
          open={entryOpen}
          onOpenChange={setEntryOpen}
          records={data.records}
          targets={data.targets}
          stages={data.stages}
          delayReasons={data.delayReasons}
          initialMonth={new Date().toISOString().slice(0, 7)}
          onSaveRecord={upsertRecord}
          onSaveTargets={setTargets}
          onSaveFlow={saveFlow}
        />
      </main>
    );
  }

  const deadPct = current.totalValue ? (current.deadStockValue / current.totalValue) * 100 : 0;
  const fulfillment = collectionsFulfillment(current);
  const sla = collectionsSla(current);
  const worstStage = bottleneckStage(data.stages);
  const topReason = [...data.delayReasons].sort((a, b) => b.count - a.count)[0];

  const extras: Partial<Record<string, string>> = {
    deadStockValue: `${deadPct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% do estoque total`,
    inventoryLossValue: "Ajuste de inventário acumulado no mês",
    criticalItemsCount:
      current.criticalItemsCount > (data.targets.criticalItemsCount ?? 0)
        ? "Reposição urgente exigida"
        : "Dentro do limite tolerado",
    stockouts: `${current.stockouts} ocorrência(s) de falta`,
    collectionsRequested: `${current.collectionsUrgent} urgente(s) no período`,
    collectionsCompleted: `${fulfillment.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% das solicitações`,
    collectionsFulfillmentPct: `${current.collectionsCompleted} de ${current.collectionsRequested} solicitações`,
    collectionsPending: "Solicitações em aberto no fechamento",
    collectionsLate: topReason ? `Principal motivo: ${topReason.label}` : "Fora do prazo acordado",
    collectionsSlaPct: `${current.collectionsOnTime} de ${current.collectionsCompleted} coletas no prazo`,
    collectionsAvgHours: `≈ ${(current.collectionsAvgHours / 24).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} dia(s) da solicitação à coleta`,
    collectionsUrgent: "Atendimentos fora do planejamento",
  };

  const renderBlock = (group: MetricGroup) => (
    <section key={group} className="space-y-3" aria-label={`Indicadores de ${GROUP_LABEL[group]}`}>
      <h2 className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {GROUP_LABEL[group]}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {METRICS.filter((m) => m.group === group).map((m) => (
          <KpiCard
            key={m.key}
            metric={m}
            value={metricValue(current, m)}
            previous={previous ? metricValue(previous, m) : undefined}
            target={data.targets[m.key] ?? 0}
            extra={extras[m.key]}
            compact
          />
        ))}
      </div>
    </section>
  );

  return (
    <main className={cn("min-h-screen px-4 py-6 sm:px-8 lg:px-10", presenting && "py-10")}>
      <div className="mx-auto max-w-[96rem] space-y-6">
        <header className="panel flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary">
              <Warehouse className="size-6" />
            </span>
            <div>
              <p className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
                Reunião de diretoria · Suprimentos
              </p>
              <h1
                className={cn(
                  "font-display text-2xl font-semibold leading-tight",
                  presenting && "text-3xl",
                )}
              >
                Painel de Indicadores do Almoxarifado
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Fechamento de {monthLabelLong(current.month)}
                {previous ? ` · comparado a ${monthLabelLong(previous.month)}` : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={current.month} onValueChange={setMonth}>
              <SelectTrigger className="w-[11rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[...sorted].reverse().map((r) => (
                  <SelectItem key={r.month} value={r.month}>
                    {monthLabelLong(r.month)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {!presenting && (
              <>
                <Button onClick={() => setEntryOpen(true)}>
                  <PencilLine className="size-4" /> Lançar dados
                </Button>
                <Button variant="secondary" onClick={() => setImportOpen(true)}>
                  <FileSpreadsheet className="size-4" /> Importar CSV
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    downloadText(
                      `reuniao-almoxarifado-${current.month}.csv`,
                      monthReportCsv(data, current.month),
                    );
                    toast.success("Resumo do mês exportado para a reunião.");
                  }}
                >
                  <Download className="size-4" /> Exportar mês
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    downloadText("historico-kpis-almoxarifado.csv", recordsToCsv(data.records));
                    toast.success("Histórico completo exportado.");
                  }}
                >
                  Histórico
                </Button>
              </>
            )}
            <Button variant="outline" onClick={togglePresentation}>
              {presenting ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              {presenting ? "Sair da apresentação" : "Modo apresentação"}
            </Button>
          </div>
        </header>

        <section className="panel flex flex-wrap items-center gap-4 p-4 text-sm">
          <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Farol do mês
          </span>
          {(["ok", "alerta", "critico"] as const).map((s) => (
            <span
              key={s}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
                statusChip[s],
              )}
            >
              <span className={cn("size-2 rounded-full", statusDot[s])} aria-hidden />
              {STATUS_LABEL[s]}: {overall[s]} de {scored}
            </span>
          ))}
          <span className="tabular ml-auto text-xs text-muted-foreground">
            Capital em estoque {brl(current.totalValue)} · SLA de coletas{" "}
            {sla.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
            {worstStage ? ` · gargalo em ${worstStage.label}` : ""}
          </span>
        </section>

        <div className="grid gap-6 xl:grid-cols-2">{BLOCKS.map(renderBlock)}</div>

        <section className="space-y-3" aria-label="Indicadores de coletas">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <span className="grid size-8 place-items-center rounded-lg bg-accent/15 text-accent">
                <Truck className="size-4" />
              </span>
              Indicadores de Coletas
            </h2>
            <p className="text-xs text-muted-foreground">
              SLA = coletas concluídas no prazo ÷ coletas realizadas
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {METRICS.filter((m) => m.group === "coletas").map((m) => (
              <KpiCard
                key={m.key}
                metric={m}
                value={metricValue(current, m)}
                previous={previous ? metricValue(previous, m) : undefined}
                target={data.targets[m.key] ?? 0}
                extra={extras[m.key]}
              />
            ))}
          </div>
        </section>

        <FlowStages stages={data.stages} />

        <ExecutiveTable current={current} previous={previous} targets={data.targets} />

        {hydrated && (
          <section className="grid gap-4 xl:grid-cols-2">
            <StockEvolutionChart records={history} />
            <QualityChart records={history} targets={data.targets} />
            <CollectionsVolumeChart records={history} targets={data.targets} />
            <DelayReasonsChart reasons={data.delayReasons} />
            <div className="xl:col-span-2">
              <CriticalItemsChart items={data.criticalItems} />
            </div>
          </section>
        )}

        <section className="panel overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <AlertTriangle className="size-4 text-warning" />
            <h2 className="font-display text-lg font-semibold">Itens críticos e divergências</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="text-left text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Código</th>
                  <th className="px-3 py-3 font-medium">Descrição</th>
                  <th className="px-3 py-3 font-medium">Classificação</th>
                  <th className="px-3 py-3 text-right font-medium">Qtd.</th>
                  <th className="px-5 py-3 text-right font-medium">Impacto (R$)</th>
                </tr>
              </thead>
              <tbody>
                {[...data.criticalItems]
                  .sort((a, b) => b.value - a.value)
                  .map((it) => (
                    <tr key={it.id} className="border-t border-border/70">
                      <td className="tabular px-5 py-3 font-medium">{it.code}</td>
                      <td className="px-3 py-3 text-muted-foreground">{it.name}</td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-xs font-medium",
                            it.kind === "divergencia" ? statusChip.critico : statusChip.alerta,
                          )}
                        >
                          {it.kind === "divergencia" ? "Divergência" : "Abaixo do mínimo"}
                        </span>
                      </td>
                      <td className="tabular px-3 py-3 text-right text-muted-foreground">
                        {it.qty ?? "—"}
                      </td>
                      <td className="tabular px-5 py-3 text-right font-semibold">
                        {brl(it.value)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        {!presenting && (
          <footer className="flex flex-wrap items-center justify-between gap-3 pb-6 text-xs text-muted-foreground">
            <span>
              Dados salvos neste navegador. Use “Importar CSV” para carregar o fechamento mensal do
              sistema, incluindo as colunas de coletas.
            </span>
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="size-3.5" /> Restaurar dados de exemplo
            </Button>
          </footer>
        )}
      </div>

      <DataEntryDialog
        open={entryOpen}
        onOpenChange={setEntryOpen}
        records={data.records}
        targets={data.targets}
        stages={data.stages}
        delayReasons={data.delayReasons}
        initialMonth={current.month}
        onSaveRecord={upsertRecord}
        onSaveTargets={setTargets}
        onSaveFlow={saveFlow}
      />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} onImport={upsertMany} />
    </main>
  );
}
