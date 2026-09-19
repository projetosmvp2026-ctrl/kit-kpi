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
  METRICS,
  type MonthKey,
  type MonthlyRecord,
  type Targets,
  emptyRecord,
  monthLabelLong,
  sortRecords,
} from "@/lib/almox";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  records: MonthlyRecord[];
  targets: Targets;
  initialMonth: MonthKey;
  onSaveRecord: (r: MonthlyRecord) => void;
  onSaveTargets: (t: Targets) => void;
}

const unitHint = (unit: string) =>
  unit === "BRL" ? "R$" : unit === "PERCENT" ? "%" : unit === "MIN" ? "min" : "qtd";

export function DataEntryDialog({
  open,
  onOpenChange,
  records,
  targets,
  initialMonth,
  onSaveRecord,
  onSaveTargets,
}: Props) {
  const [month, setMonth] = useState<MonthKey>(initialMonth);
  const [form, setForm] = useState<MonthlyRecord>(emptyRecord(initialMonth));
  const [targetForm, setTargetForm] = useState<Targets>(targets);

  const existing = useMemo(
    () => sortRecords(records).find((r) => r.month === month),
    [records, month],
  );

  useEffect(() => {
    if (open) {
      setMonth(initialMonth);
      setTargetForm(targets);
    }
  }, [open, initialMonth, targets]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">Lançar indicadores</DialogTitle>
          <DialogDescription>
            Registre os valores fechados do mês ou ajuste as metas acordadas com a diretoria.
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
          </TabsList>

          <TabsContent value="mes" className="space-y-4 pt-4">
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
            <div className="grid gap-4 sm:grid-cols-2">
              {METRICS.map((m) => (
                <div key={m.key} className="space-y-1.5">
                  <Label htmlFor={`f-${m.key}`}>
                    {m.label}{" "}
                    <span className="text-muted-foreground">({unitHint(m.unit)})</span>
                  </Label>
                  <Input
                    id={`f-${m.key}`}
                    type="number"
                    step="any"
                    value={Number.isFinite(form[m.key]) ? form[m.key] : 0}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [m.key]: Number(e.target.value) || 0 }))
                    }
                  />
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={save}>Salvar mês</Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="metas" className="space-y-4 pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {METRICS.map((m) => (
                <div key={m.key} className="space-y-1.5">
                  <Label htmlFor={`t-${m.key}`}>
                    {m.label}{" "}
                    <span className="text-muted-foreground">({unitHint(m.unit)})</span>
                  </Label>
                  <Input
                    id={`t-${m.key}`}
                    type="number"
                    step="any"
                    value={targetForm[m.key]}
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
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
