import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Copy, Eye, Sparkles } from "lucide-react";
import type { ProjectInit, WBSItem } from "@/types/project.type";
import { useCallback, useEffect, useRef, useState } from "react";

import type { Activity } from "@/types/activity.type";
import { Button } from "@/components/ui/button";
import { generateGanttMermaid } from "@/lib/api/ai.api";
import mermaid from "mermaid";
import { toast } from "sonner";
import { useBusyOverlay } from "@/contexts/BusyOverlayContext";

const SAMPLE_GANTT = `gantt
  title Project Gantt Chart
  dateFormat  YYYY-MM-DD
  section Initiation
  Requirements Gathering    :a1, 2025-11-06, 10d
  section Design
  Design Phase              :a2, 2025-11-16, 15d
  section Development
  Development Phase         :a3, after a2, 30d
  section Testing
  Testing Phase             :a4, after a3, 10d
  section Deployment
  Deployment                :a5, after a4, 5d`;

function extractMermaidBlock(text: string): string {
  const match = text.match(/```mermaid([\s\S]*?)```/i);
  return match ? match[1].trim() : text.trim();
}

type GanttSectionProps = {
  project?: ProjectInit;
  wbsItems?: WBSItem[];
  activities?: Activity[];
  onMermaidChange?: (code: string) => void;
};

export function GanttSection({
  project,
  wbsItems,
  activities,
  onMermaidChange,
}: GanttSectionProps = {}) {
  const [error, setError] = useState<string | null>(null);
  const [mermaidCode, setMermaidCode] = useState<string>("");
  const [showRaw, setShowRaw] = useState(false);

  //--------------------------------------------------------------------------
  // Helpers
  //--------------------------------------------------------------------------

  const { showBusy, hideBusy, isBusy } = useBusyOverlay();

  const mermaidContainer = useRef<HTMLDivElement>(null);

  // Initialize Mermaid (same config style as your reference file)
  const initMermaid = useCallback(() => {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "loose",
      theme: "neutral",
      gantt: {
        axisFormat: "%b %d",
        barHeight: 60,
        barGap: 10,
      },
      themeVariables: {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "16px",
        ganttTitleHeight: 50,
      },
    });
  }, []);

  useEffect(() => {
    initMermaid();
  }, [initMermaid]);

  useEffect(() => {
    onMermaidChange?.(mermaidCode);
  }, [mermaidCode, onMermaidChange]);

  const renderMermaid = useCallback(async () => {
    if (!mermaidCode || !mermaidContainer.current || showRaw) return;

    try {
      const id = "gantt_" + Date.now().toString(36);
      const { svg } = await mermaid.render(id, mermaidCode);

      if (mermaidContainer.current) {
        mermaidContainer.current.innerHTML = svg;
      }
    } catch (err) {
      console.error("Mermaid render error:", err);
      setError("Failed to render Gantt chart.");
    }
  }, [mermaidCode, showRaw]);

  useEffect(() => {
    void renderMermaid();
  }, [renderMermaid]);

  const generateGantt = async () => {
    setError(null);
    showBusy();

    try {
      let code: string;

      if (project && wbsItems?.length) {
        const activityMap = new Map<number, string>();
        activities?.forEach((activity) => {
          if (activity?.id) {
            activityMap.set(activity.id, activity.activity ?? "");
          }
        });

        const wbsMinimal = wbsItems.map((item) => ({
          activity:
            activityMap.get(item.activityId) ||
            item.wbsId ||
            `Activity ${item.activityId ?? ""}`.trim(),
          fxMandays: item.fxMandays,
          abapMandays: item.abapMandays,
          fxStartDate: item.fxStartDate,
          abapStartDate: item.abapStartDate,
        }));
        const mermaidCode = await generateGanttMermaid(
          {
            name: project.name,
            businessNeed: project.businessNeed,
            projectGoal: project.projectGoal,
            creationDate: project.startDate,
          },
          wbsMinimal,
        );
        code = extractMermaidBlock(mermaidCode);
      } else {
        const text = SAMPLE_GANTT;
        code = extractMermaidBlock(text);
      }

      setMermaidCode(code);
      setShowRaw(false);
      initMermaid();
      void renderMermaid();

      toast.success("Gantt chart generated");
    } catch (err) {
      console.error("Gantt chart generate error:", err);
      setError("Failed to generate Gantt chart.");
      toast.error("Failed to generate Gantt chart");
    } finally {
      hideBusy();
    }
  };

  const onCopy = () => {
    if (!mermaidCode) return;
    void navigator.clipboard.writeText("```mermaid\n" + mermaidCode + "\n```");
    toast.success("Mermaid code copied to clipboard");
  };

  return (
    <section className="mt-0 gap-0">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>Gantt Chart</CardTitle>
              <CardDescription className="mt-2">
                Visual timeline of project activities
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={generateGantt}
                variant="default"
                disabled={isBusy}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {isBusy ? "Generating…" : "Generate Gantt"}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={onCopy}
                disabled={!mermaidCode}
                aria-label="Copy Mermaid code"
              >
                <Copy className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowRaw((v) => !v)}
                disabled={!mermaidCode}
                aria-label={showRaw ? "Hide Mermaid code" : "View Mermaid code"}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md border border-red-300 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          {!mermaidCode && !error && (
            <div className="text-muted-foreground rounded-md border p-4 text-xs italic">
              Mermaid Gantt chart will appear here after generation.
            </div>
          )}

          {mermaidCode && (
            <div className="bg-muted rounded-lg p-4">
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
