import { FileSpreadsheet, FileText, RotateCcw, Save } from "lucide-react";
import type { ProjectInit, WBSItem } from "@/types/project.type";
import { useEffect, useState } from "react";

import type { Activity } from "@/types/activity.type";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CostSection } from "@/components/CostSection";
import { FinalCheckDialog } from "@/components/FinalCheckDialog";
import { GanttSection } from "@/components/GanttSection";
import { InitiationSection } from "@/components/InitiationSection";
import {
  StatusDialog,
  type StatusModal,
} from "@/components/common/StatusDialog";
import type { Resource } from "@/types/resource.type";
import { WBSSection } from "@/components/WBSSection";
import {
  DEFAULT_ACTIVITIES,
  DEFAULT_RESOURCES,
  EMPTY_PROJECT,
  WBSITEMS_INIT,
} from "@/lib/constants/project";
import { today } from "@/lib/utils/date.utils";
import { toast } from "sonner";
import { useBusyOverlay } from "@/contexts/BusyOverlayContext";
import { useNavigate, useParams } from "react-router-dom";
import {
  useLoadProject,
  useLoadReferenceData,
} from "@/hooks/useCreateProjectData";
import { exportProjectToPdf } from "@/lib/utils/pdfExport";
import { exportProjectToExcel } from "@/lib/utils/xlsxExport";
import useLocalStorage from "@/hooks/useLocalStorage";
import { createProject, updateProject } from "@/lib/api/projects.api";
import type { ProjectPayload } from "@/types/project.type";
import { validateProjectProposal } from "@/lib/api/ai.api";

//---------------------------------------------------------------------------
// Component
//---------------------------------------------------------------------------
export function CreateProject() {
  //--------------------------------------------------------------------------
  // States
  //--------------------------------------------------------------------------
  const [project, setProject] = useState<ProjectInit>(() => ({
    ...EMPTY_PROJECT,
    startDate: EMPTY_PROJECT.startDate || today,
  }));
  const [wbsItems, setWbsItems] = useState<WBSItem[]>(WBSITEMS_INIT);
  const [activities, setActivities] = useState<Activity[]>(DEFAULT_ACTIVITIES);
  const [resources, setResources] = useState<Resource[]>(DEFAULT_RESOURCES);
  const [rateOverrides, setRateOverrides] = useState<Record<string, number>>({
    projectManager: 0,
  });
  const [mandayOverrides, setMandayOverrides] = useState<
    Record<string, number>
  >({
    projectManager: 0,
  });
  const [signers] = useLocalStorage("pc_signers", []);

  const [editLocked] = useState<boolean>(false);
  const [finalCheckEnabled, setFinalCheckEnabled] = useState<boolean>(false);
  const [finalCheckBusy, setFinalCheckBusy] = useState<boolean>(false);
  const [finalCheckOpen, setFinalCheckOpen] = useState<boolean>(false);
  const [finalCheckResult, setFinalCheckResult] = useState<string>("");
  const [statusModal, setStatusModal] = useState<StatusModal>(null);
  const [submitBusy, setSubmitBusy] = useState<boolean>(false);
  const [ganttMermaid, setGanttMermaid] = useState<string>("");

  //--------------------------------------------------------------------------
  // Helpers
  //--------------------------------------------------------------------------
  const { withBusy, showBusy, hideBusy } = useBusyOverlay();
  const navigate = useNavigate();
  const { id } = useParams();
  const hasId = Boolean(id); // If there's an id in the URL, show saved project.

  useLoadReferenceData({ withBusy, setActivities, setResources });
  useLoadProject({
    hasId,
    id,
    withBusy,
    setProject,
    setWbsItems,
    onMissingProject: () => {
      navigate("/projects");
    },
  });

  // Load draft from local storage on first render (only when creating new)
  useEffect(() => {
    if (hasId) return;

    // Reset state when switching from edit view back to create view
    setProject({ ...EMPTY_PROJECT, startDate: today });
    setWbsItems(WBSITEMS_INIT);
    setRateOverrides({ projectManager: 0 });
    setMandayOverrides({ projectManager: 0 });

    const draftRaw = localStorage.getItem("projectDraft");
    if (!draftRaw) return;

    try {
      const draft = JSON.parse(draftRaw) as {
        project?: ProjectInit;
        wbsItems?: WBSItem[];
        rateOverrides?: Record<string, number>;
        mandayOverrides?: Record<string, number>;
      };
      if (draft.project) setProject(draft.project);
      if (draft.wbsItems?.length) setWbsItems(draft.wbsItems);
      if (draft.rateOverrides) setRateOverrides(draft.rateOverrides);
      if (draft.mandayOverrides) setMandayOverrides(draft.mandayOverrides);
      setStatusModal({
        type: "success",
        message: "Loaded saved draft from browser storage",
      });
    } catch (error) {
      console.error("Failed to parse saved draft", error);
    }
  }, [hasId]);

  //--------------------------------------------------------------------------
  // Functions
  //--------------------------------------------------------------------------

  const buildComputedCostRows = () => {
    const resourceList = resources?.length ? resources : DEFAULT_RESOURCES;
    const resourceMap = new Map<number, Resource>(
      resourceList.map((r) => [r.id, r]),
    );

    const rows: Array<{
      key: string;
      name: string;
      title: string;
      baseRate: number;
      mandays: number;
      resourceId?: number;
    }> = [
      {
        key: "projectManager",
        name: "Project Manager",
        title: "Project Manager",
        baseRate: 0,
        mandays: 0,
      },
    ];

    const aggregated = new Map<string, (typeof rows)[number]>();

    wbsItems.forEach((item) => {
      if (item.fxResourceId) {
        const resource = resourceMap.get(item.fxResourceId);
        const key = `fx-${item.fxResourceId}`;
        const existing = aggregated.get(key);
        const mandays = Number(item.fxMandays) || 0;
        aggregated.set(key, {
          key,
          name: resource?.name ?? `Resource #${item.fxResourceId}`,
          title: resource?.title ?? resource?.name ?? "-",
          baseRate: Number(resource?.cost ?? 0),
          mandays: (existing?.mandays ?? 0) + mandays,
          resourceId: item.fxResourceId,
        });
      }
      if (item.abapResourceId) {
        const resource = resourceMap.get(item.abapResourceId);
        const key = `abap-${item.abapResourceId}`;
        const existing = aggregated.get(key);
        const mandays = Number(item.abapMandays) || 0;
        aggregated.set(key, {
          key,
          name: resource?.name ?? `Resource #${item.abapResourceId}`,
          title: resource?.title ?? resource?.name ?? "-",
          baseRate: Number(resource?.cost ?? 0),
          mandays: (existing?.mandays ?? 0) + mandays,
          resourceId: item.abapResourceId,
        });
      }
    });

    rows.push(...aggregated.values());

    return rows.map((row, idx) => {
      const rate =
        rateOverrides[row.key] !== undefined
          ? rateOverrides[row.key]
          : row.baseRate;
      const mandays =
        mandayOverrides[row.key] !== undefined
          ? mandayOverrides[row.key]
          : row.mandays;
      return {
        ...row,
        id: idx + 1,
        rate,
        mandays,
        subtotal: rate * mandays,
      };
    });
  };

  const buildProjectPayload = (): ProjectPayload => {
    const resourceList = resources?.length ? resources : DEFAULT_RESOURCES;
    const resourceMap = new Map<number, Resource>(
      resourceList.map((r) => [r.id, r]),
    );

    const getRateForKey = (
      key: string,
      resourceId: number | null | undefined,
    ) => {
      if (rateOverrides[key] !== undefined) return rateOverrides[key];
      if (resourceId && resourceMap.has(resourceId)) {
        return Number(resourceMap.get(resourceId)?.cost ?? 0);
      }
      return 0;
    };

    const estimates = wbsItems.flatMap((item) => {
      const rows: ProjectPayload["estimates"] = [];
      if (item.fxResourceId) {
        const rateKey = `fx-${item.fxResourceId}`;
        rows.push({
          activityId: item.activityId,
          resourceId: item.fxResourceId,
          mandays: Number(item.fxMandays) || 0,
          startDate: item.fxStartDate || null,
          rate: getRateForKey(rateKey, item.fxResourceId),
        });
      }
      if (item.abapResourceId) {
        const rateKey = `abap-${item.abapResourceId}`;
        rows.push({
          activityId: item.activityId,
          resourceId: item.abapResourceId,
          mandays: Number(item.abapMandays) || 0,
          startDate: item.abapStartDate || null,
          rate: getRateForKey(rateKey, item.abapResourceId),
        });
      }
      return rows;
    });

    return {
      name: project.name,
      sponsor: project.sponsor,
      manager: project.manager,
      pmRate:
        rateOverrides.projectManager !== undefined
          ? rateOverrides.projectManager
          : null,
      pmMandays:
        mandayOverrides.projectManager !== undefined
          ? mandayOverrides.projectManager
          : null,
      version: project.version || undefined,
      startDate: project.startDate || undefined,
      businessNeed: project.businessNeed || undefined,
      projectGoal: project.projectGoal || undefined,
      measurableObjectives: project.measurableObjectives || undefined,
      deliverables: project.deliverables || undefined,
      outOfScope: project.outOfScope || undefined,
      estimates,
    };
  };

  const validateProject = (): boolean => {
    const nameValid = Boolean(project.name?.trim());
    if (!nameValid) {
      setStatusModal({
        type: "error",
        message: "Project name is required before saving.",
      });
      return false;
    }

    const hasMandayWithDate = wbsItems.some((item) => {
      const fxValid =
        (Number(item.fxMandays) || 0) > 0 && Boolean(item.fxStartDate);
      const abapValid =
        (Number(item.abapMandays) || 0) > 0 && Boolean(item.abapStartDate);
      return fxValid || abapValid;
    });

    if (!hasMandayWithDate) {
      setStatusModal({
        type: "error",
        message:
          "At least one WBS entry must include mandays and a start date before saving.",
      });
      return false;
    }

    return true;
  };

  const handleSaveDraft = () => {
    try {
      const projectData = {
        project,
        wbsItems,
        rateOverrides,
        mandayOverrides,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem("projectDraft", JSON.stringify(projectData));
      setStatusModal({
        type: "success",
        message: "Draft saved to browser storage",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to save the draft.";
      console.error(message);
      setStatusModal({ type: "error", message });
    }
  };

  const handleClearDraft = () => {
    localStorage.removeItem("projectDraft");
    setProject(EMPTY_PROJECT);
    setWbsItems(WBSITEMS_INIT);
    setRateOverrides({ projectManager: 0 });
    setMandayOverrides({ projectManager: 0 });
    setStatusModal({ type: "success", message: "Draft cleared" });
  };

  const handleExportPDF = async () => {
    toast.success("Exporting to PDF...");
    const computedRows = buildComputedCostRows();
    const byResource = computedRows.map((row) => ({
      resourceId: row.resourceId ?? 0,
      resourceName: row.name,
      resourceTitle: row.title,
      rate: row.rate,
      mandays: row.mandays,
      subtotal: row.subtotal,
    }));
    const activityMap = new Map(
      activities.map((a) => [a.id, a.activity] as const),
    );
    const wbsForPdf = wbsItems.map((item) => ({
      wbsId: item.wbsId,
      activity: activityMap.get(item.activityId) ?? "",
      fxStartDate: item.fxStartDate ?? "",
      fxResourceId: item.fxResourceId ?? "",
      fxMandays: item.fxMandays,
      abapStartDate: item.abapStartDate ?? "",
      abapResourceId: item.abapResourceId ?? "",
      abapMandays: item.abapMandays,
    }));
    await exportProjectToPdf({
      project,
      wbs: wbsForPdf,
      byResource,
      ganttMermaidCode: ganttMermaid || null,
      ganttSvgSelector: "#pc-gantt-svg",
    });
  };

  const handleExportExcel = () => {
    toast.success("Exporting to Excel...");
    const computedRows = buildComputedCostRows();
    const byResource = computedRows.map((row) => ({
      resourceId: row.resourceId ?? 0,
      resourceName: row.name,
      resourceTitle: row.title,
      rate: row.rate,
      mandays: row.mandays,
      subtotal: row.subtotal,
    }));
    exportProjectToExcel({ project, wbs: wbsItems, signers, byResource });
  };

  const runFinalCheck = async () => {
    showBusy();
    setFinalCheckBusy(true);
    try {
      const wbsSummary = wbsItems
        .map((item, idx) => {
          const activityName =
            activities.find((a) => a.id === item.activityId)?.activity ??
            `Activity ${item.activityId}`;
          const fx = Number(item.fxMandays) || 0;
          const abap = Number(item.abapMandays) || 0;
          const fxDate = item.fxStartDate ? `FX ${item.fxStartDate}` : "";
          const abapDate = item.abapStartDate
            ? `ABAP ${item.abapStartDate}`
            : "";
          const dates = [fxDate, abapDate].filter(Boolean).join(", ");
          return `${idx + 1}. ${activityName} - FX ${fx} md, ABAP ${abap} md${
            dates ? ` (${dates})` : ""
          }`;
        })
        .join("\n");

      const feedback = await validateProjectProposal(
        {
          ...project,
          creationDate: project.startDate,
        },
        wbsSummary,
        ganttMermaid || null,
      );
      setFinalCheckResult(feedback);
      setFinalCheckOpen(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to run final check";
      setStatusModal({ type: "error", message });
      toast.error(message);
    } finally {
      setFinalCheckBusy(false);
      hideBusy();
    }
  };

  const submitProjectToApi = async () => {
    if (!validateProject()) return;

    showBusy();
    setSubmitBusy(true);
    try {
      const payload = buildProjectPayload();

      const response = await withBusy(
        () =>
          hasId && project.id
            ? updateProject(project.id, payload)
            : createProject(payload),
        hasId ? "Saving project..." : "Creating project...",
      );

      if (response?.id && !project.id) {
        setProject((p) => ({ ...p, id: response.id }));
      }

      const newId = response?.id ?? project.id;
      const message = "Project submitted successfully";
      if (hasId) {
        setStatusModal({
          type: "success",
          message,
        });
      } else {
        setStatusModal({
          type: "success",
          message,
          actions: [
            {
              label: "View project",
              onClick: () => {
                if (newId) {
                  navigate(`/projects/${newId}`);
                } else {
                  navigate("/projects");
                }
              },
            },
            {
              label: "Create new project",
              variant: "secondary",
              onClick: () => {
                localStorage.removeItem("projectDraft");
                setProject(EMPTY_PROJECT);
                setWbsItems(WBSITEMS_INIT);
                setRateOverrides({ projectManager: 0 });
                setMandayOverrides({ projectManager: 0 });
                navigate("/projects/create");
              },
            },
          ],
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to submit project";
      setStatusModal({ type: "error", message });
    } finally {
      setSubmitBusy(false);
      hideBusy();
    }
  };

  const handleSubmit = async () => {
    if (finalCheckEnabled) {
      await runFinalCheck();
    } else {
      await submitProjectToApi();
    }
  };

  const handleFinalCheckProceed = async () => {
    setFinalCheckOpen(false);
    await submitProjectToApi();
  };

  //--------------------------------------------------------------------------
  // Render
  //--------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Project Information Section */}
      <InitiationSection
        project={project}
        setProject={setProject}
        lockActivity={editLocked}
      />

      {/* WBS (Work Breakdown Structure) Section */}
      <WBSSection
        wbsItems={wbsItems}
        setWbsItems={setWbsItems}
        lockActivity={editLocked}
        activities={activities}
        resources={resources}
      />

      {/* Cost Section */}
      <CostSection
        wbsItems={wbsItems}
        resources={resources}
        lockActivity={editLocked}
        rateOverrides={rateOverrides}
        mandayOverrides={mandayOverrides}
        onRateChange={(key, value) =>
          setRateOverrides((prev) => ({ ...prev, [key]: value }))
        }
        onMandayChange={(key, value) =>
          setMandayOverrides((prev) => ({ ...prev, [key]: value }))
        }
      />

      {/* Gantt Chart Section */}
      <GanttSection
        project={project}
        wbsItems={wbsItems}
        activities={activities}
        onMermaidChange={setGanttMermaid}
      />

      {/* Final Check Section */}
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
            before saving the project.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Left group */}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            // variant="destructive"
            className="w-full bg-gray-500 text-white hover:bg-gray-600 sm:w-auto"
            onClick={handleClearDraft}
            title="Clear inputs and local draft"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset draft
          </Button>
          <Button
            variant="default"
            onClick={handleSaveDraft}
            title="Save to browser"
            className="w-full sm:w-auto"
          >
            <Save className="mr-2 h-4 w-4" />
            Save draft
          </Button>
        </div>

        {/* Right group */}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap md:justify-end">
          <Button
            variant="outline"
            onClick={handleExportPDF}
            className="w-full sm:w-auto"
          >
            <FileText className="mr-2 h-4 w-4" />
            Export as PDF
          </Button>

          <Button
            variant="outline"
            onClick={handleExportExcel}
            className="w-full sm:w-auto"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export as Excel
          </Button>

          <Button
            disabled={submitBusy || editLocked || finalCheckBusy}
            onClick={handleSubmit}
            title={editLocked ? "Unlock editing to save changes." : undefined}
            className="w-full bg-green-600 text-white hover:bg-green-700 sm:w-auto"
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
                    ? "Save changes"
                    : "Create project"}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* -- Dialog -- */}
      <StatusDialog modal={statusModal} onClose={() => setStatusModal(null)} />

      <FinalCheckDialog
        open={finalCheckOpen}
        result={finalCheckResult}
        submitBusy={submitBusy}
        hasId={hasId}
        onClose={() => setFinalCheckOpen(false)}
        onProceed={handleFinalCheckProceed}
      />
    </div>
  );
}
