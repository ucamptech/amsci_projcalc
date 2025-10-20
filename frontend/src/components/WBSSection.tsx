// src/components/WBSSection.tsx
import * as React from "react";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Resource, WbsRow } from "@/data/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cryptoId, parse2 } from "@/utils/number";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SectionTitle from "./SectionTitle";

type Props = {
  wbsRows: WbsRow[];
  setWbsRows: React.Dispatch<React.SetStateAction<WbsRow[]>>;
  resources: Resource[];
  lockActivity?: boolean;
};

export default function WBSSection({
  wbsRows,
  setWbsRows,
  resources,
  lockActivity = true,
}: Props) {
  const isSingleRow = wbsRows.length <= 1;

  // ----- functions -----
  const totals = React.useMemo(() => {
    const fx = wbsRows.reduce((sum, r) => sum + (Number(r.fxMandays) || 0), 0);
    const abap = wbsRows.reduce(
      (sum, r) => sum + (Number(r.abapMandays) || 0),
      0
    );
    return { fx, abap };
  }, [wbsRows]);

  function updateRow(id: string, patch: Partial<WbsRow>) {
    setWbsRows((rows) =>
      rows.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  }

  function addRow() {
    const newRow: WbsRow = {
      id: cryptoId(),
      activityId: 0,
      wbsId: "",
      activity: "New Activity",
      fxResourceId: "",
      fxMandays: 0,
      abapResourceId: "",
      abapMandays: 0,
    };
    setWbsRows((rows) => {
      const next = [...rows, newRow];
      return next;
    });
  }

  function removeRow(id: string) {
    // setWbsRows((rows) => rows.filter((r) => r.id !== id));
    // Retain 1 row
    setWbsRows((rows) => {
      if (rows.length <= 1) return rows;
      return rows.filter((r) => r.id !== id);
    });
  }

  function moveRow(id: string, dir: "up" | "down") {
    setWbsRows((rows) => {
      const idx = rows.findIndex((r) => r.id === id);
      if (idx < 0) return rows;
      const newIdx = dir === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= rows.length) return rows;
      const clone = [...rows];
      const [spliced] = clone.splice(idx, 1);
      clone.splice(newIdx, 0, spliced);
      return clone;
    });
  }

  return (
    <section className="mt-6">
      <SectionTitle title="II. High-Level WBS Breakdown with Estimated Effort" />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">
            Work Breakdown &amp; Estimates
          </CardTitle>
          <Button onClick={() => addRow()} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Row
          </Button>
        </CardHeader>

        <CardContent className="p-0 sm:p-2 md:p-4">
          <div
            className="
      relative w-full
      overflow-x-auto overflow-y-auto
      max-h-[50vh]
      rounded-lg border border-border
      scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent
    "
          >
            <Table className="min-w-[768px] w-full text-sm align-middle border-collapse">
              <TableHeader className="sticky top-0 bg-background z-10 border-b">
                <TableRow>
                  <TableHead className="w-[10%] text-left p-2 whitespace-nowrap">
                    WBS ID
                  </TableHead>
                  <TableHead className="w-[25%] text-left p-2 whitespace-nowrap">
                    Activity
                  </TableHead>
                  <TableHead className="w-[20%] text-left p-2 whitespace-nowrap">
                    FX Resource
                  </TableHead>
                  <TableHead className="w-[10%] text-right p-2 whitespace-nowrap">
                    Mandays
                  </TableHead>
                  <TableHead className="w-[20%] text-left p-2 whitespace-nowrap">
                    ABAP Resource
                  </TableHead>
                  <TableHead className="w-[10%] text-right p-2 whitespace-nowrap">
                    Mandays
                  </TableHead>
                  <TableHead className="w-[5%] text-right p-2 whitespace-nowrap">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {wbsRows.map((r, idx) => (
                  <TableRow key={r.id}>
                    {/* --- WBS ID --- */}
                    <TableCell>
                      <Input
                        className="w-full"
                        value={r.wbsId}
                        readOnly={lockActivity}
                        maxLength={10}
                        onChange={(e) =>
                          !lockActivity &&
                          updateRow(r.id, { wbsId: e.target.value })
                        }
                      />
                    </TableCell>

                    {/* --- Activity --- */}
                    <TableCell>
                      <Input
                        className="w-full"
                        value={r.activity}
                        readOnly={lockActivity}
                        maxLength={50}
                        onChange={(e) =>
                          !lockActivity &&
                          updateRow(r.id, { activity: e.target.value })
                        }
                      />
                    </TableCell>

                    {/* --- FX Resource --- */}
                    <TableCell>
                      <div className="grid gap-1">
                        <Label className="sr-only">FX Resource</Label>
                        <Select
                          value={String(r.fxResourceId ?? "")}
                          onValueChange={(val) =>
                            updateRow(r.id, { fxResourceId: val })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder="Select FX"
                              className="truncate"
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {resources.map((res) => (
                              <SelectItem key={res.id} value={String(res.id)}>
                                <span className="block max-w-[360px] truncate">
                                  {res.name} — {res.title}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>

                    {/* --- FX Mandays --- */}
                    <TableCell className="text-right">
                      <Input
                        className="w-full text-right"
                        inputMode="decimal"
                        type="number"
                        step="0.01"
                        min={0}
                        max={400}
                        value={r.fxMandays}
                        onChange={(e) =>
                          updateRow(r.id, {
                            fxMandays: parse2(e.target.value) as number,
                          })
                        }
                        onBlur={(e) =>
                          updateRow(r.id, {
                            fxMandays: Number(parse2(e.target.value) || 0),
                          })
                        }
                      />
                    </TableCell>

                    {/* --- ABAP Resource --- */}
                    <TableCell>
                      <div className="grid gap-1">
                        <Label className="sr-only">ABAP Resource</Label>
                        <Select
                          value={String(r.abapResourceId ?? "")}
                          onValueChange={(val) =>
                            updateRow(r.id, { abapResourceId: val })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder="Select ABAP"
                              className="truncate"
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {resources.map((res) => (
                              <SelectItem key={res.id} value={String(res.id)}>
                                <span className="block max-w-[360px] truncate">
                                  {res.name} — {res.title}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>

                    {/* --- ABAP Mandays --- */}
                    <TableCell className="text-right">
                      <Input
                        className="w-full text-right"
                        inputMode="decimal"
                        type="number"
                        step="0.01"
                        min={0}
                        max={400}
                        value={r.abapMandays}
                        onChange={(e) =>
                          updateRow(r.id, {
                            abapMandays: parse2(e.target.value) as number,
                          })
                        }
                        onBlur={(e) =>
                          updateRow(r.id, {
                            abapMandays: Number(parse2(e.target.value) || 0),
                          })
                        }
                      />
                    </TableCell>

                    {/* --- Actions --- */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => moveRow(r.id, "up")}
                          disabled={idx === 0}
                          title="Move up"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => moveRow(r.id, "down")}
                          disabled={idx === wbsRows.length - 1}
                          title="Move down"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          onClick={() => removeRow(r.id)}
                          disabled={isSingleRow}
                          title={
                            isSingleRow
                              ? "At least one row is required"
                              : "Remove row"
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>

              <TableFooter className="sticky bottom-0 bg-background z-10 border-t">
                <TableRow>
                  <TableCell colSpan={2}>
                    <strong>TOTAL ESTIMATED EFFORT</strong>
                  </TableCell>
                  <TableCell className="text-right">
                    <em>FX Total</em>
                  </TableCell>
                  <TableCell className="text-right">
                    <strong>{totals.fx.toFixed(2)}</strong>
                  </TableCell>
                  <TableCell className="text-right">
                    <em>ABAP Total</em>
                  </TableCell>
                  <TableCell className="text-right">
                    <strong>{totals.abap.toFixed(2)}</strong>
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
