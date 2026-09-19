export type MonthKey = string; // "YYYY-MM"

export interface MonthlyRecord {
  month: MonthKey;
  totalValue: number; // R$ valor total do estoque
  deadStockValue: number; // R$ estoque parado / sem giro
  inventoryLossValue: number; // R$ divergências e perdas
  otif: number; // % nível de atendimento
  avgFulfillmentMinutes: number; // minutos
  accuracy: number; // IRA %
  criticalItemsCount: number; // itens abaixo do mínimo
  stockouts: number; // rupturas
}

export interface Targets {
  totalValue: number;
  deadStockValue: number;
  inventoryLossValue: number;
  otif: number;
  avgFulfillmentMinutes: number;
  accuracy: number;
  criticalItemsCount: number;
  stockouts: number;
}

export type CriticalKind = "abaixo_minimo" | "divergencia";

export interface CriticalItem {
  id: string;
  code: string;
  name: string;
  kind: CriticalKind;
  value: number; // R$ da divergência ou qtd faltante convertida em R$
  qty?: number;
}

export interface AlmoxData {
  records: MonthlyRecord[];
  targets: Targets;
  criticalItems: CriticalItem[];
}

export type MetricKey = keyof Omit<MonthlyRecord, "month">;

export interface MetricDef {
  key: MetricKey;
  label: string;
  short: string;
  unit: "BRL" | "PERCENT" | "MIN" | "COUNT";
  /** "up" = quanto maior melhor; "down" = quanto menor melhor */
  direction: "up" | "down";
  help: string;
}

export const METRICS: MetricDef[] = [
  {
    key: "totalValue",
    label: "Valor Total do Estoque",
    short: "Estoque total",
    unit: "BRL",
    direction: "down",
    help: "Capital imobilizado no almoxarifado ao fim do mês.",
  },
  {
    key: "deadStockValue",
    label: "Estoque Parado / Sem Giro",
    short: "Sem giro",
    unit: "BRL",
    direction: "down",
    help: "Itens sem movimentação no período, em R$ e % do estoque total.",
  },
  {
    key: "inventoryLossValue",
    label: "Divergências e Perdas",
    short: "Perdas",
    unit: "BRL",
    direction: "down",
    help: "Resultado financeiro das divergências apuradas no inventário.",
  },
  {
    key: "otif",
    label: "Nível de Atendimento (OTIF)",
    short: "OTIF",
    unit: "PERCENT",
    direction: "up",
    help: "Requisições atendidas completas e no prazo.",
  },
  {
    key: "avgFulfillmentMinutes",
    label: "Tempo Médio de Atendimento",
    short: "Tempo médio",
    unit: "MIN",
    direction: "down",
    help: "Da abertura da requisição à entrega do material.",
  },
  {
    key: "accuracy",
    label: "Acuracidade do Estoque (IRA)",
    short: "IRA",
    unit: "PERCENT",
    direction: "up",
    help: "Itens com saldo físico igual ao sistema.",
  },
  {
    key: "criticalItemsCount",
    label: "Itens Críticos Abaixo do Mínimo",
    short: "Itens críticos",
    unit: "COUNT",
    direction: "down",
    help: "Itens com saldo abaixo do ponto mínimo de reposição.",
  },
  {
    key: "stockouts",
    label: "Rupturas no Período",
    short: "Rupturas",
    unit: "COUNT",
    direction: "down",
    help: "Ocorrências de falta de material no atendimento.",
  },
];

export const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v || 0);

export const brlFull = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export function formatMetric(unit: MetricDef["unit"], v: number) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  switch (unit) {
    case "BRL":
      return brl(v);
    case "PERCENT":
      return `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
    case "MIN":
      return `${v.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} min`;
    default:
      return v.toLocaleString("pt-BR");
  }
}

export type Status = "ok" | "alerta" | "critico";

/** Farol: compara o realizado com a meta considerando a direção do indicador. */
export function statusOf(value: number, target: number, direction: "up" | "down"): Status {
  if (!target) return "alerta";
  const ratio = value / target;
  if (direction === "up") {
    if (ratio >= 1) return "ok";
    if (ratio >= 0.95) return "alerta";
    return "critico";
  }
  if (ratio <= 1) return "ok";
  if (ratio <= 1.1) return "alerta";
  return "critico";
}

export const STATUS_LABEL: Record<Status, string> = {
  ok: "Meta atingida",
  alerta: "Atenção",
  critico: "Fora da meta",
};

export function variation(current: number, previous?: number) {
  if (previous === undefined || previous === null || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function monthLabel(month: MonthKey) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, (m || 1) - 1, 1);
  return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "");
}

export function monthLabelLong(month: MonthKey) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, (m || 1) - 1, 1);
  const s = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function emptyRecord(month: MonthKey): MonthlyRecord {
  return {
    month,
    totalValue: 0,
    deadStockValue: 0,
    inventoryLossValue: 0,
    otif: 0,
    avgFulfillmentMinutes: 0,
    accuracy: 0,
    criticalItemsCount: 0,
    stockouts: 0,
  };
}

export const DEFAULT_TARGETS: Targets = {
  totalValue: 1800000,
  deadStockValue: 120000,
  inventoryLossValue: 15000,
  otif: 95,
  avgFulfillmentMinutes: 45,
  accuracy: 98,
  criticalItemsCount: 15,
  stockouts: 5,
};

const SEED_MONTHS: MonthlyRecord[] = [
  {
    month: "2026-04",
    totalValue: 2050000,
    deadStockValue: 268000,
    inventoryLossValue: 31400,
    otif: 88.4,
    avgFulfillmentMinutes: 72,
    accuracy: 93.1,
    criticalItemsCount: 38,
    stockouts: 14,
  },
  {
    month: "2026-05",
    totalValue: 1995000,
    deadStockValue: 251000,
    inventoryLossValue: 27800,
    otif: 89.9,
    avgFulfillmentMinutes: 68,
    accuracy: 94.0,
    criticalItemsCount: 34,
    stockouts: 12,
  },
  {
    month: "2026-06",
    totalValue: 1940000,
    deadStockValue: 232000,
    inventoryLossValue: 24100,
    otif: 91.2,
    avgFulfillmentMinutes: 61,
    accuracy: 95.2,
    criticalItemsCount: 29,
    stockouts: 10,
  },
  {
    month: "2026-07",
    totalValue: 1902000,
    deadStockValue: 214500,
    inventoryLossValue: 21600,
    otif: 92.6,
    avgFulfillmentMinutes: 57,
    accuracy: 96.1,
    criticalItemsCount: 26,
    stockouts: 9,
  },
  {
    month: "2026-08",
    totalValue: 1868000,
    deadStockValue: 190300,
    inventoryLossValue: 18900,
    otif: 93.8,
    avgFulfillmentMinutes: 52,
    accuracy: 96.8,
    criticalItemsCount: 22,
    stockouts: 7,
  },
  {
    month: "2026-09",
    totalValue: 1824000,
    deadStockValue: 168400,
    inventoryLossValue: 16350,
    otif: 94.9,
    avgFulfillmentMinutes: 47,
    accuracy: 97.6,
    criticalItemsCount: 18,
    stockouts: 6,
  },
];

const SEED_ITEMS: CriticalItem[] = [
  {
    id: "c1",
    code: "ROL-6205",
    name: "Rolamento 6205 2RS",
    kind: "divergencia",
    value: 4820,
    qty: 36,
  },
  {
    id: "c2",
    code: "LUV-NIT-09",
    name: "Luva nitrílica CA 28.900",
    kind: "abaixo_minimo",
    value: 3960,
    qty: 120,
  },
  {
    id: "c3",
    code: "OLE-HID-68",
    name: "Óleo hidráulico ISO 68 (20L)",
    kind: "divergencia",
    value: 3410,
    qty: 11,
  },
  {
    id: "c4",
    code: "FIL-AR-320",
    name: "Filtro de ar compressor 320",
    kind: "abaixo_minimo",
    value: 2780,
    qty: 8,
  },
  {
    id: "c5",
    code: "ELE-7018",
    name: "Eletrodo 7018 3,25mm",
    kind: "divergencia",
    value: 2190,
    qty: 54,
  },
  {
    id: "c6",
    code: "COR-A52",
    name: "Correia A52",
    kind: "abaixo_minimo",
    value: 1480,
    qty: 6,
  },
];

export function seedData(): AlmoxData {
  return { records: SEED_MONTHS, targets: DEFAULT_TARGETS, criticalItems: SEED_ITEMS };
}

export function sortRecords(records: MonthlyRecord[]) {
  return [...records].sort((a, b) => a.month.localeCompare(b.month));
}

/* ---------------------------------- CSV ---------------------------------- */

export const CSV_HEADER =
  "mes;valor_total;estoque_sem_giro;divergencias;otif;tempo_medio_min;acuracidade;itens_criticos;rupturas";

export const CSV_TEMPLATE = `${CSV_HEADER}
2026-08;1868000;190300;18900;93,8;52;96,8;22;7
2026-09;1824000;168400;16350;94,9;47;97,6;18;6`;

const num = (s: string) => {
  const cleaned = (s ?? "")
    .toString()
    .trim()
    .replace(/[R$\s%]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const v = Number(cleaned);
  return Number.isFinite(v) ? v : 0;
};

export interface CsvResult {
  records: MonthlyRecord[];
  errors: string[];
}

export function parseCsv(text: string): CsvResult {
  const errors: string[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return { records: [], errors: ["Arquivo vazio."] };

  const delimiter = (lines[0].match(/;/g)?.length ?? 0) >= (lines[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  const start = /mes|m[êe]s/i.test(lines[0]) ? 1 : 0;
  const records: MonthlyRecord[] = [];

  for (let i = start; i < lines.length; i++) {
    const cols = lines[i].split(delimiter);
    if (cols.length < 9) {
      errors.push(`Linha ${i + 1}: esperadas 9 colunas, encontradas ${cols.length}.`);
      continue;
    }
    const month = cols[0].trim();
    if (!/^\d{4}-\d{2}$/.test(month)) {
      errors.push(`Linha ${i + 1}: mês "${month}" inválido (use AAAA-MM).`);
      continue;
    }
    records.push({
      month,
      totalValue: num(cols[1]),
      deadStockValue: num(cols[2]),
      inventoryLossValue: num(cols[3]),
      otif: num(cols[4]),
      avgFulfillmentMinutes: num(cols[5]),
      accuracy: num(cols[6]),
      criticalItemsCount: num(cols[7]),
      stockouts: num(cols[8]),
    });
  }
  return { records, errors };
}

export function recordsToCsv(records: MonthlyRecord[]) {
  const rows = sortRecords(records).map((r) =>
    [
      r.month,
      r.totalValue,
      r.deadStockValue,
      r.inventoryLossValue,
      r.otif,
      r.avgFulfillmentMinutes,
      r.accuracy,
      r.criticalItemsCount,
      r.stockouts,
    ]
      .map((v) => String(v).replace(".", ","))
      .join(";"),
  );
  return [CSV_HEADER, ...rows].join("\n");
}

export function monthReportCsv(data: AlmoxData, month: MonthKey) {
  const rec = data.records.find((r) => r.month === month);
  if (!rec) return "";
  const prev = previousOf(data.records, month);
  const lines = ["Indicador;Mes atual;Mes anterior;Meta;Variacao %;Status"];
  for (const m of METRICS) {
    const v = rec[m.key];
    const p = prev ? prev[m.key] : undefined;
    const t = data.targets[m.key];
    const varPct = variation(v, p);
    lines.push(
      [
        m.label,
        v,
        p ?? "",
        t,
        varPct === null ? "" : varPct.toFixed(1),
        STATUS_LABEL[statusOf(v, t, m.direction)],
      ]
        .map((x) => String(x).replace(".", ","))
        .join(";"),
    );
  }
  lines.push("");
  lines.push("Itens criticos;Codigo;Tipo;Valor");
  for (const it of data.criticalItems) {
    lines.push(
      [it.name, it.code, it.kind === "divergencia" ? "Divergencia" : "Abaixo do minimo", it.value]
        .map((x) => String(x).replace(".", ","))
        .join(";"),
    );
  }
  return lines.join("\n");
}

export function previousOf(records: MonthlyRecord[], month: MonthKey) {
  const sorted = sortRecords(records);
  const idx = sorted.findIndex((r) => r.month === month);
  return idx > 0 ? sorted[idx - 1] : undefined;
}

export function downloadText(filename: string, content: string) {
  const blob = new Blob([`\ufeff${content}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
