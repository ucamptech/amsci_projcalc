// src/pages/ProjectsList.tsx
import * as React from "react";

import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
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
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { DEFAULT_PROJECTS } from "@/data/defaults";
import DashLayout from "@/layouts/DashLayout";
import { Input } from "@/components/ui/input";
import type { ProjectInit } from "@/data/types";

type SortKey = keyof Pick<
  ProjectInit,
  "name" | "sponsor" | "manager" | "version" | "creationDate"
>;
type SortDir = "asc" | "desc";

const PAGE_SIZES = [5, 10, 20, 50] as const;

export default function ProjectsList() {
  // Default source
  const rows: ProjectInit[] = useMemo(
    () => (Array.isArray(DEFAULT_PROJECTS) ? DEFAULT_PROJECTS : []),
    []
  );

  const [query, setQuery] = useState<string>("");
  const [sortKey, setSortKey] = useState<SortKey>("creationDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  // Filter (search only)
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!normalizedQuery) return rows;
    return rows.filter((r) => {
      const hay = [
        r.name,
        r.sponsor,
        r.manager,
        r.version,
        r.creationDate ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(normalizedQuery);
    });
  }, [rows, normalizedQuery]);

  // Sort
  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = (a[sortKey] ?? "") as string;
      const bv = (b[sortKey] ?? "") as string;

      if (sortKey === "creationDate") {
        const aTime = av ? Date.parse(av) : 0;
        const bTime = bv ? Date.parse(bv) : 0;
        return sortDir === "asc" ? aTime - bTime : bTime - aTime;
      }

      const cmp = av.localeCompare(bv, undefined, { sensitivity: "base" });
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  // Pagination
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  React.useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return sorted.slice(start, end);
  }, [sorted, page, pageSize]);

  // Handlers
  function onClickSort(col: SortKey) {
    if (sortKey === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(col);
      setSortDir("asc");
    }
  }

  return (
    <DashLayout title="Projects">
      {/* Controls */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="w-full md:max-w-sm">
          <label className="mb-1 block text-sm font-medium">Search</label>
          <Input
            placeholder="Search name, sponsor, manager, version…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex items-end gap-2">
          <div className="w-32">
            <label className="mb-1 block text-sm font-medium">
              Rows / page
            </label>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                const n = Number(v);
                setPageSize(n);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead
                label="Name"
                onClick={() => onClickSort("name")}
                active={sortKey === "name"}
                dir={sortDir}
              />
              <SortableHead
                label="Sponsor"
                onClick={() => onClickSort("sponsor")}
                active={sortKey === "sponsor"}
                dir={sortDir}
              />
              <SortableHead
                label="Manager"
                onClick={() => onClickSort("manager")}
                active={sortKey === "manager"}
                dir={sortDir}
              />
              <SortableHead
                label="Version"
                onClick={() => onClickSort("version")}
                active={sortKey === "version"}
                dir={sortDir}
              />
              <SortableHead
                label="Creation Date"
                onClick={() => onClickSort("creationDate")}
                active={sortKey === "creationDate"}
                dir={sortDir}
              />
            </TableRow>
          </TableHeader>

          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  No projects found.
                </TableCell>
              </TableRow>
            ) : (
              paged.map((p, i) => (
                <TableRow key={`${p.name}-${i}`}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.sponsor}</TableCell>
                  <TableCell>{p.manager}</TableCell>
                  <TableCell>{p.version}</TableCell>
                  <TableCell>{p.creationDate ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row mt-4">
        <div className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium">
            {total === 0 ? 0 : (page - 1) * pageSize + 1}
          </span>{" "}
          to{" "}
          <span className="font-medium">
            {Math.min(page * pageSize, total)}
          </span>{" "}
          of <span className="font-medium">{total}</span> projects
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page <span className="font-medium">{page}</span> of{" "}
            <span className="font-medium">{totalPages}</span>
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </DashLayout>
  );
}

/* ---------- Helper component ---------- */
function SortableHead({
  label,
  onClick,
  active,
  dir,
}: {
  label: string;
  onClick: () => void;
  active: boolean;
  dir: SortDir;
}) {
  return (
    <TableHead>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 text-left font-medium"
      >
        {label}
        <ArrowUpDown
          className={`h-4 w-4 transition-opacity ${
            active ? "opacity-100" : "opacity-40"
          }`}
        />
        <span className="sr-only">
          {active
            ? dir === "asc"
              ? "sorted ascending"
              : "sorted descending"
            : "not sorted"}
        </span>
      </button>
    </TableHead>
  );
}
