import type { Estimate } from "@/api/types";

export const to2 = (v: unknown): string => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
};

export const parse2 = (v: string | number | null | undefined): number | "" => {
  if (v === "" || v === null || v === undefined) return "";
  const n = Number(v);
  return Number.isFinite(n) ? n : "";
};

export function cryptoId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? (crypto as Crypto).randomUUID()
    : Math.random().toString(36).slice(2);
}

// format ISO to YYYY-MM-DD
export function toYMD(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function toMoney(n: number) {
  const peso = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  });

  return peso.format(n);
}

export function toNumber(x: unknown): number {
  if (typeof x === "number") return x;
  if (typeof x === "string") return Number(x.replace(/,/g, ""));
  return 0;
}

export const toStr = (x: unknown): string => (x == null ? "" : String(x));

export const sumMandays = (list: Estimate[]) =>
  list.reduce((sum, e) => sum + (Number(e.mandays) || 0), 0);
