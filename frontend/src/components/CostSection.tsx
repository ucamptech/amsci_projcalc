import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { Resource } from "@/api/types";
import SectionTitle from "./SectionTitle";
import type { WbsRow } from "@/data/types";
import { useMemo } from "react";

type Props = {
  wbsRows: WbsRow[];
  resources: Resource[];
};

type LineItem = {
  id: string;
  activityId: number;
  activityLabel: string;
  wbsId: string;
  resourceType: "Functional" | "Technical";
  resourceId: number;
  resourceName: string;
  resourceTitle: string;
  rate: number; // cost per manday
  mandays: number;
  subtotal: number; // rate * mandays
};

function toNumber(x: unknown): number {
  if (typeof x === "number") return x;
  if (typeof x === "string") return Number(x.replace(/,/g, ""));
  return 0;
}

function toMoney(n: number, currency = "₱"): string {
  // You can swap to Intl.NumberFormat if you prefer.
  return `${currency}${n.toFixed(2)}`;
}

export default function CostSection({ wbsRows, resources }: Props) {
  // Build a lookup for resources
  const resourcesById = useMemo(() => {
    const map = new Map<number, Resource>();
    for (const r of resources ?? []) {
      if (typeof r.id === "number") map.set(r.id, r);
    }
    return map;
  }, [resources]);

  // Build line-items from wbsRows
  const lines = useMemo<LineItem[]>(() => {
    const items: LineItem[] = [];

    for (const row of wbsRows) {
      // FX side (Functional)
      if (row.fxResourceId && toNumber(row.fxMandays) > 0) {
        const rid = Number(row.fxResourceId);
        const res = resourcesById.get(rid);
        const typeName = res?.resourceType?.name?.toLowerCase() ?? "";
        const isFunctional = typeName.includes("functional");
        const rate = toNumber(res?.cost);
        items.push({
          id: `${row.id}-fx`,
          activityId: Number(row.activityId),
          activityLabel: row.activity ?? "",
          wbsId: row.wbsId ?? "",
          resourceType: isFunctional ? "Functional" : "Technical", // fallback if mislabeled
          resourceId: rid,
          resourceName: res?.name ?? `#${rid}`,
          resourceTitle: res?.title ?? "",
          rate,
          mandays: toNumber(row.fxMandays),
          subtotal: rate * toNumber(row.fxMandays),
        });
      }

      // ABAP side (Technical)
      if (row.abapResourceId && toNumber(row.abapMandays) > 0) {
        const rid = Number(row.abapResourceId);
        const res = resourcesById.get(rid);
        const typeName = res?.resourceType?.name?.toLowerCase() ?? "";
        const isTechnical = typeName.includes("technical");
        const rate = toNumber(res?.cost);
        items.push({
          id: `${row.id}-abap`,
          activityId: Number(row.activityId),
          activityLabel: row.activity ?? "",
          wbsId: row.wbsId ?? "",
          resourceType: isTechnical ? "Technical" : "Functional",
          resourceId: rid,
          resourceName: res?.name ?? `#${rid}`,
          resourceTitle: res?.title ?? "",
          rate,
          mandays: toNumber(row.abapMandays),
          subtotal: rate * toNumber(row.abapMandays),
        });
      }
    }

    return items;
  }, [wbsRows, resourcesById]);

  // Summaries
  const { grandTotal, byResource, byType, totalDays } = useMemo(() => {
    let grandTotal = 0;
    let totalDays = 0;

    // By resource id
    const byResource = new Map<
      number,
      {
        resourceId: number;
        name: string;
        title: string;
        rate: number;
        mandays: number;
        total: number;
      }
    >();

    // By type
    const byType = new Map<
      "Functional" | "Technical",
      { mandays: number; total: number }
    >([
      ["Functional", { mandays: 0, total: 0 }],
      ["Technical", { mandays: 0, total: 0 }],
    ]);

    for (const li of lines) {
      grandTotal += li.subtotal;
      totalDays += li.mandays;

      // Resource aggregation
      const r = byResource.get(li.resourceId) ?? {
        resourceId: li.resourceId,
        name: li.resourceName,
        title: li.resourceTitle,
        rate: li.rate, // assume constant per resource
        mandays: 0,
        total: 0,
      };
      r.mandays += li.mandays;
      r.total += li.subtotal;
      byResource.set(li.resourceId, r);

      // Type aggregation
      const tt = byType.get(li.resourceType)!;
      tt.mandays += li.mandays;
      tt.total += li.subtotal;
    }

    return { grandTotal, byResource, byType, totalDays };
  }, [lines]);

  console.log(byType);

  return (
    <section className="mt-6">
      <SectionTitle title="III. Computation" />

      {/* Detailed breakdown */}
      <Card className="mt-2 gap-0">
        {/* <CardHeader>
          <CardTitle className="text-base">
            Breakdown (Per Activity / Resource)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-2 md:p-4">
          <div className="relative w-full overflow-x-auto rounded-lg border border-border">
            <Table className="min-w-[820px] w-full text-sm align-middle">
              <TableHeader className="sticky top-0 bg-background z-10 border-b">
                <TableRow>
                  <TableHead className="w-[10%]">WBS ID</TableHead>
                  <TableHead className="w-[26%]">Activity</TableHead>
                  <TableHead className="w-[14%]">Type</TableHead>
                  <TableHead className="w-[24%]">Resource</TableHead>
                  <TableHead className="w-[8%]" style={{ textAlign: "right" }}>
                    Mandays
                  </TableHead>
                  <TableHead className="w-[9%]" style={{ textAlign: "right" }}>
                    Rate
                  </TableHead>
                  <TableHead className="w-[9%]" style={{ textAlign: "right" }}>
                    Subtotal
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-20 text-center text-muted-foreground"
                    >
                      No cost lines yet. Add resources and mandays in the WBS.
                    </TableCell>
                  </TableRow>
                ) : (
                  lines.map((li) => (
                    <TableRow key={li.id}>
                      <TableCell>{li.wbsId || "—"}</TableCell>
                      <TableCell title={li.activityLabel}>
                        <span className="line-clamp-1">
                          {li.activityLabel || "—"}
                        </span>
                      </TableCell>
                      <TableCell>{li.resourceType}</TableCell>
                      <TableCell
                        title={`${li.resourceName} — ${li.resourceTitle}`}
                      >
                        <span className="line-clamp-1">
                          {li.resourceName} — {li.resourceTitle}
                        </span>
                      </TableCell>
                      <TableCell style={{ textAlign: "right" }}>
                        {li.mandays.toFixed(2)}
                      </TableCell>
                      <TableCell style={{ textAlign: "right" }}>
                        {toMoney(li.rate)}
                      </TableCell>
                      <TableCell style={{ textAlign: "right" }}>
                        {toMoney(li.subtotal)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TableFooter className="sticky bottom-0 bg-background z-10 border-t">
                <TableRow>
                  <TableCell colSpan={5}></TableCell>
                  <TableCell className="text-right font-medium">
                    Grand Total
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {toMoney(grandTotal)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent> */}

        {/* Breakdown by Resource */}
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Breakdown by Resource</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-2 md:p-4">
          <div className="relative w-full overflow-x-auto rounded-lg border border-border">
            <Table className="min-w-[680px] w-full text-sm align-middle">
              <TableHeader className="sticky top-0 bg-background z-10 border-b">
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead style={{ textAlign: "right" }}>Rate</TableHead>
                  <TableHead style={{ textAlign: "right" }}>Mandays</TableHead>
                  <TableHead style={{ textAlign: "right" }}>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from(byResource.values()).length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-16 text-center text-muted-foreground"
                    >
                      No resources selected.
                    </TableCell>
                  </TableRow>
                ) : (
                  Array.from(byResource.values()).map((r) => (
                    <TableRow key={r.resourceId}>
                      <TableCell>{r.name}</TableCell>
                      <TableCell>{r.title || "—"}</TableCell>
                      <TableCell style={{ textAlign: "right" }}>
                        {toMoney(r.rate)}
                      </TableCell>
                      <TableCell style={{ textAlign: "right" }}>
                        {r.mandays.toFixed(2)}
                      </TableCell>
                      <TableCell style={{ textAlign: "right" }}>
                        {toMoney(r.total)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TableFooter className="sticky bottom-0 bg-background z-10 border-t">
                <TableRow>
                  <TableCell colSpan={2}></TableCell>
                  <TableCell className="text-right font-medium">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {totalDays}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {toMoney(grandTotal)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>

        {/* Summary by Type */}
        {/* <CardHeader>
          <CardTitle className="text-base">Summary by Type</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-2 md:p-4">
          <div className="relative w-full overflow-x-auto rounded-lg border border-border">
            <Table className="min-w-[520px] w-full text-sm align-middle">
              <TableHeader className="sticky top-0 bg-background z-10 border-b">
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead style={{ textAlign: "right" }}>Mandays</TableHead>
                  <TableHead style={{ textAlign: "right" }}>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(["Functional", "Technical"] as const).map((k) => {
                  const row = byType.get(k)!;
                  return (
                    <TableRow key={k}>
                      <TableCell>{k}</TableCell>
                      <TableCell style={{ textAlign: "right" }}>
                        {row.mandays.toFixed(2)}
                      </TableCell>
                      <TableCell style={{ textAlign: "right" }}>
                        {toMoney(row.total)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter className="sticky bottom-0 bg-background z-10 border-t">
                <TableRow>
                  <TableCell className="text-right font-medium">
                    Grand Total
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {totalDays}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {toMoney(grandTotal)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent> */}
      </Card>
    </section>
  );
}
