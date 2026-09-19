import { useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  CSV_HEADER,
  CSV_TEMPLATE,
  type MonthlyRecord,
  downloadText,
  monthLabel,
  parseCsv,
} from "@/lib/almox";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImport: (records: MonthlyRecord[]) => void;
}

export function ImportDialog({ open, onOpenChange, onImport }: Props) {
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [preview, setPreview] = useState<MonthlyRecord[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const analyse = (value: string) => {
    setText(value);
    if (!value.trim()) {
      setErrors([]);
      setPreview([]);
      return;
    }
    const res = parseCsv(value);
    setErrors(res.errors);
    setPreview(res.records);
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    const content = await file.text();
    analyse(content);
  };

  const confirm = () => {
    if (!preview.length) {
      toast.error("Nenhuma linha válida encontrada.");
      return;
    }
    onImport(preview);
    toast.success(`${preview.length} mês(es) importado(s) com sucesso.`);
    setText("");
    setPreview([]);
    setErrors([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">Importar planilha (CSV)</DialogTitle>
          <DialogDescription>
            Uma linha por mês, separada por ponto e vírgula. Meses já existentes são substituídos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-surface-2/60 p-3">
            <p className="text-xs font-medium text-muted-foreground">Colunas esperadas</p>
            <code className="mt-1 block break-all text-xs text-accent">{CSV_HEADER}</code>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv,text/plain"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" /> Selecionar arquivo
            </Button>
            <Button
              variant="ghost"
              onClick={() => downloadText("modelo-kpis-almoxarifado.csv", CSV_TEMPLATE)}
            >
              <Download className="size-4" /> Baixar modelo
            </Button>
          </div>

          <Textarea
            rows={7}
            placeholder={CSV_TEMPLATE}
            value={text}
            onChange={(e) => analyse(e.target.value)}
            className="tabular font-mono text-xs"
          />

          {errors.length > 0 && (
            <ul className="space-y-1 rounded-lg border border-danger/40 bg-danger/10 p-3 text-xs text-danger">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}

          {preview.length > 0 && (
            <div className="rounded-lg border border-success/40 bg-success/10 p-3 text-xs text-success">
              {preview.length} mês(es) prontos para importar:{" "}
              {preview.map((r) => monthLabel(r.month)).join(", ")}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={confirm} disabled={!preview.length}>
            Importar {preview.length || ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
