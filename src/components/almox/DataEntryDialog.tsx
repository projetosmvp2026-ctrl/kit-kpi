import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GROUP_LABEL,
  METRICS,
  MONTH_FIELDS,
  type DelayReason,
  type FlowStage,
  type MetricGroup,
  type MonthKey,
  type MonthlyRecord,
  type Targets,
  emptyRecord,
  monthLabelLong,
  sortRecords,
  unitHint,
} from "@/lib/almox";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  records: MonthlyRecord[];
  targets: Targets;
  stages: FlowStage[];
  delayReasons: DelayReason[];
  initialMonth: MonthKey;
  onSaveRecord: (r: MonthlyRecord) => void;
  onSaveTargets: (t: Targets) => void;
  onSaveFlow: (stages: FlowStage[], reasons: DelayReason[]) => void;
}

const GROUP_ORDER: MetricGroup[] = ["estoque", "atendimento", "controle", "risco", "coletas"];

export function DataEntryDialog({
  open,
  onOpenChange,
  records,
  targets,
  stages,
  delayReasons,
  initialMonth,
  onSaveRecord,
  onSaveTargets,
  onSaveFlow,
}: Props) {
  const [month, setMonth] = useState<MonthKey>(initialMonth);
  const [form, setForm] = useState<MonthlyRecord>(emptyRecord(initialMonth));
  const [targetForm, setTargetForm] = useState<Targets>(targets);
  const [stageForm, setStageForm] = useState<FlowStage[]>(stages);
  const [reasonForm, setReasonForm] = useState<DelayReason[]>(delayReasons);

  const existing = useMemo(
    () => sortRecords(records).find((r) => r.month === month),
    [records, month],
  );

  useEffect(() => {
    if (open) {
      setMonth(initialMonth);
      setTargetForm(targets);
      setStageForm(stages.map((s) => ({ ...s })));
      setReasonForm(delayReasons.map((r) => ({ ...r })));
    }
  }, [open, initialMonth, targets, stages, delayReasons]);

  useEffect(() => {
    setForm(existing ? { ...existing } : emptyRecord(month));
  }, [existing, month]);

  const save = () => {
    if (!/^\d{4}-\d{2}$/.test(month)) {
      toast.error("Informe um mês válido.");
      return;
    }
    onSaveRecord({ ...form, month });
    toast.success(`Indicadores de ${monthLabelLong(month)} salvos.`);
    onOpenChange(false);
  };

  const saveTargets = () => {
    onSaveTargets(targetForm);
    toast.success("Metas atualizadas.");
    onOpenChange(false);
  };

  const saveFlow = () => {
    onSaveFlow(stageForm, reasonForm);
    toast.success("Fluxo e motivos de atraso atualizados.");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">Lançar indicadores</DialogTitle>
          <DialogDescription>
            Registre o fechamento do mês (estoque, atendimento, controle, risco e coletas), ajuste
            metas ou atualize o fluxo de coletas.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="mes">
          <TabsList className="w-full">
            <TabsTrigger value="mes" className="flex-1">
              Valores do mês
            </TabsTrigger>
            <TabsTrigger value="metas" className="flex-1">
              Metas
            </TabsTrigger>
            <TabsTrigger value="fluxo" className="flex-1">
              Fluxo e gargalos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mes" className="space-y-5 pt-4">
            <div className="space-y-2">
              <Label htmlFor="mes-ref">Mês de referência</Label>
              <Input
                id="mes-ref"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {existing
                  ? "Mês já registrado — os campos abaixo serão atualizados."
                  : "Novo mês: os campos começam em zero."}
              </p>
            </div>

            {GROUP_ORDER.map((g) => {
              const fields = MONTH_FIELDS.filter((f) => f.group === g);
              if (!fields.length) return null;
              return (
                <div key={g} className="space-y-3">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-accent">
                    {GROUP_LABEL[g]}
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {fields.map((f) => (
                      <div key={f.key} className="space-y-1.5">
                        <Label htmlFor={`f-${f.key}`}>
                          {f.label}{" "}
                          <span className="text-muted-foreground">({unitHint(f.unit)})</span>
                        </Label>
                        <Input
                          id={`f-${f.key}`}
                          type="number"
                          step="any"
                          value={Number.isFinite(form[f.key]) ? form[f.key] : 0}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, [f.key]: Number(e.target.value) || 0 }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <p className="rounded-lg border border-border bg-surface-2/60 p-3 text-xs text-muted-foreground">
              O % de atendimento e o SLA das coletas são calculados automaticamente: realizadas ÷
              solicitadas e concluídas no prazo ÷ realizadas.
            </p>

            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={save}>Salvar mês</Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="metas" className="space-y-4 pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {METRICS.filter((m) => m.direction !== "info").map((m) => (
                <div key={m.key} className="space-y-1.5">
                  <Label htmlFor={`t-${m.key}`}>
                    {m.label} <span className="text-muted-foreground">({unitHint(m.unit)})</span>
                  </Label>
                  <Input
                    id={`t-${m.key}`}
                    type="number"
                    step="any"
                    value={targetForm[m.key] ?? 0}
                    onChange={(e) =>
                      setTargetForm((t) => ({ ...t, [m.key]: Number(e.target.value) || 0 }))
                    }
                  />
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={saveTargets}>Salvar metas</Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="fluxo" className="space-y-5 pt-4">
            <div className="space-y-3">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-accent">
                Tempo médio por etapa (horas)
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {stageForm.map((s, i) => (
                  <div key={s.key} className="space-y-1.5">
                    <Label htmlFor={`s-${s.key}`}>
                      {i + 1}. {s.label} <span className="text-muted-foreground">(h)</span>
                    </Label>
                    <Input
                      id={`s-${s.key}`}
                      type="number"
                      step="any"
                      value={s.hours}
                      onChange={(e) =>
                        setStageForm((prev) =>
                          prev.map((st) =>
                            st.key === s.key
                              ? { ...st, hours: Number(e.target.value) || 0 }
                              : st,
                          ),
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-accent">
                Motivos de atraso (ocorrências)
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {reasonForm.map((r) => (
                  <div key={r.key} className="space-y-1.5">
                    <Label htmlFor={`r-${r.key}`}>{r.label}</Label>
                    <Input
                      id={`r-${r.key}`}
                      type="number"
                      step="1"
                      value={r.count}
                      onChange={(e) =>
                        setReasonForm((prev) =>
                          prev.map((it) =>
                            it.key === r.key
                              ? { ...it, count: Number(e.target.value) || 0 }
                              : it,
                          ),
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={saveFlow}>Salvar fluxo</Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
