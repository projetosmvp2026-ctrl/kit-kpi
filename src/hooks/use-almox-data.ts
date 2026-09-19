import { useCallback, useEffect, useState } from "react";
import {
  type AlmoxData,
  type CriticalItem,
  type MonthlyRecord,
  type Targets,
  seedData,
  sortRecords,
} from "@/lib/almox";

const STORAGE_KEY = "almoxarifado-kpis-v1";

export function useAlmoxData() {
  const [data, setData] = useState<AlmoxData>(() => seedData());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AlmoxData;
        if (parsed?.records?.length) setData(parsed);
      }
    } catch {
      /* ignora armazenamento indisponível */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* ignora armazenamento indisponível */
    }
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

  const reset = useCallback(() => setData(seedData()), []);

  return {
    data,
    hydrated,
    upsertRecord,
    upsertMany,
    removeRecord,
    setTargets,
    setCriticalItems,
    reset,
  };
}
