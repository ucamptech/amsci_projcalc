import type { Activity, Resource } from "@/api/types";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { WbsRow } from "@/data/types";
import { useMemo } from "react";

type Props = {
  wbsRows: WbsRow[];
  setWbsRows: React.Dispatch<React.SetStateAction<WbsRow[]>>;
  resources: Resource[];
  activities: Activity[];
  lockActivity?: boolean;
};

export default function WBSSection({
  wbsRows,
  setWbsRows,
  resources,
  activities,
  lockActivity = false,
}: Props) {
  const isSingleRow = wbsRows.length <= 1;
  const NONE_VALUE = "__none__";

  // ---------- derived states ----------
  const totals = useMemo(() => {
    const fx = wbsRows.reduce((sum, r) => sum + (Number(r.fxMandays) || 0), 0);
    const abap = wbsRows.reduce(
      (sum, r) => sum + (Number(r.abapMandays) || 0),
      0,
    );
    return { fx, abap };
  }, [wbsRows]);

  const { fxResources, abapResources } = useMemo(() => {
    const fxResources = resources.filter(
      (r) => r.resourceType?.name.toLowerCase() === "functional",
    );
    const abapResources = resources.filter(
      (r) => r.resourceType?.name.toLowerCase() === "technical",
    );
    return { fxResources, abapResources };
  }, [resources]);

  // ----- actions -----
  function updateRow(id: string, patch: Partial<WbsRow>) {
    setWbsRows((rows) =>
      rows.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
  }

  function addRow() {
    const newRow: WbsRow = {
      id: cryptoId(),
      activityId: 0,
      wbsId: "",
      activity: "", // start empty, user will select from options
      fxResourceId: "",
      fxMandays: 0,
      abapResourceId: "",
      abapMandays: 0,
    };
    setWbsRows((rows) => [...rows, newRow]);
  }

  function removeRow(id: string) {
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

  // ---------- render ----------
  return (
    <section className="mt-6 gap-0">
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
          <div className="border-border scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent relative max-h-[60vh] w-full overflow-x-auto overflow-y-auto rounded-lg border">
            <Table className="w-full min-w-[768px] border-collapse align-middle text-sm">
              <TableHeader className="bg-background sticky top-0 z-10 border-b">
                <TableRow>
                  <TableHead className="w-[10%] p-2 text-left whitespace-nowrap">
                    WBS ID
                  </TableHead>
                  <TableHead className="w-[25%] p-2 text-left whitespace-nowrap">
                    Activity
                  </TableHead>
                  <TableHead className="w-[20%] p-2 text-left whitespace-nowrap">
                    FX Resource
                  </TableHead>
                  <TableHead className="w-[10%] p-2 text-right whitespace-nowrap">
                    Mandays
                  </TableHead>
                  <TableHead className="w-[20%] p-2 text-left whitespace-nowrap">
                    ABAP Resource
                  </TableHead>
                  <TableHead className="w-[10%] p-2 text-right whitespace-nowrap">
                    Mandays
                  </TableHead>
                  <TableHead className="w-[5%] p-2 text-right whitespace-nowrap">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {wbsRows.map((r, idx) => (
                  <TableRow key={r.id}>
                    {/* --- WBS ID (auto-fills from activity) --- */}
                    <TableCell>
                      <Input
                        className="w-full"
                        value={r.wbsId}
                        readOnly={true}
                        maxLength={10}
                        onChange={(e) =>
                          !lockActivity &&
                          updateRow(r.id, { wbsId: e.target.value })
                        }
                      />
                    </TableCell>

                    {/* --- Activity (Select) --- */}
                    <TableCell className="overflow-hidden">
                      <div className="grid gap-1">
                        <Label className="sr-only">Activity</Label>
                        <Select
                          disabled={lockActivity}
                          value={r.activityId ? String(r.activityId) : ""}
                          onValueChange={(val) => {
                            const opt = activities.find(
                              (activity) => String(activity.id) === val,
                            );
                            if (!opt) return;
                            updateRow(r.id, {
                              activityId: opt.id,
                              activity: opt.activity,
                              wbsId: opt.wbsId,
                            });
                          }}
                        >
                          <SelectTrigger className="w-full max-w-full truncate">
                            <SelectValue
                              placeholder="Select activity"
                              className="truncate"
                            />
                          </SelectTrigger>
                          <SelectContent className="min-w-0">
                            {activities.map((activity) => (
                              <SelectItem
                                key={activity.id}
                                value={String(activity.id)}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className="font-medium">
                                    {activity.activity}
                                  </span>
                                  {/* <span className="text-muted-foreground">
                                    ({activity.wbsId})
                                  </span> */}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>

                    {/* --- FX Resource --- */}
                    <TableCell className="overflow-hidden">
                      <div className="grid gap-1">
                        <Label className="sr-only">FX Resource</Label>
                        <Select
                          disabled={lockActivity}
                          value={String(r.fxResourceId ?? "")}
                          onValueChange={(val) =>
                            // updateRow(r.id, { fxResourceId: val })
                            updateRow(r.id, {
                              fxResourceId: val === NONE_VALUE ? "" : val,
                            })
                          }
                        >
                          <SelectTrigger className="w-full max-w-full truncate">
                            <SelectValue
                              placeholder="Select FX"
                              className="truncate"
                            />
                          </SelectTrigger>
                          <SelectContent className="min-w-0">
                            <SelectItem value={NONE_VALUE}>
                              Select FX
                            </SelectItem>
                            {fxResources.map((res) => (
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
                        readOnly={lockActivity}
                        inputMode="decimal"
                        type="number"
                        step="0.1"
                        min={0}
                        max={400}
                        value={r.fxMandays}
                        onChange={(e) =>
                          updateRow(r.id, {
                            fxMandays: Number(parse2(e.target.value) || 0),
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
                    <TableCell className="overflow-hidden">
                      <div className="grid gap-1">
                        <Label className="sr-only">ABAP Resource</Label>
                        <Select
                          disabled={lockActivity}
                          value={String(r.abapResourceId ?? "")}
                          onValueChange={(val) =>
                            // updateRow(r.id, { abapResourceId: val })
                            updateRow(r.id, {
                              abapResourceId: val === NONE_VALUE ? "" : val,
                            })
                          }
                        >
                          <SelectTrigger className="w-full max-w-full truncate">
                            <SelectValue
                              placeholder="Select ABAP"
                              className="truncate"
                            />
                          </SelectTrigger>
                          <SelectContent className="min-w-0">
                            <SelectItem value={NONE_VALUE}>
                              Select ABAP
                            </SelectItem>
                            {abapResources.map((res) => (
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
                        readOnly={lockActivity}
                        inputMode="decimal"
                        type="number"
                        step="0.1"
                        min={0}
                        max={400}
                        value={r.abapMandays}
                        onChange={(e) =>
                          updateRow(r.id, {
                            abapMandays: Number(parse2(e.target.value) || 0),
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

              <TableFooter className="bg-background sticky bottom-0 z-10 border-t">
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
