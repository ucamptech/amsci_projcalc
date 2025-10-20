import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DEFAULT_ACTIVITIES, DEFAULT_RESOURCES } from "@/data/defaults";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  ProjectCreatePayload,
  ProjectInit,
  Resource,
  WbsRow,
} from "@/data/types";
import { useEffect, useMemo, useState } from "react";

import AuthorizationSection from "@/components/AuthorizationSection";
import { Button } from "@/components/ui/button";
import DashLayout from "@/layouts/DashLayout";
import InitiationSection from "@/components/InitiationSection";
import WBSSection from "@/components/WBSSection";
import { api } from "@/utils/api";
import { cryptoId } from "@/utils/number";
import { exportProjectCharterExcel } from "@/utils/xlsxExport";
import useLocalStorage from "@/hooks/useLocalStorage";

// -------- CONSTANTS --------
const EMPTY_PROJECT: ProjectInit = {
  id: 0,
  name: "",
  sponsor: "",
  manager: "",
  version: "v1.0",
  businessNeed: "",
  projectGoal: "",
  measurableObjectives: "",
  inScope: "",
  outOfScope: "",
};

type ModalState = { type: "error" | "success"; message: string };

export default function ProjectsCreate() {
  const [project, setProject] = useLocalStorage<ProjectInit>(
    "pc_project",
    EMPTY_PROJECT
  );
  const [signers] = useLocalStorage("pc_signers", []);

  const [wbsRows, setWbsRows] = useState<WbsRow[]>([]);
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
        const [activities, res] = await Promise.all([
          api.getActivities(),
          api.getResources(),
        ]);
        if (!mounted) return;

        const rows: WbsRow[] = (activities ?? []).map((a) => ({
          id: cryptoId(),
          activityId: a.id,
          wbsId: a.wbsId,
          activity: a.activity,
          level: 0,
          fxResourceId: "",
          fxMandays: 0,
          abapResourceId: "",
          abapMandays: 0,
        }));

        setWbsRows(rows);
        setResources(res ?? []);
      } catch (err) {
        // Use default data
        const rows: WbsRow[] = DEFAULT_ACTIVITIES.map((a) => ({
          id: cryptoId(),
          activityId: a.id,
          wbsId: a.wbsId,
          activity: a.activity,
          level: 0,
          fxResourceId: "",
          fxMandays: 0,
          abapResourceId: "",
          abapMandays: 0,
        }));

        setWbsRows(rows);
        setResources(DEFAULT_RESOURCES);

        const message = err instanceof Error ? err.message : "API unavailable.";
        setModal({ type: "error", message: `API offline. (${message})` });
      } finally {
        setLoading(false);
      }
    }

    void retrieveFromAPI();
    return () => {
      mounted = false;
    };
  }, []);

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

  function buildPayload(): ProjectCreatePayload {
    const estimates: ProjectCreatePayload["estimates"] = [];
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
      outOfScope: project.outOfScope?.trim() || "",
      estimates,
    };
  }

  async function onCreateProject(): Promise<void> {
    setSubmitBusy(true);
    try {
      const payload = buildPayload();

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
            lockActivity={false}
          />
          <AuthorizationSection />

          <div className="flex items-center justify-end mb-3 mt-4">
            <div className="flex gap-2">
              <Button variant="outline" onClick={onGenerateExcel}>
                Generate Excel
              </Button>
              <Button
                disabled={!canSubmit || submitBusy}
                onClick={onCreateProject}
              >
                {submitBusy ? "Creating…" : "Create Project"}
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
