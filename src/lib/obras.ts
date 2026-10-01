import type { MonthKey } from "./almox";

export interface Obra {
  id: string;
  name: string;
  city: string;
  /** termos extras usados para reconhecer a obra nas observações da nota */
  aliases?: string[] | undefined;
}

export type MovementKind = "obra_obra" | "deposito_obra" | "obra_deposito";

export interface Movement {
  nf: string;
  month: MonthKey;
  kind: MovementKind;
  originId: string | null; // null = depósito Drilling
  destId: string | null;
  value: number;
  carrier: string;
}

export interface PurchaseOrder {
  number: string;
  supplier: string;
  destination: string;
  date: string; // YYYY-MM-DD
  month: MonthKey;
  sender: string;
  urgent: boolean;
}

export const KIND_LABEL: Record<MovementKind, string> = {
  obra_obra: "Obra → Obra",
  deposito_obra: "Drilling → Obra",
  obra_deposito: "Obra → Drilling",
};

export const DEFAULT_OBRAS: Obra[] = [
  { id: "btec-congonhas", name: "BTEC MRB Terminal Avante", city: "Congonhas/MG", aliases: ["CONGONHAS", "BTEC", "AVANTE"] },
  { id: "aura-belvedere", name: "Aura Belvedere Mall", city: "Belo Horizonte/MG", aliases: ["AURA", "BELVEDERE MALL"] },
  { id: "grande-sertao", name: "Grande Sertão", city: "São João do Paraíso/MG", aliases: ["SAO JOAO DO PARAISO", "GRANDE SERTAO"] },
  { id: "capibaribe", name: "Ponte Capibaribe", city: "Recife/PE", aliases: ["RECIFE", "CAPIBARIBE", "CORDEIRO"] },
  { id: "aro-jardins", name: "ARO GSA Jardins Belvedere", city: "Belo Horizonte/MG", aliases: ["JARDINS BELVEDERE", "ARO GSA"] },
  { id: "itaparica", name: "Ponte Salvador Itaparica", city: "Itaparica/BA", aliases: ["ITAPARICA", "VERA CRUZ", "PARAGUASSU"] },
  { id: "sinop", name: "Obra Sinop", city: "Sinop/MT", aliases: ["SINOP"] },
  { id: "phv-sinval", name: "PHV Engenharia Ed. Sinval", city: "Belo Horizonte/MG", aliases: ["SINVAL", "PHV"] },
  { id: "witplan-panamera", name: "Witplan BTS Panamera Corp", city: "Belo Horizonte/MG", aliases: ["PANAMERA", "WITPLAN", "BTS", "NOVA LIMA"] },
  { id: "agaspar-grauna", name: "Construtora Agaspar – Ponte Graúna", city: "São Paulo/SP", aliases: ["AGASPAR", "GRAUNA"] },
  { id: "telar-blumenau", name: "Telar Blumenau", city: "Blumenau/SC", aliases: ["TELAR", "BLUMENAU", "BLUMENAL"] },
  { id: "penedo", name: "Ponte Penedo – Neópolis", city: "Penedo/AL", aliases: ["PENEDO", "NEOPOLIS"] },
];

const DEPOSIT_TERMS = ["SAO JOSE DA LAPA", "ALAMEDA MARIANA", "NOSSO DEPOSITO", "DRILLING DO BRASIL"];

export const norm = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/\s+/g, " ");

const hasTerm = (text: string, term: string) => {
  const t = norm(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^A-Z0-9])${t}([^A-Z0-9]|$)`).test(text);
};

function obraTerms(o: Obra) {
  const city = o.city.split("/")[0]?.trim() ?? "";
  return [...(o.aliases ?? []), city, o.name].filter((t) => t.length >= 3);
}

function matchObra(text: string, obras: Obra[]): Obra | null {
  let best: { o: Obra; len: number } | null = null;
  for (const o of obras) {
    for (const t of obraTerms(o)) {
      if (hasTerm(text, t) && (!best || t.length > best.len)) best = { o, len: t.length };
    }
  }
  return best?.o ?? null;
}

type Side = { type: "obra"; obra: Obra } | { type: "deposito" } | { type: "outro" };

function classify(text: string, obras: Obra[]): Side {
  const obra = matchObra(text, obras);
  if (obra) return { type: "obra", obra };
  if (DEPOSIT_TERMS.some((t) => hasTerm(text, t))) return { type: "deposito" };
  return { type: "outro" };
}

/** Parser CSV com suporte a aspas e quebras de linha dentro de campos. */
export function parseDelimited(text: string, delim = ";"): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let q = false;
  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else q = false;
      } else field += c;
    } else if (c === '"') q = true;
    else if (c === delim) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}

export interface NfParseResult {
  accepted: Movement[];
  rejected: { nf: string; reason: string }[];
}

export function parseNfCsv(text: string, month: MonthKey, obras: Obra[]): NfParseResult {
  const rows = parseDelimited(text);
  const header = (rows[0] ?? []).map((h) => norm(h));
  const col = (name: string) => header.findIndex((h) => h.includes(name));
  const iNf = col("NOTA FISCAL");
  const iNat = col("NATUREZA");
  const iObs = header.findIndex((h) => h === "OBSERVACOES");
  const iVal = col("VALOR TOTAL");
  const iTr = col("TRANSPORTE");
  const res: NfParseResult = { accepted: [], rejected: [] };
  if (iNf < 0 || iNat < 0 || iObs < 0) {
    res.rejected.push({ nf: "—", reason: "Cabeçalho do protocolo de notas não reconhecido." });
    return res;
  }
  for (const r of rows.slice(1)) {
    const nf = (r[iNf] ?? "").trim();
    const nat = norm(r[iNat] ?? "");
    if (!/REMESSA DE BEM|RETORNO DE BEM/.test(nat)) continue; // ignora devoluções, destruição, outras saídas
    const obs = norm(r[iObs] ?? "");
    const split = obs.search(/SEGUE PARA|COM DESTINO|RETORNA PARA/);
    if (split < 0) {
      res.rejected.push({ nf, reason: "Origem/destino não identificados nas observações." });
      continue;
    }
    const start = Math.max(0, obs.search(/SAI D/));
    const origin = classify(obs.slice(start, split), obras);
    const dest = classify(obs.slice(split), obras);
    let kind: MovementKind | null = null;
    if (origin.type === "obra" && dest.type === "obra") kind = "obra_obra";
    else if (origin.type === "deposito" && dest.type === "obra") kind = "deposito_obra";
    else if (origin.type === "obra" && dest.type === "deposito") kind = "obra_deposito";
    if (!kind || (origin.type === "obra" && dest.type === "obra" && origin.obra.id === dest.obra.id)) {
      const d = (s: Side) => (s.type === "obra" ? s.obra.name : s.type === "deposito" ? "Drilling" : "local não cadastrado");
      res.rejected.push({ nf, reason: `Não é remessa entre obras/Drilling (${d(origin)} → ${d(dest)}).` });
      continue;
    }
    res.accepted.push({
      nf,
      month,
      kind,
      originId: origin.type === "obra" ? origin.obra.id : null,
      destId: dest.type === "obra" ? dest.obra.id : null,
      value: Number((r[iVal] ?? "0").replace(",", ".")) || 0,
      carrier: iTr >= 0 ? (r[iTr] ?? "").trim() : "",
    });
  }
  return res;
}

export function monthFromFilename(name: string): MonthKey | null {
  const m = name.match(/(\d{2})-(\d{2})-(\d{4})/);
  return m ? `${m[3]}-${m[2]}` : null;
}

export interface ObraRank {
  obra: Obra;
  sent: number;
  received: number;
  total: number;
}

export function rankObras(obras: Obra[], movements: Movement[], month?: MonthKey | undefined): ObraRank[] {
  const list = month ? movements.filter((m) => m.month === month) : movements;
  return obras
    .map((obra) => {
      const sent = list.filter((m) => m.originId === obra.id).length;
      const received = list.filter((m) => m.destId === obra.id).length;
      return { obra, sent, received, total: sent + received };
    })
    .sort((a, b) => b.total - a.total || a.obra.name.localeCompare(b.obra.name));
}

/** Lê a conversa exportada do WhatsApp e extrai somente os pedidos de compra (PC nnnn). */
export function parseWhatsappChat(text: string): PurchaseOrder[] {
  const lineRe = /^(\d{2})\/(\d{2})\/(\d{4}),? (\d{2}):(\d{2}) - ([^:]+): (.*)$/;
  const pcRe = /\bPC\s*(\d{3,6})\s+(.+?)(?:\s*\(([^)]*)\))?\s*\.pdf/i;
  const map = new Map<string, PurchaseOrder>();
  let last: PurchaseOrder | null = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/[\u200e\u200f\u2068\u2069]/g, "");
    const m = line.match(lineRe);
    if (!m) continue;
    const [, dd, mm, yyyy, , , sender, msg = ""] = m;
    const pc = msg.match(pcRe);
    if (pc) {
      const number = pc[1] ?? "";
      if (!map.has(number)) {
        const po: PurchaseOrder = {
          number,
          supplier: (pc[2] ?? "").trim(),
          destination: (pc[3] ?? "").trim(),
          date: `${yyyy}-${mm}-${dd}`,
          month: `${yyyy}-${mm}`,
          sender: (sender ?? "").trim(),
          urgent: false,
        };
        map.set(number, po);
        last = po;
      }
    } else if (last && /URGENT|EMERGENC/i.test(norm(msg))) {
      last.urgent = true;
    }
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export async function readWhatsappZip(file: File): Promise<PurchaseOrder[]> {
  if (/\.txt$/i.test(file.name)) return parseWhatsappChat(await file.text());
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(file);
  const txts = Object.values(zip.files).filter((f) => !f.dir && /\.txt$/i.test(f.name));
  const all: PurchaseOrder[] = [];
  for (const t of txts) all.push(...parseWhatsappChat(await t.async("string")));
  const map = new Map(all.map((p) => [p.number, p]));
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}
