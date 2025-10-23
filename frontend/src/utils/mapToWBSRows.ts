import type { Estimate } from "@/api/types";
import type { WbsRow } from "@/data/types";

/**
 * Convert a list of estimate line items into WbsRow rows.
 * Each estimate becomes one row. The "functional" estimate fills the FX side,
 * the "technical" estimate fills the ABAP side. Unknown types keep both sides blank/zero.
 */
export function mapToWbsRows(estimates: Estimate[]): WbsRow[] {
  if (!Array.isArray(estimates) || estimates.length === 0) return [];

  const normalizeType = (e: Estimate) =>
    String(e.resource?.resourceType?.name ?? "")
      .trim()
      .toLowerCase(); // "functional" | "technical" | ""

  const toNum = (x: unknown): number => {
    const n = Number(x);
    return Number.isFinite(n) ? n : 0;
  };

  // Group by activityId
  const byActivity = new Map<
    string | number,
    {
      activityId: string | number;
      activityName: string;
      wbsId: string;
      functionals: Estimate[];
      technicals: Estimate[];
    }
  >();

  for (const e of estimates) {
    const key = e.activityId ?? "";

    const entry = byActivity.get(key) ?? {
      activityId: key,
      activityName: e.activity?.activity ?? "",
      wbsId: e.activity?.wbsId ?? "",
      functionals: [],
      technicals: [],
    };

    const kind = normalizeType(e);
    if (kind === "functional") entry.functionals.push(e);
    else if (kind === "technical") entry.technicals.push(e);
    else {
      // If type is unknown, you can choose to push to either side or skip.
      // Here we skip unknown types.
    }

    // Refresh activity meta if present
    if (!entry.activityName && e.activity?.activity)
      entry.activityName = e.activity.activity;
    if (!entry.wbsId && e.activity?.wbsId) entry.wbsId = e.activity.wbsId;

    byActivity.set(key, entry);
  }

  const rows: WbsRow[] = [];

  for (const [, group] of byActivity) {
    const { activityId, activityName, wbsId, functionals, technicals } = group;

    // Pair by index
    const maxLen = Math.max(functionals.length, technicals.length, 1);

    for (let i = 0; i < maxLen; i++) {
      const fx = functionals[i]; // may be undefined
      const abap = technicals[i]; // may be undefined

      const row: WbsRow = {
        id: `${String(activityId)}:${fx?.id ?? "fx0"}:${abap?.id ?? "abap0"}`,
        activityId: activityId ?? "",
        wbsId: wbsId ?? "",
        activity: activityName ?? "",

        fxId: fx?.id ?? undefined,
        fxResourceId: fx ? fx.resourceId : "",
        fxMandays: fx ? toNum(fx.mandays) : 0,

        abapId: abap?.id ?? undefined,
        abapResourceId: abap ? abap.resourceId : "",
        abapMandays: abap ? toNum(abap.mandays) : 0,
      };

      rows.push(row);
    }
  }

  return rows;
}

export default mapToWbsRows;
