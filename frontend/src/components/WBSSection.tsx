import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DEFAULT_ACTIVITIES,
  DEFAULT_RESOURCES,
  RESOURCE_TYPE,
} from "@/lib/constants/project";
import type { Dispatch, SetStateAction } from "react";
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { Activity } from "@/types/activity.type";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Resource } from "@/types/resource.type";
import type { WBSItem } from "@/types/project.type";

//--------------------------------------------------------------------------
// Types
//--------------------------------------------------------------------------
type SectionProps = {
  wbsItems: WBSItem[];
  setWbsItems: Dispatch<SetStateAction<WBSItem[]>>;
  lockActivity?: boolean;
  activities?: Activity[];
  resources?: Resource[];
};

//--------------------------------------------------------------------------
// Constants
//--------------------------------------------------------------------------
const NONE_VALUE = "__none__";

//--------------------------------------------------------------------------
// Main component
//--------------------------------------------------------------------------
export function WBSSection({
  wbsItems,
  setWbsItems,
  lockActivity = false,
  activities,
  resources,
}: SectionProps) {
  //--------------------------------------------------------------------------
  // Helpers
  //--------------------------------------------------------------------------
  const totalFxMandays = wbsItems.reduce(
    (sum, item) => sum + (Number(item.fxMandays) || 0),
    0,
  );
  const totalAbapMandays = wbsItems.reduce(
    (sum, item) => sum + (Number(item.abapMandays) || 0),
    0,
  );
  const activityOptions =
    activities && activities.length > 0
      ? activities
      : DEFAULT_ACTIVITIES.map((item) => ({
          id: item.id,
          wbsId: item.wbsId,
          activity: item.activity,
        }));
  const fxResourceOptions: Resource[] = (
    resources?.length ? resources : DEFAULT_RESOURCES
  ).filter(
    (resource) => resource.resourceType?.name === RESOURCE_TYPE.Functional,
  );
  const abapResourceOptions: Resource[] = (
    resources?.length ? resources : DEFAULT_RESOURCES
  ).filter(
    (resource) => resource.resourceType?.name === RESOURCE_TYPE.Technical,
  );

  //--------------------------------------------------------------------------
  // Functions
  //--------------------------------------------------------------------------

  const addWBSItem = () => {
    const newId = wbsItems.length + 1;
    const defaultActivity = activityOptions[0];

    const newRow: WBSItem = {
      id: newId,
      wbsId: defaultActivity?.wbsId ?? `${newId}.0`,
      activityId: defaultActivity?.id ?? 1,
      fxResourceId: null,
      fxStartDate: "",
      fxMandays: 0,
      abapResourceId: null,
      abapStartDate: "",
      abapMandays: 0,
    };

    setWbsItems([...wbsItems, newRow]);
  };

  const deleteWBSItem = (id: number) => {
    setWbsItems(wbsItems.filter((item) => item.id !== id));
  };

  const moveWBSItem = (index: number, direction: "up" | "down") => {
    const newItems = [...wbsItems];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    [newItems[index], newItems[targetIndex]] = [
      newItems[targetIndex],
      newItems[index],
    ];
    setWbsItems(newItems);
  };

  const updateWBSItem = (id: number, patch: Partial<WBSItem>) => {
    setWbsItems((items) =>
      items.map((item) => {
        if (item.id !== id) return item;

        const updated: WBSItem = { ...item, ...patch };

        if ("activityId" in patch) {
          const selected = activityOptions.find(
            (option) => option.id === Number(patch.activityId),
          );
          if (selected) {
            updated.wbsId = selected.wbsId;
          }
        }

        if (
          "fxResourceId" in patch &&
          (patch.fxResourceId === null || patch.fxResourceId === undefined)
        ) {
          updated.fxStartDate = "";
          updated.fxMandays = 0;
        }

        if (
          "abapResourceId" in patch &&
          (patch.abapResourceId === null || patch.abapResourceId === undefined)
        ) {
          updated.abapStartDate = "";
          updated.abapMandays = 0;
        }

        return updated;
      }),
    );
  };

  //--------------------------------------------------------------------------
  // Render
  //--------------------------------------------------------------------------
  return (
    <section className="mt-0 gap-0">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>
                High-level WBS breakdown with estimated effort
              </CardTitle>
              <CardDescription className="mt-2">
                Define activities, resources, and effort estimation
              </CardDescription>
            </div>
            <Button
              onClick={addWBSItem}
              size="sm"
              disabled={lockActivity}
              className="w-full justify-center sm:w-auto"
              aria-label="Add row"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span>Add row</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto rounded-md border">
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="bg-background sticky top-0 z-10 min-w-20">
                      WBS Id
                    </TableHead>
                    <TableHead className="bg-background sticky top-0 z-10 min-w-[180px]">
                      Activity
                    </TableHead>
                    <TableHead className="bg-background sticky top-0 z-10 min-w-[180px]">
                      FX resource
                    </TableHead>
                    <TableHead className="bg-background sticky top-0 z-10 min-w-[140px]">
                      Start date
                    </TableHead>
                    <TableHead className="bg-background sticky top-0 z-10 min-w-[140px]">
                      Mandays
                    </TableHead>
                    <TableHead className="bg-background sticky top-0 z-10 min-w-[180px]">
                      ABAP resource
                    </TableHead>
                    <TableHead className="bg-background sticky top-0 z-10 min-w-[140px]">
                      Start date
                    </TableHead>
                    <TableHead className="bg-background sticky top-0 z-10 min-w-[140px]">
                      Mandays
                    </TableHead>
                    <TableHead className="bg-background sticky top-0 z-10 min-w-[140px]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {wbsItems.map((item, index) => {
                    const fxEnabled = !!item.fxResourceId;
                    const abapEnabled = !!item.abapResourceId;
                    const fxSelectValue =
                      item.fxResourceId !== null &&
                      item.fxResourceId !== undefined
                        ? item.fxResourceId.toString()
                        : NONE_VALUE;
                    const abapSelectValue =
                      item.abapResourceId !== null &&
                      item.abapResourceId !== undefined
                        ? item.abapResourceId.toString()
                        : NONE_VALUE;

                    return (
                      <TableRow key={item.id}>
                        {/* --- WBS Id (auto fills from activity) --- */}
                        <TableCell>
                          <Input
                            value={item.wbsId}
                            readOnly={true}
                            onChange={(e) =>
                              updateWBSItem(item.id, { wbsId: e.target.value })
                            }
                            className="w-full min-w-20"
                          />
                        </TableCell>

                        {/* --- Activity --- */}
                        <TableCell>
                          <Select
                            disabled={lockActivity}
                            value={item.activityId?.toString() ?? ""}
                            onValueChange={(value) =>
                              updateWBSItem(item.id, {
                                activityId: value ? Number(value) : undefined,
                              })
                            }
                          >
                            <SelectTrigger className="max-w-[180px] min-w-[180px]">
                              <SelectValue placeholder="Select activity" />
                            </SelectTrigger>
                            <SelectContent>
                              {activityOptions.map((activity) => (
                                <SelectItem
                                  key={activity.activity}
                                  value={activity.id.toString()}
                                >
                                  {activity.activity}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>

                        {/* -- FX resource -- */}
                        <TableCell>
                          <Select
                            disabled={lockActivity}
                            value={fxSelectValue}
                            onValueChange={(value) =>
                              updateWBSItem(item.id, {
                                fxResourceId:
                                  value === NONE_VALUE ? null : Number(value),
                              })
                            }
                          >
                            <SelectTrigger className="max-w-[180px] min-w-[180px]">
                              <SelectValue
                                placeholder="Select FX resource"
                                className="truncate"
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NONE_VALUE}>
                                Select FX
                              </SelectItem>
                              {fxResourceOptions.map((resource) => (
                                <SelectItem
                                  key={resource.id}
                                  value={resource.id.toString()}
                                  className="truncate"
                                >
                                  <div
                                    className="truncate"
                                    title={`${resource.name} — ${resource.title}`}
                                  >
                                    {resource.name} — {resource.title}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>

                        {/* -- FX start date -- */}
                        <TableCell>
                          <Input
                            type="date"
                            readOnly={lockActivity}
                            disabled={!fxEnabled}
                            value={item.fxStartDate ?? ""}
                            onChange={(e) =>
                              updateWBSItem(item.id, {
                                fxStartDate: e.target.value || null,
                              })
                            }
                            className="w-full min-w-[130px]"
                          />
                        </TableCell>

                        {/* -- FX mandays -- */}
                        <TableCell>
                          <Input
                            type="number"
                            readOnly={lockActivity}
                            disabled={!fxEnabled}
                            value={item.fxMandays}
                            onChange={(e) =>
                              updateWBSItem(item.id, {
                                fxMandays: Number(e.target.value) || 0,
                              })
                            }
                            min="0"
                            step="1"
                            className="w-full min-w-20 text-right"
                          />
                        </TableCell>

                        {/* ABAP resource */}
                        <TableCell>
                          <Select
                            value={abapSelectValue}
                            onValueChange={(value) =>
                              updateWBSItem(item.id, {
                                abapResourceId:
                                  value === NONE_VALUE ? null : Number(value),
                              })
                            }
                          >
                            <SelectTrigger className="max-w-[180px] min-w-[180px]">
                              <SelectValue
                                placeholder="Select ABAP resource"
                                className="truncate"
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NONE_VALUE}>
                                Select ABAP
                              </SelectItem>
                              {abapResourceOptions.map((resource) => (
                                <SelectItem
                                  key={resource.id}
                                  value={resource.id.toString()}
                                  className="truncate"
                                >
                                  <div
                                    className="truncate"
                                    title={`${resource.name} — ${resource.title}`}
                                  >
                                    {resource.name} — {resource.title}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>

                        {/* -- ABAP start date -- */}
                        <TableCell>
                          <Input
                            type="date"
                            readOnly={lockActivity}
                            disabled={!abapEnabled}
                            value={item.abapStartDate ?? ""}
                            onChange={(e) =>
                              updateWBSItem(item.id, {
                                abapStartDate: e.target.value || null,
                              })
                            }
                            className="w-full min-w-[130px]"
                          />
                        </TableCell>

                        {/* -- ABAP mandays -- */}
                        <TableCell>
                          <Input
                            type="number"
                            readOnly={lockActivity}
                            disabled={!abapEnabled}
                            value={item.abapMandays}
                            onChange={(e) =>
                              updateWBSItem(item.id, {
                                abapMandays: Number(e.target.value) || 0,
                              })
                            }
                            min="0"
                            step="1"
                            className="w-full min-w-20 text-right"
                          />
                        </TableCell>

                        {/* Actions */}
                        <TableCell>
                          <div className="flex gap-1">
                            {/* Sort buttons */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => moveWBSItem(index, "up")}
                              disabled={index === 0}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => moveWBSItem(index, "down")}
                              disabled={index === wbsItems.length - 1}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>

                            {/* Delete button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteWBSItem(item.id)}
                              disabled={wbsItems.length === 1}
                              className="text-destructive hover:bg-destructive/10 focus-visible:bg-destructive/10 active:bg-destructive/20"
                            >
                              <Trash2 className="text-destructive h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Footer - Total */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 text-sm">
            <span className="font-semibold tracking-wide">
              Total Estimated Effort
            </span>
            <div className="flex flex-wrap items-center gap-4">
              <div className="bg-muted/40 flex items-center gap-2 rounded-lg border px-3 py-2">
                <span className="text-muted-foreground text-xs uppercase">
                  FX Total
                </span>
                <span className="font-semibold">
                  {totalFxMandays.toFixed(2)} mandays
                </span>
              </div>
              <div className="bg-muted/40 flex items-center gap-2 rounded-lg border px-3 py-2">
                <span className="text-muted-foreground text-xs uppercase">
                  ABAP Total
                </span>
                <span className="font-semibold">
                  {totalAbapMandays.toFixed(2)} mandays
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
