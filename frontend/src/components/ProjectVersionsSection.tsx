import { RefreshCcw, Rocket } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import type { ProjectDetail } from "@/types/project.type";

type Props = {
  versions: ProjectDetail[];
  selectedVersionId: number | null;
  newVersionMode: boolean;
  hasId: boolean;
  onSelectVersion: (value: string) => void;
  onReload: () => void;
  onPromote: () => void;
};

//--------------------------------------------------------------------------
// Constants
//--------------------------------------------------------------------------
export const NONE_VALUE = "__none__";

export function ProjectVersionsCard({
  versions,
  selectedVersionId,
  newVersionMode,
  hasId,
  onSelectVersion,
  onReload,
  onPromote,
}: Props) {
  const isSelectedLatest =
    versions.find((v) => v.id === selectedVersionId)?.isCurrent ?? false;

  return (
    <div className="bg-muted/30 flex flex-col gap-3 rounded-md border border-dashed p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Select
          value={
            newVersionMode
              ? NONE_VALUE
              : selectedVersionId
                ? String(selectedVersionId)
                : ""
          }
          onValueChange={onSelectVersion}
        >
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Select version" />
          </SelectTrigger>
          <SelectContent>
            {versions.map((v) => (
              <SelectItem key={v.id} value={String(v.id ?? "")}>
                <span className="flex items-center gap-2">
                  <span>{v.version}</span>
                  {v.isCurrent ? (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                      latest
                    </span>
                  ) : null}
                </span>
              </SelectItem>
            ))}
            <div className="bg-muted my-1 h-px" />
            <SelectItem value={NONE_VALUE} className="text-blue-600">
              + New version
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
        <Button
          variant="outline"
          onClick={onReload}
          disabled={!selectedVersionId || newVersionMode}
          className="w-full sm:w-auto"
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Reload selected
        </Button>
        <Button
          variant="default"
          onClick={onPromote}
          disabled={!hasId || newVersionMode || isSelectedLatest}
          className="w-full sm:w-auto"
        >
          <Rocket className="mr-2 h-4 w-4" />
          Promote as latest
        </Button>
      </div>
    </div>
  );
}
