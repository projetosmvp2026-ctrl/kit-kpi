import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ObraRank } from "@/lib/obras";
import { ChartShell, LegendItem, axis, tooltipStyle } from "./Charts";

export function ObraMovementChart({ ranking, subtitle }: { ranking: ObraRank[]; subtitle: string }) {
  const data = ranking
    .filter((r) => r.total > 0)
    .slice(0, 10)
    .map((r) => ({ obra: r.obra.name, cidade: r.obra.city, enviadas: r.sent, recebidas: r.received }));

  return (
    <ChartShell
      title="Movimentação por obra"
      subtitle={subtitle}
      legend={
        <>
          <LegendItem color="var(--color-primary)" label="Recebidas" />
          <LegendItem color="var(--color-accent)" label="Enviadas" />
        </>
      }
    >
      {data.length === 0 ? (
        <p className="grid h-full place-items-center text-sm text-muted-foreground">
          Nenhuma nota de remessa importada para este período.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(220, data.length * 38)}>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid stroke="var(--color-border)" horizontal={false} />
            <XAxis type="number" allowDecimals={false} {...axis} />
            <YAxis type="category" dataKey="obra" width={180} {...axis} />
            <Tooltip
              {...tooltipStyle}
              cursor={{ fill: "var(--color-surface-2)" }}
              labelFormatter={(l, p) => `${l} · ${p?.[0]?.payload?.cidade ?? ""}`}
            />
            <Bar dataKey="recebidas" name="Recebidas" stackId="a" fill="var(--color-primary)" />
            <Bar dataKey="enviadas" name="Enviadas" stackId="a" fill="var(--color-accent)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartShell>
  );
}
