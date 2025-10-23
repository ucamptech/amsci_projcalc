import type { Activity, Resource } from "@/api/types";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  DEFAULT_ACTIVITIES,
  DEFAULT_RESOURCES,
  EMPTY_PROJECT,
} from "@/data/defaults";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  ModalState,
  ProjectInit,
  ProjectPayload,
  WbsRow,
} from "@/data/types";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import CostSection from "@/components/CostSection";
import DashLayout from "@/layouts/DashLayout";
import GanttSection from "@/components/GanttSection";
import InitiationSection from "@/components/InitiationSection";
import WBSSection from "@/components/WBSSection";
import { api } from "@/api/api";
import { cryptoId } from "@/utils/number";
import { exportProjectCharterExcel } from "@/utils/xlsxExport";
import useLocalStorage from "@/hooks/useLocalStorage";

export default function ProjectsCreate() {
  const { id } = useParams();
  const navigate = useNavigate();

  // If there's an id in the URL, show saved project.
  const hasId = Boolean(id);

  const [project, setProject] = useState<ProjectInit>(EMPTY_PROJECT);
  const [signers] = useLocalStorage("pc_signers", []);

  const [wbsRows, setWbsRows] = useState<WbsRow[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [editLocked, setEditLocked] = useState<boolean>(false);

  // ---------- FETCH ----------
  useEffect(() => {
    let mounted = true;

    async function retrieveFromAPI(): Promise<void> {
      setLoading(true);
      try {
        const [activitiesRes, resourcesRes] = await Promise.all([
          api.getActivities(),
          api.getResources(),
        ]);

        if (!mounted) return;

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

        if (hasId) {
          const proj = await api.getProjectById(Number(id));
          console.log("proj:", proj);
          if (!mounted) return;

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
          console.log("Estimates", proj.estimates);

          // If API returns estimates, hydrate WBS rows:
          if (Array.isArray(proj.estimates) && proj.estimates.length > 0) {
            // Map existing estimates into the template rows by activityId
            const mapped = rows.map((r) => {
              const fx = proj.estimates?.find(
                (estimate) =>
                  estimate.activityId === r.activityId &&
                  String(
                    estimate.resource?.resourceType?.name ?? ""
                  ).toLowerCase() === "functional"
              );
              const abap = proj.estimates?.find(
                (estimate) =>
                  estimate.activityId === r.activityId &&
                  String(
                    estimate.resource?.resourceType?.name ?? ""
                  ).toLowerCase() === "technical"
              );

              return {
                ...r,
                fxId: fx?.id,
                fxResourceId: fx?.resourceId?.toString() ?? "",
                fxMandays: fx?.mandays ?? 0,
                abapId: abap?.id,
                abapResourceId: abap?.resourceId?.toString() ?? "",
                abapMandays: abap?.mandays ?? 0,
              };
            });
            console.log("Mapped: ", mapped);
            setWbsRows(mapped);
          }

          // Saved project: unlock editing as default
          setEditLocked(false);
        } else {
          // New project: unlock editing
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
        if (message == "Row not found") {
          navigate("/projects/create", { replace: true });
        } else {
          setModal({ type: "error", message: `Server offline. (${message})` });
        }
      } finally {
        setLoading(false);
      }
    }

    void retrieveFromAPI();
    return () => {
      mounted = false;
    };
  }, [hasId, id, navigate]);

  // ---------- derived states ----------
  const canSubmit = useMemo(() => {
    const hasBasics = project.name?.trim().length > 0;
    const hasEstimates = wbsRows.some(
      (r) =>
        (r.fxResourceId && Number(r.fxMandays) > 0) ||
        (r.abapResourceId && Number(r.abapMandays) > 0)
    );
    return hasBasics && hasEstimates;
  }, [project, wbsRows]);

  // ---------- actions ----------
  function onGenerateExcel(): void {
    exportProjectCharterExcel({ project, wbs: wbsRows, signers });
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
          r.fxId && r.fxId != 0 ? { ...estimate, id: r.fxId } : estimate
        );
      }
      if (r.abapResourceId && abapMandays > 0) {
        const estimate = {
          resourceId: Number(r.abapResourceId),
          activityId: Number(r.activityId),
          mandays: abapMandays,
        };
        estimates.push(
          r.abapId && r.abapId != 0 ? { ...estimate, id: r.abapId } : estimate
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
          "Add at least one estimate (Resource + Mandays) in WBS."
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
          <InitiationSection
            project={project}
            setProject={setProject}
            lockActivity={editLocked}
          />

          <WBSSection
            wbsRows={wbsRows}
            setWbsRows={setWbsRows}
            resources={resources}
            activities={activities}
            lockActivity={editLocked}
          />

          <CostSection wbsRows={wbsRows} resources={resources} />

          <GanttSection wbsRows={wbsRows} resources={resources} />

          {/* Actions */}
          <div className="flex items-center justify-end mb-3 mt-4">
            <div className="flex gap-2">
              {/* <Button
                variant={editLocked ? "secondary" : "outline"}
                onClick={() => setEditLocked((v) => !v)}
              >
                {editLocked ? (
                  <>
                    <LockOpen className="mr-2 h-4 w-4" />
                    Unlock Editing
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Lock Editing
                  </>
                )}
              </Button> */}

              <Button variant="outline" onClick={onGenerateExcel}>
                Generate Excel
              </Button>

              <Button
                disabled={!canSubmit || submitBusy || editLocked}
                onClick={onSubmitProject}
                title={
                  editLocked ? "Unlock editing to save changes." : undefined
                }
              >
                {submitBusy
                  ? hasId
                    ? "Saving…"
                    : "Creating…"
                  : hasId
                  ? "Save Changes"
                  : "Create Project"}
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
            </DialogContent>
          </Dialog>
        </>
      )}
    </DashLayout>
  );
}
