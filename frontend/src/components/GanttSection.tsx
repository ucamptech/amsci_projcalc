import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Copy, Eye, Sparkles } from "lucide-react";
import type { ProjectInit, WbsRow } from "@/data/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import SectionTitle from "./SectionTitle";
import { generateGanttMermaid } from "@/api/api_ai";
import mermaid from "mermaid";

type Props = {
  project: Pick<
    ProjectInit,
    "name" | "businessNeed" | "projectGoal" | "creationDate"
  >;
  wbsRows: Pick<WbsRow, "activity" | "fxMandays" | "abapMandays">[];
  onMermaidCodeChange?: (code: string) => void;
};

function extractMermaidBlock(text: string): string {
  const match = text.match(/```mermaid([\s\S]*?)```/i);
  return match ? match[1].trim() : text.trim();
}

function debounce<T extends (...args: unknown[]) => void>(fn: T, ms = 150) {
  let t: number | undefined;
  return (...args: Parameters<T>) => {
    window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), ms);
  };
}

function currentTheme(): "default" | "dark" {
  const isDark = document.documentElement.classList.contains("dark");
  return isDark ? "dark" : "default";
}

export default function GanttSection({
  project,
  wbsRows,
  onMermaidCodeChange,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mermaidCode, setMermaidCode] = useState<string>("");
  const [showRaw, setShowRaw] = useState(false);

  const mermaidContainer = useRef<HTMLDivElement>(null);
  const lastRenderId = useRef<string>("");

  const taskCount = useMemo(
    () =>
      wbsRows.filter(
        (r) =>
          (r.activity || "").trim() &&
          Number(r.fxMandays) + Number(r.abapMandays) > 0,
      ).length,
    [wbsRows],
  );
  console.log("Task count: ", taskCount);

  // Initialize Mermaid with current theme
  const initMermaid = useCallback(() => {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "loose",
      theme: currentTheme(),
      gantt: { axisFormat: "%b %d" },
    });
  }, []);

  useEffect(() => {
    initMermaid();
  }, [initMermaid]);

  // Render helper
  const renderMermaid = useCallback(async () => {
    if (!mermaidCode || !mermaidContainer.current || showRaw) return;
    try {
      const id = "gantt_" + Date.now().toString(36);
      lastRenderId.current = id;
      const { svg } = await mermaid.render(id, mermaidCode);

      if (mermaidContainer.current) {
        mermaidContainer.current.innerHTML = svg;
      }
    } catch (err) {
      console.error("Mermaid render error:", err);
    }
  }, [mermaidCode, showRaw]);

  // Render when code or showRaw changes
  useEffect(() => {
    void renderMermaid();
  }, [renderMermaid]);

  // Auto-resize
  useEffect(() => {
    if (!mermaidContainer.current) return;
    const el = mermaidContainer.current;

    const rerender = debounce(() => {
      initMermaid();
      void renderMermaid();
    }, 150);

    const ro = new ResizeObserver(rerender);
    ro.observe(el);

    const onWin = debounce(() => {
      initMermaid();
      void renderMermaid();
    }, 150);
    window.addEventListener("resize", onWin);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onWin);
    };
  }, [initMermaid, renderMermaid]);

  async function onGenerate() {
    setBusy(true);
    setError(null);
    try {
      const text = await generateGanttMermaid(
        {
          name: project.name,
          businessNeed: project.businessNeed,
          projectGoal: project.projectGoal,
          creationDate: project.creationDate,
        },
        wbsRows.map((r) => ({
          activity: r.activity,
          fxMandays: r.fxMandays,
          abapMandays: r.abapMandays,
        })),
      );
      const code = extractMermaidBlock(text);

      setMermaidCode(code);
      onMermaidCodeChange?.(code);
      setShowRaw(false);
      initMermaid();
      void renderMermaid();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to generate Gantt chart.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  function onCopy() {
    if (!mermaidCode) return;
    void navigator.clipboard.writeText("```mermaid\n" + mermaidCode + "\n```");
  }

  return (
    <section className="mt-6 gap-0">
      <SectionTitle title="IV. Gantt Chart" />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <p className="text-muted-foreground text-sm">
              Generates and displays a Mermaid Gantt based from the WBS and
              Start Date ({project.creationDate || "today"}).
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={onGenerate}
              disabled={busy || taskCount === 0}
              size="sm"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {busy ? "Generating…" : "Generate Gantt"}
            </Button>

            <Button
              className="hidden"
              variant="outline"
              onClick={onCopy}
              disabled={!mermaidCode}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Code
            </Button>

            <Button
              className="hidden"
              variant="outline"
              onClick={() => setShowRaw((v) => !v)}
              disabled={!mermaidCode}
            >
              <Eye className="mr-2 h-4 w-4" />
              {showRaw ? "Hide Code" : "View Code"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 py-2">
          <div className="flex items-center justify-between gap-4"></div>

          {error && (
            <div className="rounded-md border border-red-300 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          {!mermaidCode && !error && (
            <div className="text-muted-foreground rounded-md border p-4 text-sm">
              Mermaid Gantt chart will appear here after generation.
            </div>
          )}

          {mermaidCode && (
            <div>
              {!showRaw ? (
                <div
                  ref={mermaidContainer}
                  className="overflow-x-auto rounded-md border bg-white p-4 dark:bg-neutral-900 [&_svg]:h-auto [&_svg]:w-full [&_svg]:max-w-none"
                />
              ) : (
                <pre className="bg-muted/50 overflow-auto rounded-md border p-4 text-sm whitespace-pre-wrap">
                  {`\`\`\`mermaid\n${mermaidCode}\n\`\`\``}
                </pre>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
