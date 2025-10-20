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
