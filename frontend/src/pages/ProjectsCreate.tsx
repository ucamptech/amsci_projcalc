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

import { Button } from "@/components/ui/button";
import CostSection from "@/components/CostSection";
import DashLayout from "@/layouts/DashLayout";
import InitiationSection from "@/components/InitiationSection";
import WBSSection from "@/components/WBSSection";
import { api } from "@/api/api";
import { cryptoId } from "@/utils/number";
import { exportProjectCharterExcel } from "@/utils/xlsxExport";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useParams } from "react-router-dom";

export default function ProjectsCreate() {
  const { id } = useParams();
  const isDisplay = Boolean(id);
  const isEdit = Boolean(id);

  const [project, setProject] = useState<ProjectInit>(EMPTY_PROJECT);
  const [signers] = useLocalStorage("pc_signers", []);

  const [wbsRows, setWbsRows] = useState<WbsRow[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [modal, setModal] = useState<ModalState | null>(null);

  // ---------- FETCH ----------
  useEffect(() => {
    let mounted = true;

    async function retrieveFromAPI(): Promise<void> {
      setLoading(true);
      try {
        const [activities, resources] = await Promise.all([
          // api.login("test@example.com", "passw0rd123"),
          api.getActivities(),
          api.getResources(),
        ]);
        if (!mounted) return;

        console.log("Activities:", activities);
        console.log("Resources:", resources);
        console.log("----");

        const rows: WbsRow[] = (activities ?? []).map((a) => ({
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
        setActivities(activities ?? []);
        setResources(resources ?? []);

        if (isDisplay && isEdit) {
          const proj = await api.getProjectById(Number(id));
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
            // creationDate: proj.createdAt ? new Date(proj.createdAt).toISOString().slice(0, 10) : undefined,
            // version: proj.version ?? "v1.0",
          });

          // Merge estimates into rows
          const rowsByActId = new Map<number, WbsRow>(
            rows.map((r) => [Number(r.activityId), r])
          );

          for (const e of proj.estimates ?? []) {
            const actId = Number(e.activityId);
            let row = rowsByActId.get(actId);

            if (!row) {
              row = {
                id: cryptoId(),
                activityId: e.activity?.id ?? actId,
                wbsId: e.activity?.wbsId ?? "",
                activity: e.activity?.activity ?? `Activity ${actId}`,
                fxResourceId: "",
                fxMandays: 0,
                abapResourceId: "",
                abapMandays: 0,
              };
              rowsByActId.set(actId, row);
            }

            const typeName =
              e.resource?.resourceType?.name?.toLowerCase?.() ?? "";

            const mandaysNum = Number(e.mandays ?? 0);

            if (typeName.includes("functional")) {
              row.fxResourceId = String(e.resourceId);
              row.fxMandays = mandaysNum;
            } else if (typeName.includes("technical")) {
              row.abapResourceId = String(e.resourceId);
              row.abapMandays = mandaysNum;
            } else {
              // Fallback: fill first empty slot
              if (!row.fxResourceId) {
                row.fxResourceId = String(e.resourceId);
                row.fxMandays = mandaysNum;
              } else {
                row.abapResourceId = String(e.resourceId);
                row.abapMandays = mandaysNum;
              }
            }
          }

          const retrievedRows = Array.from(rowsByActId.values());
          setWbsRows(retrievedRows);
        }
      } catch (err) {
        // Use default data
        const rows: WbsRow[] = DEFAULT_ACTIVITIES.map((a) => ({
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
        setResources(DEFAULT_RESOURCES);

        const message =
          err instanceof Error ? err.message : "Server unavailable.";
        setModal({ type: "error", message: `Server offline. (${message})` });
      } finally {
        setLoading(false);
      }
    }

    // Call functions/voids
    void retrieveFromAPI();

    return () => {
      mounted = false;
    };
  }, [isDisplay, id, isEdit]);

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
      if (r.fxResourceId && Number(r.fxMandays) > 0) {
        estimates.push({
          resourceId: Number(r.fxResourceId),
          activityId: Number(r.activityId),
          mandays: Number(r.fxMandays),
        });
      }
      if (r.abapResourceId && Number(r.abapMandays) > 0) {
        estimates.push({
          resourceId: Number(r.abapResourceId),
          activityId: Number(r.activityId),
          mandays: Number(r.abapMandays),
        });
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

      console.log(payload);

      if (!payload.name) {
        throw new Error("Please fill out Project Name field.");
      }
      if (payload.estimates.length === 0) {
        throw new Error(
          "Add at least one estimate (Resource + Mandays) in WBS."
        );
      }

      await api.createProject(payload);
      setModal({ type: "success", message: "Project created successfully." });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create project.";
      setModal({ type: "error", message });
    } finally {
      setSubmitBusy(false);
    }
  }

  // ---------- render ----------
  return (
    <DashLayout title="Create new project">
      {loading ? (
        <Card>
          <CardContent className="py-8">Loading…</CardContent>
        </Card>
      ) : (
        <>
          <InitiationSection project={project} setProject={setProject} />
          <WBSSection
            wbsRows={wbsRows}
            setWbsRows={setWbsRows}
            resources={resources}
            activities={activities}
            lockActivity={isEdit}
          />
          {/* <AuthorizationSection /> */}
          <CostSection wbsRows={wbsRows} resources={resources} />

          <div className="flex items-center justify-end mb-3 mt-4">
            <div className="flex gap-2">
              <Button variant="outline" onClick={onGenerateExcel}>
                Generate Excel
              </Button>
              <Button
                disabled={!canSubmit || submitBusy}
                onClick={onSubmitProject}
              >
                {submitBusy
                  ? isEdit
                    ? "Saving…"
                    : "Creating…"
                  : isEdit
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
