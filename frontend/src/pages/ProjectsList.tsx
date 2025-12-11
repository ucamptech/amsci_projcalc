import { ArrowUpDown, ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import type { Meta, Project } from "@/api/types";
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
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import DashLayout from "@/layouts/DashLayout";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { api } from "@/api/api";
import { toYMD } from "@/utils/number";

type SortKey = keyof Pick<
  Project & { creationDate?: string },
  "name" | "sponsor" | "manager" | "version" | "creationDate"
>;
type SortDir = "asc" | "desc";

const PAGE_SIZES = [5, 10, 20, 50] as const;

export default function ProjectsList() {
  const [rows, setRows] = useState<Project[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [query, setQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");

  const [sortKey, setSortKey] = useState<SortKey>("creationDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  const abortRef = useRef<AbortController | null>(null);

  // debounce search (300ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // fetch from API
  useEffect(() => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setError("");

    api
      .getProjects({
        page,
        perPage: pageSize,
        sort: sortKey,
        order: sortDir,
        search: debouncedQuery || undefined,
      })
      .then(({ data, meta }) => {
        // Map API -> UI
        const mapped = (data ?? []).map((p) => ({
          ...p,
          creationDate: toYMD(p.creationDate) || undefined,
          version: p.version ?? "",
        }));
        setRows(mapped);
        setMeta(meta);
      })
      .catch((err) => {
        if (ac.signal.aborted) return;
        const message =
          err instanceof Error ? err.message : "Failed to load projects.";
        setError(message);
        setRows([]);
        setMeta(null);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });

    return () => ac.abort();
  }, [page, pageSize, sortKey, sortDir, debouncedQuery]);

  // clicking a sort head triggers server-side sort and resets to page 1
  function onClickSort(col: SortKey) {
    if (sortKey === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(col);
      setSortDir("asc");
    }
    setPage(1);
  }

  const total = meta?.total ?? 0;
  const lastPage = meta?.lastPage ?? Math.max(1, Math.ceil(total / pageSize));

  const showingFrom = useMemo(() => {
    if (!total) return 0;
    // If backend meta is present, compute from meta; else fallback
    const start = (meta?.currentPage ?? page) - 1;
    const per = meta?.perPage ?? pageSize;
    return start * per + (rows.length ? 1 : 0);
  }, [meta, page, pageSize, rows.length, total]);

  const showingTo = useMemo(() => {
    if (!total) return 0;
    const per = meta?.perPage ?? pageSize;
    const cur = meta?.currentPage ?? page;
    return Math.min(cur * per, total);
  }, [meta, page, pageSize, total]);

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
            disabled={loading}
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
              disabled={loading}
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

      {/* Loading / Error */}
      {loading && (
        <div className="text-muted-foreground mt-4 text-sm">
          Loading projects…
        </div>
      )}
      {!!error && (
        <div className="border-destructive/30 bg-destructive/5 mt-4 flex items-center gap-2 rounded border p-3 text-sm">
          <span className="text-destructive font-medium">{error}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Re-fetch current params
              setPage((p) => p);
            }}
            className="ml-auto"
          >
            <RotateCw className="mr-1 h-4 w-4" />
            Retry
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="mt-4 rounded-md border">
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
            {!loading && rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground h-24 text-center text-sm"
                >
                  {error ? "Failed to load projects." : "No projects found."}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((p, i) => (
                <TableRow key={`${p.id ?? p.name}-${i}`}>
                  <TableCell className="font-medium">
                    <Link
                      to={`/projects/${p.id}`}
                      className="text-blue-600 transition-colors hover:text-blue-800 hover:underline"
                    >
                      {p.name}
                    </Link>
                  </TableCell>
                  <TableCell>{p.sponsor}</TableCell>
                  <TableCell>{p.manager}</TableCell>
                  <TableCell>{p.version || "—"}</TableCell>
                  <TableCell>{p.creationDate ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination (server-side) */}
      <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="text-muted-foreground text-sm">
          Showing <span className="font-medium">{showingFrom}</span> to{" "}
          <span className="font-medium">{showingTo}</span> of{" "}
          <span className="font-medium">{total}</span> projects
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={loading || page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page{" "}
            <span className="font-medium">{meta?.currentPage ?? page}</span> of{" "}
            <span className="font-medium">{lastPage}</span>
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
            disabled={loading || page >= lastPage}
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
