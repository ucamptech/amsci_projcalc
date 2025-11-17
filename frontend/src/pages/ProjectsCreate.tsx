import type { Activity, Resource } from "@/api/types";
import { AlertCircle, CheckCircle2, FileSpreadsheet, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type {
  CostByResourceInit,
  ModalState,
  ProjectInit,
  ProjectPayload,
  WbsRow,
} from "@/data/types";
import {
  DEFAULT_ACTIVITIES,
  DEFAULT_RESOURCES,
  EMPTY_PROJECT,
  LS_BYRES_KEY,
  LS_PROJECT_KEY,
  LS_WBS_KEY,
} from "@/data/defaults";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import CostByResourceSection from "@/components/CostByResourceSection";
import DashLayout from "@/layouts/DashLayout";
import { FileText } from "lucide-react";
import GanttSection from "@/components/GanttSection";
import InitiationSection from "@/components/InitiationSection";
import WBSSection from "@/components/WBSSection";
import { api } from "@/api/api";
import { cryptoId } from "@/utils/number";
import { exportProjectCharterExcel } from "@/utils/xlsxExport";
import { exportProjectCharterPdfStructured } from "@/utils/pdfExport";
import { mapToWbsRows } from "@/utils/mapToWBSRows";
import { useBusyOverlay } from "@/components/BusyOverlayProvider";
import useLocalStorage from "@/hooks/useLocalStorage";
import { validateProjectProposal } from "@/api/api_ai";

export default function ProjectsCreate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { begin, end } = useBusyOverlay();

  // If there's an id in the URL, show saved project.
  const hasId = Boolean(id);

  const [project, setProject] = useState<ProjectInit>(EMPTY_PROJECT);
  const [signers] = useLocalStorage("pc_signers", []);

  const [wbsRows, setWbsRows] = useState<WbsRow[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [byResource, setByResource] = useState<CostByResourceInit[]>([]);
  const [ganttMermaid, setGanttMermaid] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [editLocked, setEditLocked] = useState<boolean>(false);

  const [finalCheckEnabled, setFinalCheckEnabled] = useState(false);
  const [finalCheckBusy, setFinalCheckBusy] = useState(false);
  const [finalCheckResult, setFinalCheckResult] = useState<string | null>(null);
  const [finalCheckOpen, setFinalCheckOpen] = useState(false);

  // ---------- FETCH ----------
  const retrieveFromAPI = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const [activitiesRes, resourcesRes] = await Promise.all([
        api.getActivities(),
        api.getResources(),
      ]);

      const rows: WbsRow[] = (activitiesRes ?? []).map((a) => ({
        id: cryptoId(),
        activityId: a.id || 0,
        wbsId: a.wbsId || "",
        activity: a.activity || "New Activity",
        level: 0,
        fxResourceId: "",
        fxMandays: 0,
        abapResourceId: "",
        abapMandays: 0,
      }));

      setWbsRows(rows);
      setActivities(activitiesRes ?? []);
      setResources(resourcesRes ?? []);

      if (!hasId) {
        const savedProject = localStorage.getItem(LS_PROJECT_KEY);
        const savedWbs = localStorage.getItem(LS_WBS_KEY);
        const savedByRes = localStorage.getItem(LS_BYRES_KEY);

        if (savedProject && savedWbs) {
          const parsedProject = JSON.parse(savedProject) as ProjectInit;
          let parsedWbs = JSON.parse(savedWbs) as WbsRow[];

          // sanitize draft against current activities/resources
          const activityIds = new Set(
            (activitiesRes ?? []).map((a) => String(a.id)),
          );
          const resourceIds = new Set(
            (resourcesRes ?? []).map((r) => String(r.id)),
          );

          parsedWbs = parsedWbs.map((r) => {
            const fxOk = r.fxResourceId
              ? resourceIds.has(String(r.fxResourceId))
              : false;
            const abapOk = r.abapResourceId
              ? resourceIds.has(String(r.abapResourceId))
              : false;
            const actOk = r.activityId
              ? activityIds.has(String(r.activityId))
              : false;

            return {
              ...r,
              // if resource is no longer present, clear mandays
              fxResourceId: fxOk ? r.fxResourceId : "",
              fxMandays: fxOk ? r.fxMandays : 0,
              abapResourceId: abapOk ? r.abapResourceId : "",
              abapMandays: abapOk ? r.abapMandays : 0,
              // if activity missing, keep original
              activityId: actOk ? r.activityId : 0,
            };
          });

          setProject(parsedProject);
          setWbsRows(parsedWbs);

          if (savedByRes) {
            try {
              const parsedByRes = JSON.parse(
                savedByRes,
              ) as CostByResourceInit[];
              console.log("parsedByRes", parsedByRes);
              setByResource(parsedByRes);
            } catch {
              setByResource([]);
            }
          }

          setModal({
            type: "success",
            message: "Draft automatically loaded from your browser.",
          });
        }
      }

      if (hasId) {
        const proj = await api.getProjectById(Number(id));
        setProject({
          name: proj.name ?? "",
          sponsor: proj.sponsor ?? "",
          manager: proj.manager ?? "",
          businessNeed: proj.businessNeed ?? "",
          projectGoal: proj.projectGoal ?? "",
          measurableObjectives: proj.measurableObjectives ?? "",
          deliverables: proj.deliverables ?? "",
          outOfScope: proj.outOfScope ?? "",
        });

        const mappedWBSRows = mapToWbsRows(proj.estimates ?? []);
        setWbsRows(mappedWBSRows);

        setEditLocked(false);
      } else {
        setEditLocked(false);
      }
    } catch (err) {
      // Fallback defaults if API fails
      const rows: WbsRow[] = DEFAULT_ACTIVITIES.map((a) => ({
        id: cryptoId(),
        activityId: a.id || 0,
        wbsId: a.wbsId || "",
        activity: a.activity || "New Activity",
        level: 0,
        fxId: 0,
        fxResourceId: "",
        fxMandays: 0,
        abapId: 0,
        abapResourceId: "",
        abapMandays: 0,
      }));

      setWbsRows(rows);
      setResources(DEFAULT_RESOURCES);

      const message =
        err instanceof Error ? err.message : "Server unavailable.";
      if (message === "Row not found") {
        navigate("/projects/create", { replace: true });
      } else {
        setModal({ type: "error", message: `Server offline. (${message})` });
      }
    } finally {
      setLoading(false);
    }
  }, [hasId, id, navigate]);

  useEffect(() => {
    void retrieveFromAPI();
  }, [retrieveFromAPI]);

  // ---------- derived states ----------
  const canSubmit = useMemo(() => {
    const hasBasics = project.name?.trim().length > 0;
    const hasEstimates = wbsRows.some(
      (r) =>
        (r.fxResourceId && Number(r.fxMandays) > 0) ||
        (r.abapResourceId && Number(r.abapMandays) > 0),
    );
    return hasBasics && hasEstimates;
  }, [project, wbsRows]);

  // ---------- actions ----------
  function onGenerateExcel(): void {
    exportProjectCharterExcel({ project, wbs: wbsRows, signers, byResource });
  }

  async function onGeneratePdf(): Promise<void> {
    await exportProjectCharterPdfStructured({
      project,
      wbs: wbsRows,
      byResource,
      ganttMermaidCode: ganttMermaid || null,
      ganttSvgSelector: "#pc-gantt-svg",
    });
  }

  function buildPayload(): ProjectPayload {
    const estimates: ProjectPayload["estimates"] = [];
    for (const r of wbsRows) {
      const fxMandays = Number(r.fxMandays) || 0;
      const abapMandays = Number(r.abapMandays) || 0;

      if (r.fxResourceId && fxMandays > 0) {
        const estimate = {
          resourceId: Number(r.fxResourceId),
          activityId: Number(r.activityId),
          mandays: fxMandays,
        };
        estimates.push(
          r.fxId && r.fxId != 0 ? { ...estimate, id: r.fxId } : estimate,
        );
      }
      if (r.abapResourceId && abapMandays > 0) {
        const estimate = {
          resourceId: Number(r.abapResourceId),
          activityId: Number(r.activityId),
          mandays: abapMandays,
        };
        estimates.push(
          r.abapId && r.abapId != 0 ? { ...estimate, id: r.abapId } : estimate,
        );
      }
    }
    return {
      name: project.name?.trim() || "",
      sponsor: project.sponsor?.trim() || "",
      manager: project.manager?.trim() || "",
      businessNeed: project.businessNeed?.trim() || "",
      projectGoal: project.projectGoal?.trim() || "",
      measurableObjectives: project.measurableObjectives?.trim() || "",
      deliverables: project.deliverables?.trim() || "",
      outOfScope: project.outOfScope?.trim() || "",
      estimates,
    };
  }

  async function onSubmitProject(): Promise<void> {
    setSubmitBusy(true);
    try {
      const payload = buildPayload();
      console.log("Payload: ", payload);

      if (!payload.name) throw new Error("Please fill out Project Name field.");
      if (payload.estimates.length === 0)
        throw new Error(
          "Add at least one estimate (Resource + Mandays) in WBS.",
        );

      if (hasId) {
        await api.updateProject(Number(id), payload);
        setModal({ type: "success", message: "Project updated successfully." });
      } else {
        const result = await api.createProject(payload);
        // If API returns an ID, optionally route to its page:
        if (result && result.id) navigate(`/projects/${result.id}`);
        setModal({ type: "success", message: "Project created successfully." });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save project.";
      setModal({ type: "error", message });
    } finally {
      setSubmitBusy(false);
    }
  }

  // ---------- Final Checks ----------
  async function onRunFinalCheck(): Promise<void> {
    const payload = buildPayload();

    if (!payload.name) {
      setModal({
        type: "error",
        message: "Please fill out Project Name before running final check.",
      });
      return;
    }

    if (payload.estimates.length === 0) {
      setModal({
        type: "error",
        message:
          "Add at least one estimate (Resource + Mandays) in WBS before running final check.",
      });
      return;
    }

    setFinalCheckBusy(true);
    setFinalCheckResult(null);

    try {
      begin();
      const wbsSummary =
        wbsRows.length === 0
          ? "No WBS rows defined."
          : wbsRows
              .map((r, idx) => {
                const fx = r.fxResourceId
                  ? `FX: resource=${r.fxResourceId}, mandays=${r.fxMandays}`
                  : "";
                const abap = r.abapResourceId
                  ? `ABAP: resource=${r.abapResourceId}, mandays=${r.abapMandays}`
                  : "";
                const combo = [fx, abap].filter(Boolean).join(" | ");
                return `${idx + 1}. [${r.wbsId || "-"}] ${r.activity} ${combo}`;
              })
              .join("\n");

      const result = await validateProjectProposal(
        {
          name: payload.name,
          businessNeed: payload.businessNeed,
          projectGoal: payload.projectGoal,
          creationDate: project.creationDate ?? null,
          measurableObjectives: payload.measurableObjectives,
          deliverables: payload.deliverables,
          outOfScope: payload.outOfScope,
        },
        wbsSummary,
        ganttMermaid || null,
      );

      setFinalCheckResult(result || "No feedback was generated.");
      setFinalCheckOpen(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to run final check.";
      setModal({ type: "error", message });
    } finally {
      end();
      setFinalCheckBusy(false);
    }
  }

  // ---------- Wrapper for create/save click ----------
  async function onClickCreateOrSave(): Promise<void> {
    if (!canSubmit || submitBusy || editLocked) return;

    // Only run AI check when checkbox is enabled
    if (finalCheckEnabled) {
      await onRunFinalCheck();
    } else {
      await onSubmitProject();
    }
  }

  function onSaveLocal(): void {
    try {
      localStorage.setItem(LS_PROJECT_KEY, JSON.stringify(project));
      localStorage.setItem(LS_WBS_KEY, JSON.stringify(wbsRows));
      localStorage.setItem(LS_BYRES_KEY, JSON.stringify(byResource));
      setModal({ type: "success", message: "Draft saved to your browser." });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to save the draft.";
      setModal({ type: "error", message });
    }
  }

  async function onResetLocal(): Promise<void> {
    try {
      localStorage.removeItem(LS_PROJECT_KEY);
      localStorage.removeItem(LS_WBS_KEY);
      localStorage.removeItem(LS_BYRES_KEY);

      // reset inputs
      setByResource([]);
      setProject(EMPTY_PROJECT);

      await retrieveFromAPI();

      setModal({
        type: "success",
        message: "Inputs cleared and local draft removed.",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to clear the draft.";
      setModal({ type: "error", message });
    }
  }

  function eqByRes(a: CostByResourceInit[], b: CostByResourceInit[]): boolean {
    if (a === b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      const x = a[i],
        y = b[i];
      if (
        x.resourceId !== y.resourceId ||
        x.resourceName !== y.resourceName ||
        x.resourceTitle !== y.resourceTitle ||
        x.rate !== y.rate ||
        x.mandays !== y.mandays ||
        x.subtotal !== y.subtotal
      ) {
        return false;
      }
    }
    return true;
  }

  // ---------- render ----------
  return (
    <DashLayout title={hasId ? "Project details" : "Create new project"}>
      {loading ? (
        <Card>
          <CardContent className="py-8">Loading…</CardContent>
        </Card>
      ) : (
        <>
          {/* Sections */}
          <div id="pc-initiation">
            <InitiationSection
              project={project}
              setProject={setProject}
              lockActivity={editLocked}
            />
          </div>

          <div id="pc-wbs">
            <WBSSection
              wbsRows={wbsRows}
              setWbsRows={setWbsRows}
              resources={resources}
              activities={activities}
              lockActivity={editLocked}
            />
          </div>

          <div id="pc-cost">
            <CostByResourceSection
              wbsRows={wbsRows}
              resources={resources}
              byResource={byResource}
              onByResourceChange={(list) => {
                setByResource((prev) => (eqByRes(prev, list) ? prev : list));
              }}
            />
          </div>

          <div id="pc-gantt">
            <GanttSection
              project={project}
              wbsRows={wbsRows}
              onMermaidCodeChange={setGanttMermaid}
            />
          </div>

          <div className="bg-muted/40 mt-6 mb-2 rounded-lg border p-4">
            <div className="mb-2 text-base font-semibold">One Final Check</div>

            <div className="flex items-start gap-3">
              <Checkbox
                checked={finalCheckEnabled}
                onCheckedChange={(checked) =>
                  setFinalCheckEnabled(checked === true)
                }
                disabled={submitBusy || finalCheckBusy || editLocked}
              />
              <p className="text-muted-foreground text-sm leading-snug">
                Run a review to check if the details are cohesive and achievable
                before creating the project.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 mb-3 flex items-center justify-between">
            {/* Left group */}
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={onResetLocal}
                title="Clear inputs and local draft"
              >
                Reset draft
              </Button>
              <Button
                variant="default"
                onClick={onSaveLocal}
                title="Save to browser"
              >
                Save draft
              </Button>
            </div>

            {/* Right group */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={onGeneratePdf}>
                <FileText className="mr-2 h-4 w-4" />
                Export as PDF
              </Button>

              <Button variant="outline" onClick={onGenerateExcel}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export as Excel
              </Button>

              <Button
                disabled={
                  !canSubmit || submitBusy || editLocked || finalCheckBusy
                }
                onClick={onClickCreateOrSave}
                title={
                  editLocked ? "Unlock editing to save changes." : undefined
                }
                className="bg-green-600 text-white hover:bg-green-700"
              >
                {finalCheckBusy ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Running final check…
                  </span>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {submitBusy
                      ? hasId
                        ? "Saving…"
                        : "Creating…"
                      : hasId
                        ? "Save Changes"
                        : "Create Project"}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* --- Modal for error/success --- */}
          <Dialog
            open={!!modal}
            onOpenChange={(open) => !open && setModal(null)}
          >
            <DialogContent className="sm:max-w-[420px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {!modal ? null : modal.type === "error" ? (
                    <>
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <span>Error</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span>Success</span>
                    </>
                  )}
                </DialogTitle>
                <DialogDescription className="whitespace-pre-line">
                  {modal?.message}
                </DialogDescription>
              </DialogHeader>

              <DialogFooter>
                <div className="mt-4 flex justify-end">
                  <Button onClick={() => setModal(null)}>Okay</Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* --- Modal for final checks --- */}
          <Dialog
            open={finalCheckOpen}
            onOpenChange={(open) => {
              if (!open) setFinalCheckOpen(false);
            }}
          >
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Final project validity check</DialogTitle>
                <DialogDescription>
                  Review the AI feedback on the consistency and achievability of
                  your project before creating it.
                </DialogDescription>
              </DialogHeader>

              <div className="bg-muted/40 mt-3 max-h-[360px] overflow-y-auto rounded-md border p-3 text-sm whitespace-pre-wrap">
                {finalCheckResult || "No feedback available."}
              </div>

              <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between">
                <Button
                  variant="outline"
                  onClick={() => setFinalCheckOpen(false)}
                >
                  Back and edit
                </Button>
                <Button
                  className="bg-green-600 text-white hover:bg-green-700"
                  onClick={async () => {
                    setFinalCheckOpen(false);
                    await onSubmitProject();
                  }}
                  disabled={submitBusy}
                >
                  {hasId
                    ? "Proceed and save changes"
                    : "Proceed and create project"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </DashLayout>
  );
}
