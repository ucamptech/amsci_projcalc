import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DEFAULT_RESOURCES } from "@/lib/constants/project";
import { Input } from "@/components/ui/input";
import type { Resource } from "@/types/resource.type";
import type { WBSItem } from "@/types/project.type";
import { useMemo } from "react";

//---------------------------------------------------------------------------
// Types
//---------------------------------------------------------------------------
type CostRow = {
  key: string;
  type: "FX" | "ABAP" | "PM";
  name: string;
  title: string;
  baseRate: number;
  mandays: number;
  isDefault?: boolean;
};

//---------------------------------------------------------------------------
// Constants
//---------------------------------------------------------------------------
const DEFAULT_PM_RATE = 0;
const DEFAULT_BADGE = (
  <span className="rounded-full border border-cyan-300 bg-cyan-100 px-1.5 py-0.5 text-xs text-cyan-700">
    Default
  </span>
);

//---------------------------------------------------------------------------
// Component
//---------------------------------------------------------------------------
export function CostSection({
  wbsItems,
  resources,
  lockActivity = false,
  rateOverrides = {},
  mandayOverrides = {},
  onRateChange,
  onMandayChange,
}: {
  wbsItems: WBSItem[];
  resources?: Resource[];
  lockActivity?: boolean;
  rateOverrides?: Record<string, number>;
  mandayOverrides?: Record<string, number>;
  onRateChange?: (key: string, value: number) => void;
  onMandayChange?: (key: string, value: number) => void;
}) {
  //--------------------------------------------------------------------------
  // Helpers
  //--------------------------------------------------------------------------
  const resourceList = resources?.length ? resources : DEFAULT_RESOURCES;

  //--------------------------------------------------------------------------
  // Functions
  //--------------------------------------------------------------------------

  const handleRateChange = (key: string, value: number) => {
    onRateChange?.(key, value);
  };

  const handleMandayChange = (key: string, value: number) => {
    onMandayChange?.(key, value);
  };

  const buildRows = (items: WBSItem[], resources: Resource[]): CostRow[] => {
    const resourceMap = new Map<number, Resource>(
      resources.map((resource) => [resource.id, resource]),
    );

    const rows: CostRow[] = [
      {
        key: "projectManager",
        type: "PM",
        name: "Project Manager",
        title: "Project Manager",
        baseRate: DEFAULT_PM_RATE,
        mandays: 0,
        isDefault: true,
      },
    ];

    items.forEach((item) => {
      if (item.fxResourceId) {
        const resource = resourceMap.get(item.fxResourceId);
        const rate = Number(resource?.cost ?? 0);
        const mandays = Number(item.fxMandays) || 0;
        rows.push({
          key: `fx-${item.fxResourceId}-${item.id}`,
          type: "FX",
          name: resource?.name ?? `Resource #${item.fxResourceId}`,
          title: resource?.title ?? resource?.name ?? "-",
          baseRate: rate,
          mandays,
          isDefault: false,
        });
      }
      if (item.abapResourceId) {
        const resource = resourceMap.get(item.abapResourceId);
        const rate = Number(resource?.cost ?? 0);
        const mandays = Number(item.abapMandays) || 0;
        rows.push({
          key: `abap-${item.abapResourceId}-${item.id}`,
          type: "ABAP",
          name: resource?.name ?? `Resource #${item.abapResourceId}`,
          title: resource?.title ?? resource?.name ?? "-",
          baseRate: rate,
          mandays,
          isDefault: false,
        });
      }
    });
    return rows;
  };

  //--------------------------------------------------------------------------
  // useMemos
  //--------------------------------------------------------------------------
  const rows = useMemo(
    () => buildRows(wbsItems, resourceList),
    [wbsItems, resourceList],
  );

  const computedRows = rows.map((row) => {
    const rate =
      rateOverrides[row.key] !== undefined
        ? rateOverrides[row.key]
        : row.baseRate;
    const mandays =
      mandayOverrides[row.key] !== undefined
        ? mandayOverrides[row.key]
        : row.mandays;
    const subtotal = rate * mandays;
    return { ...row, rate, mandays, subtotal };
  });

  const totalCost = computedRows.reduce(
    (sum, row) => sum + (row.subtotal || 0),
    0,
  );
  const totalMandays = computedRows.reduce(
    (sum, row) => sum + (row.mandays || 0),
    0,
  );
  const totalRate =
    computedRows.length > 0
      ? computedRows.reduce((sum, row) => sum + (row.rate ?? 0), 0)
      : 0;

  return (
    <section className="mt-0 gap-0">
      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown</CardTitle>
          <CardDescription>
            Calculated costs based on resource rates and mandays
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Mandays</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {computedRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm">
                      No resources selected.
                    </TableCell>
                  </TableRow>
                ) : (
                  computedRows.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell>{row.name || "-"}</TableCell>
                      <TableCell className="align-middle">
                        <div className="inline-flex items-center gap-2">
                          <span>{row.title || "-"}</span>
                          {row.isDefault && DEFAULT_BADGE}
                        </div>
                      </TableCell>

                      {/* -- Rate -- */}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={Number.isNaN(row.rate) ? "" : row.rate}
                            onChange={(e) =>
                              handleRateChange(
                                row.key,
                                Number(e.target.value) || 0,
                              )
                            }
                            className="w-24 text-right"
                          />
                        </div>
                      </TableCell>

                      {/* -- Mandays -- */}
                      <TableCell className="text-right">
                        {row.type === "PM" ? (
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={Number.isNaN(row.mandays) ? "" : row.mandays}
                            onChange={(e) =>
                              handleMandayChange(
                                row.key,
                                Number(e.target.value) || 0,
                              )
                            }
                            disabled={lockActivity}
                            className="w-24 text-right"
                          />
                        ) : (
                          row.mandays.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        ₱
                        {row.subtotal.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
                <TableRow>
                  <TableCell colSpan={2} className="text-left">
                    <strong>TOTAL</strong>
                  </TableCell>
                  <TableCell className="text-right">
                    <strong>
                      ₱
                      {totalRate.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </strong>
                  </TableCell>
                  <TableCell className="text-right">
                    <strong>
                      {totalMandays.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </strong>
                  </TableCell>
                  <TableCell className="text-right">
                    <strong>
                      ₱
                      {totalCost.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </strong>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
