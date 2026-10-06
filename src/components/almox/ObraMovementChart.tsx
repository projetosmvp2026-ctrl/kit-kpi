import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChevronDown, ChevronRight } from "lucide-react";
import { KIND_LABEL, transportOf, type Movement, type Obra, type ObraRank, type TransportType } from "@/lib/obras";
import { brl } from "@/lib/almox";
import { ChartShell, LegendItem, axis, tooltipStyle } from "./Charts";

interface Props {
  ranking: ObraRank[];
  subtitle: string;
  movements?: Movement[] | undefined;
  obras?: Obra[] | undefined;
  onUpdate?: ((nf: string, patch: Partial<Movement>) => void) | undefined;
}

export function ObraMovementChart({ ranking, subtitle, movements = [], obras = [], onUpdate }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const rows = ranking.filter((r) => r.total > 0);
  const data = rows.slice(0, 10).map((r) => ({ obra: r.obra.name, cidade: r.obra.city, enviadas: r.sent, recebidas: r.received }));
  const tot = rows.reduce(
    (a, r) => ({ cost: a.cost + r.cost, own: a.own + r.costOwn, third: a.third + r.costThird }),
    { cost: 0, own: 0, third: 0 },
  );
  const totalMov = movements.length;
  const name = (id: string | null) => (id ? (obras.find((o) => o.id === id)?.name ?? id) : "Drilling");

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
          <div className="mb-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-5">
            <div>
              <p className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">Obra que mais movimentou</p>
              <p className="font-display text-lg font-light leading-tight">{rows[0]?.obra.name}</p>
              <p className="tabular text-xs text-muted-foreground">{rows[0]?.total} mov. · frete {brl(rows[0]?.cost ?? 0)}</p>
            </div>
            {[["NFs de remessa", String(totalMov)], ["Frete total", brl(tot.cost)], ["Frete próprio", brl(tot.own)], ["Frete terceiro", brl(tot.third)]].map(([l, v]) => (
              <div key={l}>
                <p className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">{l}</p>
                <p className="tabular font-display text-2xl font-light">{v}</p>
              </div>
            ))}
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">
              <tr><th className="py-2">Obra</th><th className="text-right">Mov.</th><th className="text-right">Próprio</th><th className="text-right">Terceiro</th><th className="text-right">Custo total</th><th className="text-right">Custo/mov.</th></tr>
            </thead>
            <tbody className="tabular">
              {rows.map((r) => {
                const isOpen = open === r.obra.id;
                const nfs = movements.filter((m) => m.originId === r.obra.id || m.destId === r.obra.id);
                return (
                  <>
                    <tr key={r.obra.id} className="cursor-pointer border-t border-border/60 hover:bg-surface-2/40" onClick={() => setOpen(isOpen ? null : r.obra.id)}>
                      <td className="py-2">
                        {isOpen ? <ChevronDown className="mr-1 inline h-3 w-3" /> : <ChevronRight className="mr-1 inline h-3 w-3" />}
                        {r.obra.name} <span className="text-muted-foreground">· {r.obra.city}</span>
                      </td>
                      <td className="text-right">{r.total}</td>
                      <td className="text-right">{brl(r.costOwn)} <span className="text-xs text-muted-foreground">({r.tripsOwn})</span></td>
                      <td className="text-right">{brl(r.costThird)} <span className="text-xs text-muted-foreground">({r.tripsThird})</span></td>
                      <td className="text-right font-medium">{brl(r.cost)}</td>
                      <td className="text-right text-muted-foreground">{brl(r.total ? r.cost / r.total : 0)}</td>
                    </tr>
                    {isOpen && (
                      <tr key={`${r.obra.id}-nfs`}>
                        <td colSpan={6} className="bg-surface-2/30 px-3 py-2">
                          <table className="w-full text-xs">
                            <thead className="text-left uppercase tracking-[0.12em] text-muted-foreground">
                              <tr><th className="py-1">NF</th><th>Tipo</th><th>Origem → Destino</th><th>Transportadora</th><th>Transporte</th><th className="text-right">Frete (R$)</th></tr>
                            </thead>
                            <tbody>
                              {nfs.map((m) => (
                                <tr key={m.nf} className="border-t border-border/40">
                                  <td className="py-1">{m.nf}</td>
                                  <td>{KIND_LABEL[m.kind]}</td>
                                  <td>{name(m.originId)} → {name(m.destId)}</td>
                                  <td>
                                    <input disabled={!onUpdate} defaultValue={m.carrier} onBlur={(e) => onUpdate?.(m.nf, { carrier: e.target.value })} className="w-full rounded border border-border/60 bg-transparent px-1 py-0.5" />
                                  </td>
                                  <td>
                                    <select disabled={!onUpdate} value={transportOf(m)} onChange={(e) => onUpdate?.(m.nf, { transport: e.target.value as TransportType })} className="rounded border border-border/60 bg-card px-1 py-0.5">
                                      <option value="proprio">Próprio</option>
                                      <option value="terceiro">Terceiro</option>
                                    </select>
                                  </td>
                                  <td className="text-right">
                                    <input type="number" step="0.01" min="0" disabled={!onUpdate} defaultValue={m.freight ?? 0} onBlur={(e) => onUpdate?.(m.nf, { freight: Number(e.target.value) || 0 })} className="w-24 rounded border border-border/60 bg-transparent px-1 py-0.5 text-right" />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </ChartShell>
  );
}
