import type { Status } from "@/lib/almox";

export const statusRing: Record<Status, string> = {
  ok: "border-success/45 shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-success)_25%,transparent)]",
  alerta: "border-warning/45",
  critico: "border-danger/50",
};

export const statusDot: Record<Status, string> = {
  ok: "bg-success",
  alerta: "bg-warning",
  critico: "bg-danger",
};

export const statusText: Record<Status, string> = {
  ok: "text-success",
  alerta: "text-warning",
  critico: "text-danger",
};

export const statusChip: Record<Status, string> = {
  ok: "bg-success/15 text-success border-success/30",
  alerta: "bg-warning/15 text-warning border-warning/30",
  critico: "bg-danger/15 text-danger border-danger/30",
};
