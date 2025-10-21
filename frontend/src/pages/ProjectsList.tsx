import { ArrowUpDown, ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
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
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import DashLayout from "@/layouts/DashLayout";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import type { Project } from "@/api/types";
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
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [query, setQuery] = useState<string>("");
  const [sortKey, setSortKey] = useState<SortKey>("creationDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  // Fetch from API
  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError("");

    (async () => {
      try {
        const [projects] = await Promise.all([api.getProjects()]);
        const data: Project[] = projects;

        // Map API -> UI
        const mapped: Project[] = (data ?? []).map((p) => ({
          id: p.id ?? 0,
          name: p.name ?? "",
          sponsor: p.sponsor ?? "",
          manager: p.manager ?? "",
          version: "",
          creationDate: toYMD(p.creationDate) || undefined,
        }));

        setRows(mapped);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load projects.";
        setError(message);
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, []);

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

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return sorted.slice(start, end);
  }, [sorted, page, pageSize]);
  console.log("----");
  console.log(paged);

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
        <div className="mt-4 text-sm text-muted-foreground">
          Loading projects…
        </div>
      )}
      {!!error && (
        <div className="mt-4 flex items-center gap-2 rounded border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <span className="font-medium text-destructive">{error}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // force a reload of this route
              window.location.reload();
            }}
            className="ml-auto"
          >
            <RotateCw className="mr-1 h-4 w-4" />
            Retry
          </Button>
        </div>
      )}

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
            {(!loading && paged.length === 0) ||
            (!!error && rows.length === 0) ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  {error ? "Failed to load projects." : "No projects found."}
                </TableCell>
              </TableRow>
            ) : (
              paged.map((p, i) => (
                <TableRow key={`${p.name}-${i}`}>
                  <TableCell className="font-medium">
                    <Link
                      to={`/projects/${p.id}`}
                      className="text-blue-600 hover:underline hover:text-blue-800 transition-colors"
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

      {/* Pagination */}
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row mt-4">
        <div className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium">
            {sorted.length === 0 ? 0 : (page - 1) * pageSize + 1}
          </span>{" "}
          to{" "}
          <span className="font-medium">
            {Math.min(page * pageSize, sorted.length)}
          </span>{" "}
          of <span className="font-medium">{sorted.length}</span> projects
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
            <span className="font-medium">
              {Math.max(1, Math.ceil(sorted.length / pageSize))}
            </span>
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setPage((p) =>
                Math.min(
                  Math.max(1, Math.ceil(sorted.length / pageSize)),
                  p + 1
                )
              )
            }
            disabled={page >= Math.max(1, Math.ceil(sorted.length / pageSize))}
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
