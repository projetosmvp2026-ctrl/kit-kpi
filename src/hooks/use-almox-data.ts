import { useCallback, useEffect, useState } from "react";
import {
  type AlmoxData,
  type CriticalItem,
  type DelayReason,
  type FlowStage,
  type MonthlyRecord,
  type Targets,
  DEFAULT_DELAY_REASONS,
  DEFAULT_STAGES,
  DEFAULT_TARGETS,
  normalizeRecord,
  seedData,
  sortRecords,
} from "@/lib/almox";
import { DEFAULT_OBRAS, type Movement, type Obra, type PurchaseOrder } from "@/lib/obras";
import { emptyRecord } from "@/lib/almox";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "almoxarifado-kpis-v1";

function hydrate(raw: string): AlmoxData | null {
  const parsed = JSON.parse(raw) as Partial<AlmoxData>;
  if (!parsed?.records?.length) return null;
  return {
    records: sortRecords(parsed.records.map((r) => normalizeRecord(r))),
    targets: { ...DEFAULT_TARGETS, ...(parsed.targets ?? {}) },
    criticalItems: parsed.criticalItems ?? [],
    stages: parsed.stages?.length ? parsed.stages : DEFAULT_STAGES.map((s) => ({ ...s })),
    delayReasons: parsed.delayReasons?.length
      ? parsed.delayReasons
      : DEFAULT_DELAY_REASONS.map((r) => ({ ...r })),
    obras: parsed.obras?.length ? parsed.obras : DEFAULT_OBRAS.map((o) => ({ ...o })),
    movements: parsed.movements ?? [],
    purchaseOrders: parsed.purchaseOrders ?? [],
  };
}

export function useAlmoxData() {
  const [data, setData] = useState<AlmoxData>(() => seedData());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const next = hydrate(raw);
          if (next && alive) setData(next);
        }
      } catch {
        /* ignora */
      }
      try {
        const { data: row } = await supabase
          .from("almox_state")
          .select("data")
          .eq("id", "main")
          .maybeSingle();
        if (row?.data && alive) {
          const next = hydrate(JSON.stringify(row.data));
          if (next) setData(next);
        }
      } catch {
        /* nuvem indisponível: segue com dados locais */
      }
      if (alive) setHydrated(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* ignora */
    }
    const t = setTimeout(() => {
      void supabase
        .from("almox_state")
        .upsert({ id: "main", data: data as never, updated_at: new Date().toISOString() })
        .then(({ error }) => {
          if (error) console.error("Falha ao salvar na nuvem", error);
        });
    }, 800);
    return () => clearTimeout(t);
  }, [data, hydrated]);

  const upsertRecord = useCallback((record: MonthlyRecord) => {
    setData((d) => {
      const others = d.records.filter((r) => r.month !== record.month);
      return { ...d, records: sortRecords([...others, record]) };
    });
  }, []);

  const upsertMany = useCallback((records: MonthlyRecord[]) => {
    setData((d) => {
      const map = new Map(d.records.map((r) => [r.month, r]));
      for (const r of records) map.set(r.month, r);
      return { ...d, records: sortRecords([...map.values()]) };
    });
  }, []);

  const removeRecord = useCallback((month: string) => {
    setData((d) => ({ ...d, records: d.records.filter((r) => r.month !== month) }));
  }, []);

  const setTargets = useCallback((targets: Targets) => {
    setData((d) => ({ ...d, targets }));
  }, []);

  const setCriticalItems = useCallback((criticalItems: CriticalItem[]) => {
    setData((d) => ({ ...d, criticalItems }));
  }, []);

  const setStages = useCallback((stages: FlowStage[]) => {
    setData((d) => ({ ...d, stages }));
  }, []);

  const setDelayReasons = useCallback((delayReasons: DelayReason[]) => {
    setData((d) => ({ ...d, delayReasons }));
  }, []);

  const setObras = useCallback((obras: Obra[]) => {
    setData((d) => ({ ...d, obras }));
  }, []);

  const addMovements = useCallback((list: Movement[]) => {
    setData((d) => {
      const map = new Map(d.movements.map((m) => [m.nf, m]));
      for (const m of list) map.set(m.nf, m);
      return { ...d, movements: [...map.values()] };
    });
  }, []);

  const updateMovement = useCallback((nf: string, patch: Partial<Movement>) => {
    setData((d) => ({ ...d, movements: d.movements.map((m) => (m.nf === nf ? { ...m, ...patch } : m)) }));
  }, []);

  const clearMovements = useCallback((month?: string) => {
    setData((d) => ({ ...d, movements: month ? d.movements.filter((m) => m.month !== month) : [] }));
  }, []);

  /** Registra pedidos de compra e atualiza coletas solicitadas/urgentes de cada mês. */
  const addPurchaseOrders = useCallback((list: PurchaseOrder[]) => {
    setData((d) => {
      const map = new Map(d.purchaseOrders.map((p) => [p.number, p]));
      for (const p of list) map.set(p.number, p);
      const purchaseOrders = [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
      const months = new Set(list.map((p) => p.month));
      const recs = new Map(d.records.map((r) => [r.month, r]));
      for (const m of months) {
        const pos = purchaseOrders.filter((p) => p.month === m);
        const base = recs.get(m) ?? emptyRecord(m);
        recs.set(m, {
          ...base,
          collectionsRequested: pos.length,
          collectionsUrgent: pos.filter((p) => p.urgent).length,
          emergencyPurchases: pos.filter((p) => p.urgent).length,
        });
      }
      return { ...d, purchaseOrders, records: sortRecords([...recs.values()]) };
    });
  }, []);

  const reset = useCallback(() => setData(seedData()), []);

  return {
    data,
    hydrated,
    upsertRecord,
    upsertMany,
    removeRecord,
    setTargets,
    setCriticalItems,
    setStages,
    setDelayReasons,
    setObras,
    addMovements,
    clearMovements,
    updateMovement,
    addPurchaseOrders,
    reset,
  };
}
