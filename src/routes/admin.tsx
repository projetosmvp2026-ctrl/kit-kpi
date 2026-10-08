import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowLeft, FileText, PencilLine, Plus, Trash2, Upload, MessageCircle, Building2, CalendarDays, AlertTriangle, Settings, Download, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataEntryDialog } from "@/components/almox/DataEntryDialog";
import { ImportDialog } from "@/components/almox/ImportDialog";
import { useAlmoxData } from "@/hooks/use-almox-data";
import { brl, monthLabelLong, type CriticalItem, type CriticalKind } from "@/lib/almox";
import { transportOf, TRANSPORT_LABEL, type TransportType } from "@/lib/obras";
import {
  KIND_LABEL,
  type NfParseResult,
  type PurchaseOrder,
  monthFromFilename,
  parseNfCsv,
  rankObras,
  readWhatsappZip,
} from "@/lib/obras";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel administrativo | Indicadores do Almoxarifado" },
      { name: "description", content: "Cadastro de obras, upload do protocolo de notas de remessa e da conversa de pedidos de compra para alimentar os indicadores." },
      { property: "og:title", content: "Painel administrativo do almoxarifado" },
      { property: "og:description", content: "Lançamento de dados, notas de remessa por obra e pedidos de compra para coletas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const d = useAlmoxData();
  const { data } = d;
  const [entryOpen, setEntryOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editMonth, setEditMonth] = useState<string | null>(null);
  const thisMonth = new Date().toISOString().slice(0, 7);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="panel flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">Administração</p>
            <h1 className="font-display text-2xl font-semibold">Painel administrativo</h1>
            <p className="mt-1 text-sm text-muted-foreground">Lance dados e importe arquivos para alimentar os indicadores.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setEntryOpen(true)}><PencilLine className="size-4" /> Lançar indicadores</Button>
            <Button variant="secondary" onClick={() => setImportOpen(true)}>Importar CSV de KPIs</Button>
            <Button variant="outline" asChild><Link to="/"><ArrowLeft className="size-4" /> Voltar ao painel</Link></Button>
          </div>
        </header>

        <Tabs defaultValue="meses">
          <TabsList className="flex h-auto flex-wrap">
            <TabsTrigger value="meses"><CalendarDays className="size-4" /> Meses</TabsTrigger>
            <TabsTrigger value="notas"><FileText className="size-4" /> Notas de remessa</TabsTrigger>
            <TabsTrigger value="coletas"><MessageCircle className="size-4" /> Pedidos (WhatsApp)</TabsTrigger>
            <TabsTrigger value="obras"><Building2 className="size-4" /> Obras</TabsTrigger>
            <TabsTrigger value="criticos"><AlertTriangle className="size-4" /> Itens críticos</TabsTrigger>
            <TabsTrigger value="config"><Settings className="size-4" /> Backup e dados</TabsTrigger>
          </TabsList>
          <TabsContent value="meses" className="pt-4">
            <MesesTab {...d} onEdit={(m) => { setEditMonth(m); setEntryOpen(true); }} />
          </TabsContent>
          <TabsContent value="notas" className="pt-4"><NotasTab {...d} /></TabsContent>
          <TabsContent value="coletas" className="pt-4"><ColetasTab {...d} /></TabsContent>
          <TabsContent value="obras" className="pt-4"><ObrasTab {...d} /></TabsContent>
          <TabsContent value="criticos" className="pt-4"><CriticosTab {...d} /></TabsContent>
          <TabsContent value="config" className="pt-4"><ConfigTab {...d} /></TabsContent>
        </Tabs>
      </div>

      <DataEntryDialog
        key={editMonth ?? "default"}
        open={entryOpen}
        onOpenChange={(o) => { setEntryOpen(o); if (!o) setEditMonth(null); }}
        records={data.records}
        targets={data.targets}
        stages={data.stages}
        delayReasons={data.delayReasons}
        initialMonth={editMonth ?? data.records[data.records.length - 1]?.month ?? thisMonth}
        onSaveRecord={d.upsertRecord}
        onSaveTargets={d.setTargets}
        onSaveFlow={(s, r) => { d.setStages(s); d.setDelayReasons(r); }}
      />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} onImport={d.upsertMany} />
    </main>
  );
}

function MesesTab({ data, removeRecord, onEdit }: ReturnType<typeof useAlmoxData> & { onEdit: (m: string) => void }) {
  return (
    <div className="panel p-5">
      <h2 className="mb-1 font-display text-lg font-semibold">Fechamentos mensais ({data.records.length})</h2>
      <p className="mb-3 text-sm text-muted-foreground">Edite qualquer mês (valores, metas e fluxo) ou exclua um fechamento.</p>
      <ul className="divide-y divide-border/70 text-sm">
        {[...data.records].reverse().map((r) => (
          <li key={r.month} className="flex items-center justify-between py-2">
            <span className="capitalize">{monthLabelLong(r.month)}</span>
            <span className="flex gap-1">
              <Button size="sm" variant="secondary" onClick={() => onEdit(r.month)}><PencilLine className="size-3.5" /> Editar</Button>
              <Button size="icon" variant="ghost" aria-label={`Excluir ${r.month}`} onClick={() => {
                if (confirm(`Excluir o fechamento de ${monthLabelLong(r.month)}?`)) { removeRecord(r.month); toast.success("Mês excluído."); }
              }}><Trash2 className="size-4" /></Button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CriticosTab({ data, setCriticalItems }: ReturnType<typeof useAlmoxData>) {
  const items = data.criticalItems;
  const update = (id: string, patch: Partial<CriticalItem>) =>
    setCriticalItems(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const add = () =>
    setCriticalItems([...items, { id: `item-${Date.now()}`, code: "", name: "Novo item", kind: "abaixo_minimo", value: 0 }]);
  return (
    <div className="panel space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Itens críticos e divergências ({items.length})</h2>
        <Button onClick={add}><Plus className="size-4" /> Adicionar item</Button>
      </div>
      <ul className="divide-y divide-border/70">
        {items.map((i) => (
          <li key={i.id} className="grid gap-2 py-2 sm:grid-cols-[7rem_1fr_11rem_8rem_6rem_auto]">
            <Input aria-label="Código" placeholder="Código" value={i.code} onChange={(e) => update(i.id, { code: e.target.value })} />
            <Input aria-label="Nome" value={i.name} onChange={(e) => update(i.id, { name: e.target.value })} />
            <select className="rounded-md border border-border bg-background px-2" value={i.kind}
              onChange={(e) => update(i.id, { kind: e.target.value as CriticalKind })}>
              <option value="abaixo_minimo">Abaixo do mínimo</option>
              <option value="divergencia">Divergência</option>
            </select>
            <Input aria-label="Valor (R$)" type="number" value={i.value} onChange={(e) => update(i.id, { value: Number(e.target.value) || 0 })} />
            <Input aria-label="Quantidade" type="number" placeholder="Qtd" value={i.qty ?? ""} onChange={(e) => update(i.id, { qty: Number(e.target.value) || 0 })} />
            <Button variant="ghost" size="icon" aria-label={`Remover ${i.name}`} onClick={() => setCriticalItems(items.filter((x) => x.id !== i.id))}>
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const BACKUP_KEY = "almoxarifado-kpis-v1";

function ConfigTab({ data, reset }: ReturnType<typeof useAlmoxData>) {
  const fileRef = useRef<HTMLInputElement>(null);
  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `backup-almoxarifado-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importBackup = async (f?: File) => {
    if (!f) return;
    try {
      const parsed = JSON.parse(await f.text());
      if (!parsed?.records?.length) throw new Error();
      localStorage.setItem(BACKUP_KEY, JSON.stringify(parsed));
      toast.success("Backup restaurado. Recarregando…");
      setTimeout(() => location.reload(), 600);
    } catch {
      toast.error("Arquivo de backup inválido.");
    }
  };
  return (
    <div className="panel space-y-4 p-5">
      <h2 className="font-display text-lg font-semibold">Backup e dados</h2>
      <p className="text-sm text-muted-foreground">Salve uma cópia de tudo (meses, metas, obras, notas, pedidos, itens críticos) ou restaure de um backup.</p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={exportBackup}><Download className="size-4" /> Baixar backup</Button>
        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={(e) => importBackup(e.target.files?.[0])} />
        <Button variant="secondary" onClick={() => fileRef.current?.click()}><Upload className="size-4" /> Restaurar backup</Button>
        <Button variant="destructive" onClick={() => {
          if (confirm("Apagar tudo e voltar aos dados de exemplo?")) { reset(); toast.success("Dados restaurados para o exemplo."); }
        }}><RotateCcw className="size-4" /> Restaurar dados de exemplo</Button>
      </div>
    </div>
  );
}

type D = ReturnType<typeof useAlmoxData>;

function NotasTab({ data, addMovements, clearMovements, updateMovement }: D) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [text, setText] = useState("");
  const [result, setResult] = useState<NfParseResult | null>(null);
  const obraName = (id: string | null) => (id ? data.obras.find((o) => o.id === id)?.name ?? id : "Drilling (depósito)");

  const analyse = (t: string, m: string) => setResult(t ? parseNfCsv(t, m, data.obras) : null);

  const onFile = async (f?: File) => {
    if (!f) return;
    const t = await f.text();
    const m = monthFromFilename(f.name) ?? month;
    setMonth(m);
    setText(t);
    analyse(t, m);
  };

  const ranking = rankObras(data.obras, data.movements, month).filter((r) => r.total > 0);
  const monthMoves = data.movements.filter((m) => m.month === month);

  return (
    <div className="space-y-4">
      <div className="panel space-y-4 p-5">
        <div>
          <h2 className="font-display text-lg font-semibold">Upload do protocolo de notas (CSV)</h2>
          <p className="text-sm text-muted-foreground">
            Somente notas de remessa/retorno de bem entre obras, da Drilling para obra ou da obra para a Drilling são consideradas. Devoluções, destruição e outras saídas são ignoradas.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="nf-month">Mês de referência</Label>
            <Input id="nf-month" type="month" value={month} onChange={(e) => { setMonth(e.target.value); analyse(text, e.target.value); }} />
          </div>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          <Button variant="secondary" onClick={() => fileRef.current?.click()}><Upload className="size-4" /> Selecionar CSV de notas</Button>
        </div>

        {result && (
          <div className="space-y-3">
            <div className="rounded-lg border border-success/40 bg-success/10 p-3 text-sm text-success">
              {result.accepted.length} nota(s) de remessa identificada(s) · {result.rejected.length} descartada(s)
            </div>
            {result.accepted.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[40rem] text-sm">
                  <thead><tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2">NF</th><th className="px-3 py-2">Tipo</th><th className="px-3 py-2">Origem</th><th className="px-3 py-2">Destino</th>
                  </tr></thead>
                  <tbody>
                    {result.accepted.map((m) => (
                      <tr key={m.nf} className="border-t border-border/70">
                        <td className="tabular px-3 py-2">{m.nf}</td>
                        <td className="px-3 py-2">{KIND_LABEL[m.kind]}</td>
                        <td className="px-3 py-2">{obraName(m.originId)}</td>
                        <td className="px-3 py-2">{obraName(m.destId)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {result.rejected.length > 0 && (
              <details className="rounded-lg border border-border p-3 text-xs text-muted-foreground">
                <summary className="cursor-pointer">Notas de remessa descartadas ({result.rejected.length})</summary>
                <ul className="mt-2 space-y-1">{result.rejected.map((r) => <li key={r.nf}>NF {r.nf}: {r.reason}</li>)}</ul>
              </details>
            )}
            <Button
              disabled={!result.accepted.length}
              onClick={() => {
                addMovements(result.accepted);
                toast.success(`${result.accepted.length} movimentação(ões) registradas em ${monthLabelLong(month)}.`);
                setResult(null);
                setText("");
              }}
            >
              Registrar movimentações
            </Button>
          </div>
        )}
      </div>

      <div className="panel p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Movimentações de {monthLabelLong(month)}</h2>
          {ranking.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => { clearMovements(month); toast.success("Movimentações do mês removidas."); }}>
              <Trash2 className="size-3.5" /> Limpar mês
            </Button>
          )}
        </div>
        {ranking.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma movimentação registrada neste mês.</p>
        ) : (
          <ul className="divide-y divide-border/70 text-sm">
            {ranking.map((r, i) => (
              <li key={r.obra.id} className="flex items-center justify-between py-2">
                <span><span className="tabular mr-2 text-muted-foreground">{i + 1}º</span>{r.obra.name} <span className="text-muted-foreground">· {r.obra.city}</span></span>
                <span className="tabular text-right">{r.total} <span className="text-xs text-muted-foreground">({r.received} recebidas / {r.sent} enviadas)</span>
                  <span className="block text-xs text-muted-foreground">Frete {brl(r.cost)} · próprio {brl(r.costOwn)} · terceiro {brl(r.costThird)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {monthMoves.length > 0 && (
        <div className="panel p-5">
          <h2 className="font-display text-lg font-semibold">Custo de envio por nota</h2>
          <p className="mb-3 text-sm text-muted-foreground">Informe o valor do frete e se o transporte foi próprio ou terceiro. O frete da nota já vem preenchido quando existir no protocolo.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="py-2">NF</th><th>Origem → Destino</th><th>Transportadora</th><th>Transporte</th><th className="text-right">Frete (R$)</th></tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {monthMoves.map((m) => (
                  <tr key={m.nf}>
                    <td className="tabular py-2">{m.nf}</td>
                    <td>{obraName(m.originId)} → {obraName(m.destId)}</td>
                    <td className="text-muted-foreground">{m.carrier || "—"}</td>
                    <td>
                      <select
                        className="rounded-md border border-border bg-background px-2 py-1"
                        value={transportOf(m)}
                        onChange={(e) => updateMovement(m.nf, { transport: e.target.value as TransportType })}
                      >
                        {(Object.keys(TRANSPORT_LABEL) as TransportType[]).map((t) => <option key={t} value={t}>{TRANSPORT_LABEL[t]}</option>)}
                      </select>
                    </td>
                    <td className="text-right">
                      <Input
                        type="number" min={0} step="0.01" className="ml-auto h-8 w-32 text-right"
                        defaultValue={m.freight ?? 0}
                        onBlur={(e) => updateMovement(m.nf, { freight: Number(e.target.value) || 0 })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ColetasTab({ data, addPurchaseOrders }: D) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<PurchaseOrder[] | null>(null);
  const [loading, setLoading] = useState(false);

  const onFile = async (f?: File) => {
    if (!f) return;
    setLoading(true);
    try {
      setPreview(await readWhatsappZip(f));
    } catch {
      toast.error("Não foi possível ler o arquivo. Envie o .zip exportado do WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  const byMonth = (list: PurchaseOrder[]) => {
    const m = new Map<string, number>();
    for (const p of list) m.set(p.month, (m.get(p.month) ?? 0) + 1);
    return [...m.entries()];
  };

  return (
    <div className="space-y-4">
      <div className="panel space-y-4 p-5">
        <div>
          <h2 className="font-display text-lg font-semibold">Upload da conversa do WhatsApp (.zip)</h2>
          <p className="text-sm text-muted-foreground">
            O sistema lê a conversa e identifica somente os pedidos de compra (arquivos “PC nnnn …”). Cada pedido conta como uma coleta solicitada no mês em que foi enviado; mensagens de “urgente” marcam o pedido anterior como urgente.
          </p>
        </div>
        <input ref={fileRef} type="file" accept=".zip,.txt" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        <Button variant="secondary" disabled={loading} onClick={() => fileRef.current?.click()}>
          <Upload className="size-4" /> {loading ? "Lendo…" : "Selecionar arquivo .zip"}
        </Button>

        {preview && (
          <div className="space-y-3">
            <div className="rounded-lg border border-success/40 bg-success/10 p-3 text-sm text-success">
              {preview.length} pedido(s) de compra encontrados · {preview.filter((p) => p.urgent).length} urgente(s) · {byMonth(preview).map(([m, n]) => `${monthLabelLong(m)}: ${n}`).join(" · ")}
            </div>
            <div className="max-h-80 overflow-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2">PC</th><th className="px-3 py-2">Data</th><th className="px-3 py-2">Fornecedor</th><th className="px-3 py-2">Destino</th><th className="px-3 py-2">Urgente</th>
                </tr></thead>
                <tbody>
                  {preview.map((p) => (
                    <tr key={p.number} className="border-t border-border/70">
                      <td className="tabular px-3 py-2">{p.number}</td>
                      <td className="tabular px-3 py-2">{p.date.split("-").reverse().join("/")}</td>
                      <td className="px-3 py-2">{p.supplier}</td>
                      <td className="px-3 py-2 text-muted-foreground">{p.destination || "—"}</td>
                      <td className="px-3 py-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={p.urgent}
                            onChange={(e) =>
                              setPreview((l) => l?.map((x) => (x.number === p.number ? { ...x, urgent: e.target.checked } : x)) ?? null)
                            }
                          />
                          <span className={p.urgent ? "text-danger" : "text-muted-foreground"}>{p.urgent ? "Urgente" : "Normal"}</span>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button
              disabled={!preview.length}
              onClick={() => {
                addPurchaseOrders(preview);
                toast.success("Coletas solicitadas atualizadas a partir dos pedidos de compra.");
                setPreview(null);
              }}
            >
              Registrar pedidos nas coletas
            </Button>
          </div>
        )}
      </div>

      <div className="panel p-5 text-sm">
        <h2 className="mb-2 font-display text-lg font-semibold">Pedidos registrados</h2>
        {data.purchaseOrders.length === 0 ? (
          <p className="text-muted-foreground">Nenhum pedido registrado ainda.</p>
        ) : (
          <p className="text-muted-foreground">
            {data.purchaseOrders.length} pedido(s) · {byMonth(data.purchaseOrders).map(([m, n]) => `${monthLabelLong(m)}: ${n}`).join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
}

function ObrasTab({ data, setObras }: D) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const add = () => {
    if (!name.trim() || !city.trim()) {
      toast.error("Informe nome e cidade.");
      return;
    }
    const id = `${name}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    setObras([...data.obras, { id, name: name.trim(), city: city.trim() }]);
    setName("");
    setCity("");
    toast.success("Obra cadastrada.");
  };
  const update = (id: string, field: "name" | "city", v: string) =>
    setObras(data.obras.map((o) => (o.id === id ? { ...o, [field]: v } : o)));

  return (
    <div className="panel space-y-4 p-5">
      <h2 className="font-display text-lg font-semibold">Obras cadastradas ({data.obras.length})</h2>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5"><Label htmlFor="o-name">Nome</Label><Input id="o-name" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="o-city">Cidade/UF</Label><Input id="o-city" placeholder="Recife/PE" value={city} onChange={(e) => setCity(e.target.value)} /></div>
        <Button onClick={add}><Plus className="size-4" /> Adicionar</Button>
      </div>
      <ul className="divide-y divide-border/70">
        {data.obras.map((o) => (
          <li key={o.id} className="grid gap-2 py-2 sm:grid-cols-[1fr_14rem_auto]">
            <Input aria-label="Nome da obra" value={o.name} onChange={(e) => update(o.id, "name", e.target.value)} />
            <Input aria-label="Cidade" value={o.city} onChange={(e) => update(o.id, "city", e.target.value)} />
            <Button variant="ghost" size="icon" aria-label={`Remover ${o.name}`} onClick={() => setObras(data.obras.filter((x) => x.id !== o.id))}>
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
