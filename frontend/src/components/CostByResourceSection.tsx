import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CostByResourceInit, WbsRow } from "@/data/types";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { parse2, toMoney } from "@/utils/number";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import type { Resource } from "@/api/types";
import SectionTitle from "./SectionTitle";

type Props = {
  wbsRows: WbsRow[];
  resources: Resource[];
  byResource: CostByResourceInit[];
  onRateChange?: (resourceId: number, newRate: number) => void;
  onByResourceChange?: (list: CostByResourceInit[]) => void;
};

const PM_ID = 99999; // Project Manager id

export default function CostByResourceSection({
  wbsRows,
  resources,
  byResource,
  onRateChange,
  onByResourceChange,
}: Props) {
  const [rateOverrides, setRateOverrides] = useState<Map<number, number>>(
    () => new Map(),
  );

  const [pmRate, setPmRate] = useState<number>(0);
  const [pmMandays, setPmMandays] = useState<number>(0);

  const isReady = resources && resources.length > 0;
  const didHydrateRef = useRef(false); // for non-PM override hydration
  const pmHydratedRef = useRef(false); // for PM hydration (once)
  const lastLiftHashRef = useRef<string>("");

  const setRate = useCallback(
    (resourceId: number, newRate: number) => {
      setRateOverrides((prev) => {
        const m = new Map(prev);
        m.set(resourceId, newRate);
        return m;
      });
      onRateChange?.(resourceId, newRate);
    },
    [onRateChange],
  );

  const resourcesById = useMemo(() => {
    const map = new Map<number, Resource>();
    for (const resource of resources ?? []) {
      if (typeof resource.id === "number") map.set(resource.id, resource);
    }
    return map;
  }, [resources]);

  // Build line items from wbsRows
  const lines = useMemo<CostByResourceInit[]>(() => {
    const items: CostByResourceInit[] = [];

    for (const row of wbsRows) {
      if (row.fxResourceId && Number(row.fxMandays) > 0) {
        const rid = Number(row.fxResourceId);
        const res = resourcesById.get(rid);
        const baseRate = Number(res?.cost ?? 0);
        const rate = Number(rateOverrides.get(rid) ?? baseRate);
        const mandays = Number(row.fxMandays) || 0;

        items.push({
          resourceId: rid,
          resourceName: res?.name ?? `#${rid}`,
          resourceTitle: res?.title ?? "",
          rate,
          mandays,
          subtotal: rate * mandays,
        });
      }

      if (row.abapResourceId && Number(row.abapMandays) > 0) {
        const rid = Number(row.abapResourceId);
        const res = resourcesById.get(rid);
        const baseRate = Number(res?.cost ?? 0);
        const rate = Number(rateOverrides.get(rid) ?? baseRate);
        const mandays = Number(row.abapMandays) || 0;

        items.push({
          resourceId: rid,
          resourceName: res?.name ?? `#${rid}`,
          resourceTitle: res?.title ?? "",
          rate,
          mandays,
          subtotal: rate * mandays,
        });
      }
    }

    return items;
  }, [wbsRows, resourcesById, rateOverrides]);

  // Aggregate by resource
  const { grandTotal, totalDays, totalRate, byResourceList } = useMemo(() => {
    const byResMap = new Map<number, CostByResourceInit>();

    for (const li of lines) {
      const r = byResMap.get(li.resourceId) ?? {
        resourceId: li.resourceId,
        resourceName: li.resourceName,
        resourceTitle: li.resourceTitle,
        rate: li.rate,
        mandays: 0,
        subtotal: 0,
      };
      r.rate = li.rate;
      r.mandays += li.mandays;
      r.subtotal += r.rate * r.mandays;
      byResMap.set(li.resourceId, r);
    }

    const list = Array.from(byResMap.values());

    const pmIndex = list.findIndex(
      (r) => r.resourceTitle?.toLowerCase() === "project manager",
    );

    if (pmIndex === -1) {
      // Add to the first row
      list.unshift({
        resourceId: PM_ID,
        resourceName: "Project Manager",
        resourceTitle: "Project Manager",
        rate: pmRate,
        mandays: pmMandays,
        subtotal: pmRate * pmMandays,
      });
    } else {
      const pm = list[pmIndex];
      pm.resourceId = PM_ID;
      pm.rate = pmRate;
      pm.mandays = pmMandays;
      pm.subtotal = pm.rate * pm.mandays;

      if (pmIndex !== 0) {
        list.splice(pmIndex, 1);
        list.unshift(pm);
      }
    }

    // Apply overrides to NON-PM rows only
    for (const r of list) {
      if (r.resourceId === PM_ID) continue;
      if (rateOverrides.has(r.resourceId)) {
        const over = Number(rateOverrides.get(r.resourceId));
        if (Number.isFinite(over)) {
          r.rate = over;
          r.subtotal = r.rate * r.mandays;
        }
      }
    }

    let grandTotal = 0;
    let totalDays = 0;
    for (const r of list) {
      grandTotal += r.subtotal;
      totalDays += r.mandays;
    }

    const totalRate = list.reduce(
      (s, r) => s + (Number.isFinite(r.rate) ? r.rate : 0),
      0,
    );

    return { grandTotal, totalDays, totalRate, byResourceList: list };
  }, [lines, rateOverrides, pmRate, pmMandays]);

  // ---------- FETCH ----------
  // Hydrate NON-PM overrides from saved byResource
  useEffect(() => {
    if (!isReady) return;
    if (didHydrateRef.current) return;
    if (!byResource || byResource.length === 0) {
      didHydrateRef.current = true;
      return;
    }

    const ids = new Set(
      resources
        .map((r) => r.id)
        .filter((id): id is number => typeof id === "number"),
    );

    const next = new Map<number, number>();
    for (const br of byResource) {
      const isPMTitle = br.resourceTitle?.toLowerCase() === "project manager";
      const isPMId = br.resourceId === PM_ID;
      if (isPMTitle || isPMId) continue;

      if (ids.has(br.resourceId) && Number.isFinite(br.rate)) {
        next.set(br.resourceId, Number(br.rate));
      }
    }

    let different = next.size !== rateOverrides.size;
    if (!different) {
      for (const [k, v] of next) {
        if (rateOverrides.get(k) !== v) {
          different = true;
          break;
        }
      }
    }
    if (different) setRateOverrides(next);

    didHydrateRef.current = true;
  }, [isReady, resources, byResource, rateOverrides]);

  // Hydrate PM from saved byResource ONCE
  useEffect(() => {
    if (!isReady) return;
    if (pmHydratedRef.current) return;
    if (!byResource || byResource.length === 0) return;

    const pmSaved = byResource.find(
      (br) =>
        br.resourceId === PM_ID ||
        br.resourceTitle?.toLowerCase() === "project manager",
    );

    if (pmSaved) {
      if (Number.isFinite(pmSaved.rate)) setPmRate(Number(pmSaved.rate));
      if (Number.isFinite(pmSaved.mandays))
        setPmMandays(Number(pmSaved.mandays));
    }

    pmHydratedRef.current = true;
  }, [isReady, byResource]);

  // Lift to parent ONLY when data changed
  useEffect(() => {
    if (!isReady) return;

    const hash = JSON.stringify(
      byResourceList.map((r) => ({
        id: r.resourceId,
        n: r.resourceName,
        t: r.resourceTitle,
        rate: r.rate,
        d: r.mandays,
        s: r.subtotal,
      })),
    );

    if (hash === lastLiftHashRef.current) return;
    lastLiftHashRef.current = hash;

    onByResourceChange?.(byResourceList);
  }, [isReady, byResourceList, onByResourceChange]);

  return (
    <section className="mt-6">
      <SectionTitle title="III. Cost Computation" />
      <Card className="mt-2 gap-0">
        <CardHeader className="pb-0">
          <CardTitle className="text-base">By Resource</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-2 md:p-4">
          <div className="border-border relative w-full overflow-x-auto rounded-lg border">
            <Table className="w-full min-w-[740px] align-middle text-sm">
              <TableHeader className="bg-background sticky top-0 z-10 border-b">
                <TableRow>
                  <TableHead className="w-[30%]">Resource</TableHead>
                  <TableHead className="w-[20%]">Title</TableHead>
                  <TableHead className="w-[20%] text-right">Rate</TableHead>
                  <TableHead className="w-[10%] text-right">Mandays</TableHead>
                  <TableHead className="w-[20%] text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byResourceList.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-muted-foreground h-16 text-center"
                    >
                      No resources selected.
                    </TableCell>
                  </TableRow>
                ) : (
                  byResourceList.map((r) => (
                    <TableRow key={r.resourceId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {r.resourceName || "—"}
                          {r.resourceTitle?.toLowerCase() ===
                            "project manager" && (
                            <span className="rounded-full border border-cyan-300 bg-cyan-100 px-1.5 py-0.5 text-xs text-cyan-700">
                              Default
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{r.resourceTitle || "—"}</TableCell>

                      {/* Rate */}
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          {r.resourceId === PM_ID ? (
                            <Input
                              className="h-8 w-36 text-right"
                              inputMode="decimal"
                              type="number"
                              min={0}
                              step="1"
                              value={String(pmRate)}
                              onChange={(e) =>
                                setPmRate(Number(parse2(e.target.value) || 0))
                              }
                              onBlur={(e) =>
                                setPmRate(Number(parse2(e.target.value) || 0))
                              }
                            />
                          ) : (
                            <Input
                              className="h-8 w-36 text-right"
                              inputMode="decimal"
                              type="number"
                              min={0}
                              step="1"
                              value={String(
                                rateOverrides.get(r.resourceId) ??
                                  (Number.isFinite(r.rate) ? r.rate : ""),
                              )}
                              onChange={(e) => {
                                const val = Number(parse2(e.target.value) || 0);
                                setRate(r.resourceId, val);
                              }}
                            />
                          )}
                        </div>
                      </TableCell>

                      {/* Mandays */}
                      <TableCell className="text-right">
                        {r.resourceId === PM_ID ? (
                          <div className="flex justify-end">
                            <Input
                              className="h-8 w-28 text-right"
                              inputMode="decimal"
                              type="number"
                              min={0}
                              step="0.5"
                              value={String(pmMandays)}
                              onChange={(e) =>
                                setPmMandays(
                                  Number(parse2(e.target.value) || 0),
                                )
                              }
                              onBlur={(e) =>
                                setPmMandays(
                                  Number(parse2(e.target.value) || 0),
                                )
                              }
                            />
                          </div>
                        ) : (
                          r.mandays.toFixed(2)
                        )}
                      </TableCell>

                      {/* Total */}
                      <TableCell className="text-right">
                        {toMoney(r.subtotal)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>

              <TableFooter className="bg-background sticky bottom-0 z-10 border-t">
                <TableRow>
                  <TableCell className="font-medium">
                    <strong>TOTAL</strong>
                  </TableCell>
                  <TableCell />
                  <TableCell className="text-right font-bold">
                    {toMoney(totalRate)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {totalDays.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {toMoney(grandTotal)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
