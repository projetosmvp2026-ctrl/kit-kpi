import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  type CriticalItem,
  type MonthlyRecord,
  type Targets,
  brl,
  monthLabel,
} from "@/lib/almox";

export const axis = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

export const tooltipStyle = {
  contentStyle: {
    background: "var(--color-surface-2)",
    border: "1px solid var(--color-border)",
    borderRadius: "10px",
    fontSize: "12px",
    color: "var(--color-foreground)",
  },
  labelStyle: { color: "var(--color-muted-foreground)" },
};

export function ChartShell({
  title,
  subtitle,
  legend,
  children,
}: {
  title: string;
  subtitle: string;
  legend?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="panel flex flex-col p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-base font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        {legend}
      </div>
      <div className="h-64 w-full">{children}</div>
    </div>
  );
}

export function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="size-2.5 rounded-sm" style={{ background: color }} aria-hidden />
      {label}
    </span>
  );
}

export function StockEvolutionChart({ records }: { records: MonthlyRecord[] }) {
  const data = records.map((r) => ({
    mes: monthLabel(r.month),
    total: r.totalValue,
    semGiro: r.deadStockValue,
    pct: r.totalValue ? (r.deadStockValue / r.totalValue) * 100 : 0,
  }));

  return (
    <ChartShell
      title="Evolução do estoque"
      subtitle="Valor total × estoque sem giro (R$)"
      legend={
        <div className="flex gap-3">
          <LegendItem color="var(--color-chart-1)" label="Valor total" />
          <LegendItem color="var(--color-chart-4)" label="Sem giro" />
        </div>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 4, right: 4, top: 6 }}>
          <defs>
            <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gDead" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-chart-4)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--color-chart-4)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="mes" {...axis} />
          <YAxis
            {...axis}
            width={62}
            tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
          />
          <Tooltip
            {...tooltipStyle}
            formatter={(v: number, name) => [
              brl(v),
              name === "total" ? "Valor total" : "Sem giro",
            ]}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="var(--color-chart-1)"
            strokeWidth={2}
            fill="url(#gTotal)"
          />
          <Area
            type="monotone"
            dataKey="semGiro"
            stroke="var(--color-chart-4)"
            strokeWidth={2}
            fill="url(#gDead)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function QualityChart({
  records,
  targets,
}: {
  records: MonthlyRecord[];
  targets: Targets;
}) {
  const data = records.map((r) => ({
    mes: monthLabel(r.month),
    ira: r.accuracy,
    otif: r.otif,
  }));

  return (
    <ChartShell
      title="Acuracidade e atendimento"
      subtitle="IRA × OTIF (%) com linha de meta"
      legend={
        <div className="flex gap-3">
          <LegendItem color="var(--color-chart-3)" label="IRA" />
          <LegendItem color="var(--color-chart-2)" label="OTIF" />
        </div>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 4, right: 8, top: 6 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="mes" {...axis} />
          <YAxis {...axis} width={42} domain={[80, 100]} tickFormatter={(v: number) => `${v}%`} />
          <Tooltip
            {...tooltipStyle}
            formatter={(v: number, name) => [
              `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`,
              name === "ira" ? "Acuracidade (IRA)" : "Atendimento (OTIF)",
            ]}
          />
          <ReferenceLine
            y={targets["accuracy"] ?? 0}
            stroke="var(--color-chart-3)"
            strokeDasharray="4 4"
            strokeOpacity={0.6}
          />
          <ReferenceLine
            y={targets["otif"] ?? 0}
            stroke="var(--color-chart-2)"
            strokeDasharray="4 4"
            strokeOpacity={0.6}
          />
          <Line
            type="monotone"
            dataKey="ira"
            stroke="var(--color-chart-3)"
            strokeWidth={2.5}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="otif"
            stroke="var(--color-chart-2)"
            strokeWidth={2.5}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function CriticalItemsChart({ items }: { items: CriticalItem[] }) {
  const data = [...items]
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map((i) => ({
      nome: i.code,
      descricao: i.name,
      valor: i.value,
      kind: i.kind,
    }));

  return (
    <ChartShell
      title="Top 5 itens críticos"
      subtitle="Maior divergência de inventário ou saldo abaixo do mínimo"
      legend={
        <div className="flex gap-3">
          <LegendItem color="var(--color-chart-4)" label="Divergência" />
          <LegendItem color="var(--color-chart-2)" label="Abaixo do mínimo" />
        </div>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 12, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
          <XAxis
            type="number"
            {...axis}
            tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
          />
          <YAxis type="category" dataKey="nome" {...axis} width={96} />
          <Tooltip
            {...tooltipStyle}
            formatter={(v: number) => [brl(v), "Valor"]}
            labelFormatter={(label: string) =>
              data.find((d) => d.nome === label)?.descricao ?? label
            }
          />
          <Bar dataKey="valor" radius={[0, 6, 6, 0]} barSize={18}>
            {data.map((d) => (
              <Cell
                key={d.nome}
                fill={
                  d.kind === "divergencia" ? "var(--color-chart-4)" : "var(--color-chart-2)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}
