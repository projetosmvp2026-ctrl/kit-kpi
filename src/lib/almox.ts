export type MonthKey = string; // "YYYY-MM"

export interface MonthlyRecord {
  month: MonthKey;
  /* Estoque */
  totalValue: number; // R$ valor total do estoque
  deadStockValue: number; // R$ estoque parado / sem giro
  /* Controle */
  inventoryLossValue: number; // R$ divergências e perdas
  accuracy: number; // IRA %
  /* Atendimento */
  otif: number; // % nível de atendimento
  avgFulfillmentMinutes: number; // minutos
  /* Risco */
  criticalItemsCount: number; // itens abaixo do mínimo
  stockouts: number; // rupturas
  /* Coletas */
  collectionsRequested: number;
  collectionsCompleted: number;
  collectionsOnTime: number;
  collectionsPending: number;
  collectionsLate: number;
  collectionsAvgHours: number;
  collectionsUrgent: number;
}

export type MetricField = keyof Omit<MonthlyRecord, "month">;

export type Targets = Record<string, number>;

export type CriticalKind = "abaixo_minimo" | "divergencia";

export interface CriticalItem {
  id: string;
  code: string;
  name: string;
  kind: CriticalKind;
  value: number;
  qty?: number;
}

export interface FlowStage {
  key: string;
  label: string;
  hours: number;
}

export interface DelayReason {
  key: string;
  label: string;
  count: number;
}

export interface AlmoxData {
  records: MonthlyRecord[];
  targets: Targets;
  criticalItems: CriticalItem[];
  stages: FlowStage[];
  delayReasons: DelayReason[];
}

export type MetricUnit = "BRL" | "PERCENT" | "MIN" | "HOUR" | "COUNT";
export type MetricGroup = "estoque" | "atendimento" | "controle" | "risco" | "coletas";

export interface MetricDef {
  key: string;
  label: string;
  short: string;
  unit: MetricUnit;
  /** "up" = quanto maior melhor; "down" = quanto menor melhor; "info" = sem farol */
  direction: "up" | "down" | "info";
  help: string;
  group: MetricGroup;
  field?: MetricField;
  derive?: (r: MonthlyRecord) => number;
  formula?: string;
}

export const GROUP_LABEL: Record<MetricGroup, string> = {
  estoque: "Estoque",
  atendimento: "Atendimento",
  controle: "Controle",
  risco: "Risco",
  coletas: "Coletas",
};

/** Campos lançados manualmente / via CSV, na ordem do modelo de planilha. */
export interface FieldDef {
  key: MetricField;
  label: string;
  unit: MetricUnit;
  csv: string;
  group: MetricGroup;
}

export const MONTH_FIELDS: FieldDef[] = [
  { key: "totalValue", label: "Valor Total do Estoque", unit: "BRL", csv: "valor_total", group: "estoque" },
  { key: "deadStockValue", label: "Estoque Parado / Sem Giro", unit: "BRL", csv: "estoque_sem_giro", group: "estoque" },
  { key: "inventoryLossValue", label: "Divergências e Perdas", unit: "BRL", csv: "divergencias", group: "controle" },
  { key: "otif", label: "Nível de Atendimento (OTIF)", unit: "PERCENT", csv: "otif", group: "atendimento" },
  { key: "avgFulfillmentMinutes", label: "Tempo Médio de Atendimento", unit: "MIN", csv: "tempo_medio_min", group: "atendimento" },
  { key: "accuracy", label: "Acuracidade do Estoque (IRA)", unit: "PERCENT", csv: "acuracidade", group: "controle" },
  { key: "criticalItemsCount", label: "Itens Críticos Abaixo do Mínimo", unit: "COUNT", csv: "itens_criticos", group: "risco" },
  { key: "stockouts", label: "Rupturas no Período", unit: "COUNT", csv: "rupturas", group: "risco" },
  { key: "collectionsRequested", label: "Coletas Solicitadas", unit: "COUNT", csv: "coletas_solicitadas", group: "coletas" },
  { key: "collectionsCompleted", label: "Coletas Realizadas", unit: "COUNT", csv: "coletas_realizadas", group: "coletas" },
  { key: "collectionsOnTime", label: "Coletas Concluídas no Prazo", unit: "COUNT", csv: "coletas_no_prazo", group: "coletas" },
  { key: "collectionsPending", label: "Coletas Pendentes", unit: "COUNT", csv: "coletas_pendentes", group: "coletas" },
  { key: "collectionsLate", label: "Coletas Atrasadas", unit: "COUNT", csv: "coletas_atrasadas", group: "coletas" },
  { key: "collectionsAvgHours", label: "Tempo Médio para Realização", unit: "HOUR", csv: "coletas_tempo_medio_h", group: "coletas" },
  { key: "collectionsUrgent", label: "Coletas Urgentes / Emergenciais", unit: "COUNT", csv: "coletas_urgentes", group: "coletas" },
];

export const collectionsFulfillment = (r: MonthlyRecord) =>
  r.collectionsRequested ? (r.collectionsCompleted / r.collectionsRequested) * 100 : 0;

export const collectionsSla = (r: MonthlyRecord) =>
  r.collectionsCompleted ? (r.collectionsOnTime / r.collectionsCompleted) * 100 : 0;

export const METRICS: MetricDef[] = [
  {
    key: "totalValue",
    field: "totalValue",
    label: "Valor Total do Estoque",
    short: "Estoque total",
    unit: "BRL",
    direction: "down",
    group: "estoque",
    help: "Capital imobilizado no almoxarifado ao fim do mês.",
  },
  {
    key: "deadStockValue",
    field: "deadStockValue",
    label: "Estoque Parado / Sem Giro",
    short: "Sem giro",
    unit: "BRL",
    direction: "down",
    group: "estoque",
    help: "Itens sem movimentação no período, em R$ e % do estoque total.",
  },
  {
    key: "otif",
    field: "otif",
    label: "Nível de Atendimento (OTIF)",
    short: "OTIF",
    unit: "PERCENT",
    direction: "up",
    group: "atendimento",
    help: "Requisições atendidas completas e no prazo.",
  },
  {
    key: "avgFulfillmentMinutes",
    field: "avgFulfillmentMinutes",
    label: "Tempo Médio de Atendimento",
    short: "Tempo médio",
    unit: "MIN",
    direction: "down",
    group: "atendimento",
    help: "Da abertura da requisição à entrega do material.",
  },
  {
    key: "inventoryLossValue",
    field: "inventoryLossValue",
    label: "Divergências e Perdas",
    short: "Perdas",
    unit: "BRL",
    direction: "down",
    group: "controle",
    help: "Resultado financeiro das divergências apuradas no inventário.",
  },
  {
    key: "accuracy",
    field: "accuracy",
    label: "Acuracidade do Estoque (IRA)",
    short: "IRA",
    unit: "PERCENT",
    direction: "up",
    group: "controle",
    help: "Itens com saldo físico igual ao sistema.",
  },
  {
    key: "criticalItemsCount",
    field: "criticalItemsCount",
    label: "Itens Críticos Abaixo do Mínimo",
    short: "Itens críticos",
    unit: "COUNT",
    direction: "down",
    group: "risco",
    help: "Itens com saldo abaixo do ponto mínimo de reposição.",
  },
  {
    key: "stockouts",
    field: "stockouts",
    label: "Rupturas no Período",
    short: "Rupturas",
    unit: "COUNT",
    direction: "down",
    group: "risco",
    help: "Ocorrências de falta de material no atendimento.",
  },
  /* ------------------------------ Coletas ------------------------------ */
  {
    key: "collectionsRequested",
    field: "collectionsRequested",
    label: "Coletas Solicitadas",
    short: "Solicitadas",
    unit: "COUNT",
    direction: "info",
    group: "coletas",
    help: "Total de solicitações de coleta abertas no período.",
  },
  {
    key: "collectionsCompleted",
    field: "collectionsCompleted",
    label: "Coletas Realizadas",
    short: "Realizadas",
    unit: "COUNT",
    direction: "up",
    group: "coletas",
    help: "Coletas efetivamente executadas no período.",
  },
  {
    key: "collectionsFulfillmentPct",
    label: "% de Atendimento das Coletas",
    short: "Atendimento",
    unit: "PERCENT",
    direction: "up",
    group: "coletas",
    derive: collectionsFulfillment,
    formula: "coletas realizadas ÷ coletas solicitadas",
    help: "Proporção das solicitações que foram atendidas.",
  },
  {
    key: "collectionsPending",
    field: "collectionsPending",
    label: "Coletas Pendentes",
    short: "Pendentes",
    unit: "COUNT",
    direction: "down",
    group: "coletas",
    help: "Solicitações ainda em aberto ao fim do período.",
  },
  {
    key: "collectionsLate",
    field: "collectionsLate",
    label: "Coletas Atrasadas",
    short: "Atrasadas",
    unit: "COUNT",
    direction: "down",
    group: "coletas",
    help: "Coletas fora do prazo acordado com a obra/solicitante.",
  },
  {
    key: "collectionsSlaPct",
    label: "% de Coletas no Prazo (SLA)",
    short: "SLA coletas",
    unit: "PERCENT",
    direction: "up",
    group: "coletas",
    derive: collectionsSla,
    formula: "coletas concluídas no prazo ÷ coletas realizadas",
    help: "Cumprimento do SLA de coleta.",
  },
  {
    key: "collectionsAvgHours",
    field: "collectionsAvgHours",
    label: "Tempo Médio para Realização",
    short: "Tempo coleta",
    unit: "HOUR",
    direction: "down",
    group: "coletas",
    help: "Da solicitação até a realização da coleta.",
  },
  {
    key: "collectionsUrgent",
    field: "collectionsUrgent",
    label: "Coletas Urgentes / Emergenciais",
    short: "Urgentes",
    unit: "COUNT",
    direction: "info",
    group: "coletas",
    help: "Volume tratado fora do planejamento normal.",
  },
];

export const METRICS_BY_GROUP = (group: MetricGroup) => METRICS.filter((m) => m.group === group);

export function metricValue(record: MonthlyRecord, def: MetricDef) {
  if (def.derive) return def.derive(record);
  return def.field ? (record[def.field] ?? 0) : 0;
}

export const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v || 0);

export function formatMetric(unit: MetricUnit, v: number) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  switch (unit) {
    case "BRL":
      return brl(v);
    case "PERCENT":
      return `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
    case "MIN":
      return `${v.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} min`;
    case "HOUR":
      return `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} h`;
    default:
      return v.toLocaleString("pt-BR");
  }
}

export const unitHint = (unit: MetricUnit) =>
  unit === "BRL" ? "R$" : unit === "PERCENT" ? "%" : unit === "MIN" ? "min" : unit === "HOUR" ? "h" : "qtd";

export type Status = "ok" | "alerta" | "critico" | "info";

/** Farol: compara o realizado com a meta considerando a direção do indicador. */
export function statusOf(
  value: number,
  target: number,
  direction: "up" | "down" | "info",
): Status {
  if (direction === "info") return "info";
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
  info: "Informativo",
};

export function variation(current: number, previous?: number | undefined) {
  if (previous === undefined || previous === null || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function monthDate(month: MonthKey) {
  const parts = month.split("-");
  const y = Number(parts[0] ?? "1970");
  const m = Number(parts[1] ?? "1");
  return new Date(y, (m || 1) - 1, 1);
}

export function monthLabel(month: MonthKey) {
  return monthDate(month)
    .toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
    .replace(".", "");
}

export function monthLabelLong(month: MonthKey) {
  const s = monthDate(month).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function emptyRecord(month: MonthKey): MonthlyRecord {
  const base = { month } as MonthlyRecord;
  for (const f of MONTH_FIELDS) base[f.key] = 0;
  return base;
}

/** Garante que registros salvos antes do módulo de coletas continuem válidos. */
export function normalizeRecord(r: Partial<MonthlyRecord> & { month: MonthKey }): MonthlyRecord {
  const out = emptyRecord(r.month);
  for (const f of MONTH_FIELDS) {
    const v = r[f.key];
    out[f.key] = typeof v === "number" && Number.isFinite(v) ? v : 0;
  }
  return out;
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
  collectionsCompleted: 120,
  collectionsFulfillmentPct: 97,
  collectionsPending: 8,
  collectionsLate: 6,
  collectionsSlaPct: 95,
  collectionsAvgHours: 36,
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
    collectionsRequested: 118,
    collectionsCompleted: 96,
    collectionsOnTime: 74,
    collectionsPending: 22,
    collectionsLate: 19,
    collectionsAvgHours: 62,
    collectionsUrgent: 21,
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
    collectionsRequested: 126,
    collectionsCompleted: 106,
    collectionsOnTime: 86,
    collectionsPending: 20,
    collectionsLate: 17,
    collectionsAvgHours: 57,
    collectionsUrgent: 19,
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
    collectionsRequested: 131,
    collectionsCompleted: 114,
    collectionsOnTime: 96,
    collectionsPending: 17,
    collectionsLate: 15,
    collectionsAvgHours: 52,
    collectionsUrgent: 17,
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
    collectionsRequested: 138,
    collectionsCompleted: 124,
    collectionsOnTime: 108,
    collectionsPending: 14,
    collectionsLate: 13,
    collectionsAvgHours: 46,
    collectionsUrgent: 15,
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
    collectionsRequested: 142,
    collectionsCompleted: 131,
    collectionsOnTime: 119,
    collectionsPending: 11,
    collectionsLate: 10,
    collectionsAvgHours: 41,
    collectionsUrgent: 13,
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
    collectionsRequested: 149,
    collectionsCompleted: 140,
    collectionsOnTime: 130,
    collectionsPending: 9,
    collectionsLate: 8,
    collectionsAvgHours: 37,
    collectionsUrgent: 11,
  },
];

const SEED_ITEMS: CriticalItem[] = [
  { id: "c1", code: "ROL-6205", name: "Rolamento 6205 2RS", kind: "divergencia", value: 4820, qty: 36 },
  { id: "c2", code: "LUV-NIT-09", name: "Luva nitrílica CA 28.900", kind: "abaixo_minimo", value: 3960, qty: 120 },
  { id: "c3", code: "OLE-HID-68", name: "Óleo hidráulico ISO 68 (20L)", kind: "divergencia", value: 3410, qty: 11 },
  { id: "c4", code: "FIL-AR-320", name: "Filtro de ar compressor 320", kind: "abaixo_minimo", value: 2780, qty: 8 },
  { id: "c5", code: "ELE-7018", name: "Eletrodo 7018 3,25mm", kind: "divergencia", value: 2190, qty: 54 },
  { id: "c6", code: "COR-A52", name: "Correia A52", kind: "abaixo_minimo", value: 1480, qty: 6 },
];

export const DEFAULT_STAGES: FlowStage[] = [
  { key: "solicitacao", label: "Solicitação", hours: 4 },
  { key: "separacao", label: "Separação", hours: 9 },
  { key: "emissao", label: "Emissão", hours: 6 },
  { key: "coleta", label: "Coleta", hours: 18 },
  { key: "transporte", label: "Transporte", hours: 11 },
  { key: "entrega", label: "Entrega", hours: 5 },
];

export const DEFAULT_DELAY_REASONS: DelayReason[] = [
  { key: "transportadora", label: "Transportadora", count: 12 },
  { key: "fornecedor", label: "Fornecedor", count: 9 },
  { key: "planejamento", label: "Planejamento", count: 6 },
  { key: "obra", label: "Obra / solicitante", count: 4 },
  { key: "documentacao", label: "Documentação fiscal", count: 3 },
];

export function seedData(): AlmoxData {
  return {
    records: SEED_MONTHS,
    targets: { ...DEFAULT_TARGETS },
    criticalItems: SEED_ITEMS,
    stages: DEFAULT_STAGES.map((s) => ({ ...s })),
    delayReasons: DEFAULT_DELAY_REASONS.map((r) => ({ ...r })),
  };
}

export function sortRecords(records: MonthlyRecord[]) {
  return [...records].sort((a, b) => a.month.localeCompare(b.month));
}

export function bottleneckStage(stages: FlowStage[]) {
  return stages.reduce<FlowStage | undefined>(
    (acc, s) => (!acc || s.hours > acc.hours ? s : acc),
    undefined,
  );
}

/* ---------------------------------- CSV ---------------------------------- */

export const CSV_HEADER = ["mes", ...MONTH_FIELDS.map((f) => f.csv)].join(";");

export const CSV_TEMPLATE = `${CSV_HEADER}
2026-08;1868000;190300;18900;93,8;52;96,8;22;7;142;131;119;11;10;41;13
2026-09;1824000;168400;16350;94,9;47;97,6;18;6;149;140;130;9;8;37;11`;

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

const normalizeHeader = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

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
  const header = lines[0] ?? "";
  if (!header) return { records: [], errors: ["Arquivo vazio."] };

  const delimiter =
    (header.match(/;/g)?.length ?? 0) >= (header.match(/,/g)?.length ?? 0) ? ";" : ",";
  const headerCols = header.split(delimiter).map(normalizeHeader);
  const hasHeader = headerCols.some((c) => c === "mes" || c === "m_s" || c === "mes_ref");
  const byName = new Map<string, number>();
  if (hasHeader) headerCols.forEach((c, i) => byName.set(c, i));

  const records: MonthlyRecord[] = [];
  const start = hasHeader ? 1 : 0;

  for (let i = start; i < lines.length; i++) {
    const cols = (lines[i] ?? "").split(delimiter);
    const pick = (field: FieldDef, positionalIndex: number) => {
      const idx = hasHeader ? byName.get(field.csv) : positionalIndex;
      if (idx === undefined || idx < 0) return 0;
      return num(cols[idx] ?? "");
    };

    const monthIdx = hasHeader ? (byName.get("mes") ?? 0) : 0;
    const month = (cols[monthIdx] ?? "").trim();
    if (!/^\d{4}-\d{2}$/.test(month)) {
      errors.push(`Linha ${i + 1}: mês "${month}" inválido (use AAAA-MM).`);
      continue;
    }
    if (!hasHeader && cols.length < 9) {
      errors.push(`Linha ${i + 1}: mínimo de 9 colunas esperado, encontradas ${cols.length}.`);
      continue;
    }

    const rec = emptyRecord(month);
    MONTH_FIELDS.forEach((f, idx) => {
      rec[f.key] = pick(f, idx + 1);
    });
    records.push(rec);
  }

  if (hasHeader) {
    const missing = MONTH_FIELDS.filter((f) => !byName.has(f.csv)).map((f) => f.csv);
    if (missing.length) {
      errors.push(`Colunas ausentes (assumidas como 0): ${missing.join(", ")}.`);
    }
  }

  return { records, errors };
}

export function recordsToCsv(records: MonthlyRecord[]) {
  const rows = sortRecords(records).map((r) =>
    [r.month, ...MONTH_FIELDS.map((f) => r[f.key])]
      .map((v) => String(v).replace(".", ","))
      .join(";"),
  );
  return [CSV_HEADER, ...rows].join("\n");
}

export function monthReportCsv(data: AlmoxData, month: MonthKey) {
  const rec = data.records.find((r) => r.month === month);
  if (!rec) return "";
  const prev = previousOf(data.records, month);
  const lines = ["Bloco;Indicador;Mes atual;Mes anterior;Meta;Variacao %;Status"];
  for (const m of METRICS) {
    const v = metricValue(rec, m);
    const p = prev ? metricValue(prev, m) : undefined;
    const t = data.targets[m.key] ?? 0;
    const varPct = variation(v, p);
    lines.push(
      [
        GROUP_LABEL[m.group],
        m.label,
        v,
        p ?? "",
        m.direction === "info" ? "" : t,
        varPct === null ? "" : varPct.toFixed(1),
        STATUS_LABEL[statusOf(v, t, m.direction)],
      ]
        .map((x) => String(x).replace(".", ","))
        .join(";"),
    );
  }

  lines.push("");
  lines.push("Fluxo de coletas;Etapa;Tempo medio (h)");
  for (const s of data.stages) {
    lines.push(["", s.label, String(s.hours).replace(".", ",")].join(";"));
  }

  lines.push("");
  lines.push("Motivos de atraso;Motivo;Ocorrencias");
  for (const r of data.delayReasons) {
    lines.push(["", r.label, String(r.count)].join(";"));
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
