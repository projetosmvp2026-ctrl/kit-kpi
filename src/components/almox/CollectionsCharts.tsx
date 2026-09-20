import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  type DelayReason,
  type MonthlyRecord,
  type Targets,
  collectionsSla,
  monthLabel,
} from "@/lib/almox";
import { ChartShell, LegendItem, axis, tooltipStyle } from "./Charts";

export function CollectionsVolumeChart({
  records,
  targets,
}: {
  records: MonthlyRecord[];
  targets: Targets;
}) {
  const data = records.map((r) => ({
    mes: monthLabel(r.month),
    solicitadas: r.collectionsRequested,
    realizadas: r.collectionsCompleted,
    atrasadas: r.collectionsLate,
    sla: collectionsSla(r),
  }));

  const labels: Record<string, string> = {
    solicitadas: "Solicitadas",
    realizadas: "Realizadas",
    atrasadas: "Atrasadas",
    sla: "SLA no prazo (%)",
  };

  return (
    <ChartShell
      title="Coletas por mês"
      subtitle="Volume solicitado × realizado × atrasado, com SLA no prazo"
      legend={
        <div className="flex flex-wrap gap-3">
          <LegendItem color="var(--color-chart-1)" label="Solicitadas" />
          <LegendItem color="var(--color-chart-2)" label="Realizadas" />
          <LegendItem color="var(--color-chart-4)" label="Atrasadas" />
          <LegendItem color="var(--color-chart-3)" label="SLA %" />
        </div>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ left: 4, right: 8, top: 6 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="mes" {...axis} />
          <YAxis yAxisId="qtd" {...axis} width={40} />
          <YAxis
            yAxisId="pct"
            orientation="right"
            {...axis}
            width={44}
            domain={[60, 100]}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip
            {...tooltipStyle}
            formatter={(v: number, name) => [
              name === "sla"
                ? `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`
                : v.toLocaleString("pt-BR"),
              labels[String(name)] ?? String(name),
            ]}
          />
          <ReferenceLine
            yAxisId="pct"
            y={targets["collectionsSlaPct"] ?? 95}
            stroke="var(--color-chart-3)"
            strokeDasharray="4 4"
            strokeOpacity={0.6}
          />
          <Bar yAxisId="qtd" dataKey="solicitadas" fill="var(--color-chart-1)" barSize={14} radius={[4, 4, 0, 0]} />
          <Bar yAxisId="qtd" dataKey="realizadas" fill="var(--color-chart-2)" barSize={14} radius={[4, 4, 0, 0]} />
          <Bar yAxisId="qtd" dataKey="atrasadas" fill="var(--color-chart-4)" barSize={14} radius={[4, 4, 0, 0]} />
          <Line
            yAxisId="pct"
            type="monotone"
            dataKey="sla"
            stroke="var(--color-chart-3)"
            strokeWidth={2.5}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function DelayReasonsChart({ reasons }: { reasons: DelayReason[] }) {
  const data = [...reasons]
    .sort((a, b) => b.count - a.count)
    .map((r, i) => ({ motivo: r.label, ocorrencias: r.count, top: i === 0 }));

  return (
    <ChartShell
      title="Motivos de atraso ou não realização"
      subtitle="Gargalos apontados nas coletas do período"
      legend={<LegendItem color="var(--color-chart-4)" label="Principal gargalo" />}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 12, right: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
          <XAxis type="number" {...axis} allowDecimals={false} />
          <YAxis type="category" dataKey="motivo" {...axis} width={140} />
          <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v} ocorrência(s)`, "Atrasos"]} />
          <Bar dataKey="ocorrencias" radius={[0, 6, 6, 0]} barSize={18}>
            {data.map((d) => (
              <Cell
                key={d.motivo}
                fill={d.top ? "var(--color-chart-4)" : "var(--color-chart-2)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}
