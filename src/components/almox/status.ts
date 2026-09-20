import type { Status } from "@/lib/almox";

export const statusRing: Record<Status, string> = {
  ok: "border-success/45",
  alerta: "border-warning/45",
  critico: "border-danger/50",
  info: "border-border",
};

export const statusDot: Record<Status, string> = {
  ok: "bg-success",
  alerta: "bg-warning",
  critico: "bg-danger",
  info: "bg-accent",
};

export const statusText: Record<Status, string> = {
  ok: "text-success",
  alerta: "text-warning",
  critico: "text-danger",
  info: "text-accent",
};

export const statusChip: Record<Status, string> = {
  ok: "bg-success/15 text-success border-success/30",
  alerta: "bg-warning/15 text-warning border-warning/30",
  critico: "bg-danger/15 text-danger border-danger/30",
  info: "bg-accent/12 text-accent border-accent/30",
};
