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
import { useCallback, useEffect, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import type { Resource } from "@/api/types";
import SectionTitle from "./SectionTitle";

type Props = {
  wbsRows: WbsRow[];
  resources: Resource[];
  onRateChange?: (resourceId: number, newRate: number) => void;
  onByResourceChange?: (list: CostByResourceInit[]) => void;
};

export default function CostByResourceSection({
  wbsRows,
  resources,
  onRateChange,
  onByResourceChange,
}: Props) {
  const [rateOverrides, setRateOverrides] = useState<Map<number, number>>(
    () => new Map(),
  );

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

  // line items produced from rows
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

  // aggregate + also expose an array for the parent
  const { grandTotal, totalDays, totalRate, byResourceList } = useMemo(() => {
    const byResource = new Map<number, CostByResourceInit>();

    for (const li of lines) {
      const r = byResource.get(li.resourceId) ?? {
        resourceId: li.resourceId,
        resourceName: li.resourceName,
        resourceTitle: li.resourceTitle,
        rate: li.rate,
        mandays: 0,
        subtotal: 0,
      };

      r.rate = li.rate; // latest rate wins
      r.mandays += li.mandays; // accumulate
      r.subtotal += li.subtotal; // accumulate

      byResource.set(li.resourceId, r);
    }

    const list = Array.from(byResource.values());

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
  }, [lines]);

  // LIFT array to parent
  useEffect(() => {
    onByResourceChange?.(byResourceList);
  }, [onByResourceChange, byResourceList]);

  return (
    <section className="mt-6">
      <SectionTitle title="III. Computation" />

      <Card className="mt-2 gap-0">
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Breakdown by Resource</CardTitle>
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
                  <TableHead className="w-[20%] text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from(byResourceList.values()).length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-muted-foreground h-16 text-center"
                    >
                      No resources selected.
                    </TableCell>
                  </TableRow>
                ) : (
                  Array.from(byResourceList.values()).map((r) => (
                    <TableRow key={r.resourceId}>
                      <TableCell>{r.resourceName}</TableCell>
                      <TableCell>{r.resourceTitle || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <Input
                            className="h-8 w-36 text-right"
                            inputMode="decimal"
                            type="number"
                            min={0}
                            step="0.01"
                            value={
                              Number.isFinite(r.rate) ? String(r.rate) : ""
                            }
                            onChange={(e) => {
                              const val = Number(parse2(e.target.value) || 0);
                              setRate(r.resourceId, val);
                            }}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {r.mandays.toFixed(2)}
                      </TableCell>
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
                  <TableCell colSpan={1}></TableCell>
                  <TableCell className="text-right font-bold">
                    {totalRate.toFixed(2)}
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
