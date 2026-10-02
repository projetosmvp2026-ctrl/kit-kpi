import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ObraRank } from "@/lib/obras";
import { brl } from "@/lib/almox";
import { ChartShell, LegendItem, axis, tooltipStyle } from "./Charts";

export function ObraMovementChart({ ranking, subtitle }: { ranking: ObraRank[]; subtitle: string }) {
  const data = ranking
    .filter((r) => r.total > 0)
    .slice(0, 10)
    .map((r) => ({ obra: r.obra.name, cidade: r.obra.city, enviadas: r.sent, recebidas: r.received }));

  const rows = ranking.filter((r) => r.total > 0).slice(0, 10);
  const tot = rows.reduce((a, r) => ({ cost: a.cost + r.cost, own: a.own + r.costOwn, third: a.third + r.costThird }), { cost: 0, own: 0, third: 0 });

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
      {rows.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <div className="mb-3 grid grid-cols-3 gap-4 text-sm">
            {[["Custo total de envio", tot.cost], ["Transporte próprio", tot.own], ["Transporte terceiro", tot.third]].map(([l, v]) => (
              <div key={l as string}>
                <p className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">{l}</p>
                <p className="tabular font-display text-2xl font-light">{brl(v as number)}</p>
              </div>
            ))}
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">
              <tr><th className="py-2">Obra</th><th className="text-right">Mov.</th><th className="text-right">Próprio</th><th className="text-right">Terceiro</th><th className="text-right">Custo total</th><th className="text-right">Custo/mov.</th></tr>
            </thead>
            <tbody className="tabular divide-y divide-border/60">
              {rows.map((r) => (
                <tr key={r.obra.id}>
                  <td className="py-2">{r.obra.name} <span className="text-muted-foreground">· {r.obra.city}</span></td>
                  <td className="text-right">{r.total}</td>
                  <td className="text-right">{brl(r.costOwn)} <span className="text-xs text-muted-foreground">({r.tripsOwn})</span></td>
                  <td className="text-right">{brl(r.costThird)} <span className="text-xs text-muted-foreground">({r.tripsThird})</span></td>
                  <td className="text-right font-medium">{brl(r.cost)}</td>
                  <td className="text-right text-muted-foreground">{brl(r.total ? r.cost / r.total : 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ChartShell>
  );
}
