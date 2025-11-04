import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  generateDeliverables,
  generateObjectives,
  generateOutOfScope,
} from "@/api/api_ai";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProjectInit } from "@/data/types";
import SectionTitle from "./SectionTitle";
import { Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  project: ProjectInit;
  setProject: (p: (prev: ProjectInit) => ProjectInit) => void;
  lockActivity?: boolean;
};

export default function InitiationSection({
  project,
  setProject,
  lockActivity = false,
}: Props) {
  const [fetchingObjectives, setFetchingObjectives] = useState(false);
  const [fetchingDeliverables, setFetchingDeliverables] = useState(false);
  const [fetchingOos, setFetchingOos] = useState(false);

  const [objError, setObjError] = useState<string | null>(null);
  const [delivError, setDelivError] = useState<string | null>(null);
  const [oosError, setOosError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!project.creationDate) {
      setProject((p) => ({ ...p, creationDate: today }));
    }
  }, [project.creationDate, setProject, today]);

  // ----- actions -----
  function onChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    setProject((p) => ({ ...p, [name]: value }));
  }

  async function onGenerateObjectives() {
    setObjError(null);
    setFetchingObjectives(true);
    const t0 = performance.now();
    try {
      console.log("Generate Objectives: ", t0);
      const text = await generateObjectives(project);
      setProject((p) => ({ ...p, measurableObjectives: text }));
    } catch (err) {
      setObjError("Failed to generate objectives.");
      console.error("Objectives API error:", err);
    } finally {
      setFetchingObjectives(false);
      console.log(`Objectives took ${(performance.now() - t0) / 1000}s`);
    }
  }

  async function onGenerateDeliverables() {
    setDelivError(null);
    setFetchingDeliverables(true);
    const t0 = performance.now();
    try {
      console.log("Generate Deliverables: ", t0);
      const text = await generateDeliverables(project);
      setProject((p) => ({ ...p, deliverables: text }));
    } catch (err) {
      setDelivError("Failed to generate deliverables.");
      console.error("Deliverables API error:", err);
    } finally {
      setFetchingDeliverables(false);
      console.log(`Deliverables took ${(performance.now() - t0) / 1000}s`);
    }
  }

  async function onGenerateOutOfScope() {
    setOosError(null);
    setFetchingOos(true);
    const t0 = performance.now();
    try {
      console.log("Generate OutOfScope: ", t0);
      const text = await generateOutOfScope(project);
      setProject((p) => ({ ...p, outOfScope: text }));
    } catch (err) {
      setOosError("Failed to generate out-of-scope items.");
      console.error("Out-of-Scope API error:", err);
    } finally {
      setFetchingOos(false);
      console.log(`Out-of-Scope took ${(performance.now() - t0) / 1000}s`);
    }
  }

  const canSuggest =
    (project.businessNeed?.trim()?.length ?? 0) > 0 ||
    (project.projectGoal?.trim()?.length ?? 0) > 0 ||
    (project.name?.trim()?.length ?? 0) > 0;

  // ---------- render ----------
  return (
    <section className="mt-2 gap-0">
      <SectionTitle title="I. Project Charter (Initiation)" />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Project Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="col-span-2 grid gap-1">
              <Label htmlFor="name">
                Project Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="The formal, unique name of the project."
                value={project.name}
                onChange={onChange}
                maxLength={50}
                disabled={lockActivity}
                required
              />
            </div>

            <div className="col-span-1 grid gap-1">
              <Label htmlFor="creationDate">Creation Date</Label>
              <Input
                id="creationDate"
                type="date"
                name="creationDate"
                value={project.creationDate ?? ""}
                onChange={onChange}
                max={today}
                disabled={lockActivity}
              />
            </div>

            <div className="col-span-1 grid gap-1">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                name="version"
                placeholder="v1.0"
                value={project.version}
                onChange={onChange}
                maxLength={10}
                disabled={lockActivity}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-1">
              <Label htmlFor="sponsor">Project Sponsor</Label>
              <Input
                id="sponsor"
                name="sponsor"
                placeholder="Individual authorizing project"
                value={project.sponsor}
                onChange={onChange}
                maxLength={50}
                disabled={lockActivity}
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="manager">Project Manager</Label>
              <Input
                id="manager"
                name="manager"
                placeholder="Responsible manager"
                value={project.manager}
                onChange={onChange}
                maxLength={50}
                disabled={lockActivity}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-1">
              <Label htmlFor="businessNeed">Business Need/Problem</Label>
              <Textarea
                id="businessNeed"
                name="businessNeed"
                placeholder="Clearly state the problem or opportunity the project addresses. (Why are we doing this?)"
                value={project.businessNeed}
                onChange={onChange}
                rows={3}
                maxLength={500}
                disabled={lockActivity}
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="projectGoal">Project Goal</Label>
              <Textarea
                id="projectGoal"
                name="projectGoal"
                placeholder="A high-level statement of what the project will achieve. (e.g., To implement a new Data Extraction Tool.)"
                value={project.projectGoal}
                onChange={onChange}
                rows={3}
                maxLength={500}
                disabled={lockActivity}
              />
            </div>
          </div>

          {/* Objectives with generator */}
          <div className="grid gap-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="measurableObjectives">
                Measurable Objectives
              </Label>
              <Button
                variant="default"
                type="button"
                size="sm"
                onClick={onGenerateObjectives}
                disabled={lockActivity || fetchingObjectives || !canSuggest}
                title={!canSuggest ? "Fill Project Name/Need/Goal first" : ""}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {fetchingObjectives ? "Generating…" : "Generate Objectives"}
              </Button>
            </div>
            <Textarea
              id="measurableObjectives"
              name="measurableObjectives"
              placeholder="List 3–5 SMART objectives. (e.g., Achieve 99% data accuracy on migrated records.)"
              value={project.measurableObjectives}
              onChange={onChange}
              rows={3}
              maxLength={1000}
              disabled={lockActivity}
            />
            {objError ? (
              <p className="mt-1 text-xs text-red-500 italic">{objError}</p>
            ) : null}
            {!lockActivity &&
            !fetchingObjectives &&
            !objError &&
            !canSuggest ? (
              <p className="text-muted-foreground mt-1 text-xs">
                Tip: Fill in <span className="font-medium">Project Name</span>,
                <span className="font-medium"> Business Need</span>, or
                <span className="font-medium"> Project Goal</span> to improve
                the AI suggestion.
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Deliverables with generator */}
            <div className="grid gap-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="deliverables">In-Scope Deliverables</Label>
                <Button
                  variant="default"
                  type="button"
                  size="sm"
                  onClick={onGenerateDeliverables}
                  disabled={lockActivity || fetchingDeliverables || !canSuggest}
                  title={!canSuggest ? "Fill Project Name/Need/Goal first" : ""}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {fetchingDeliverables
                    ? "Generating…"
                    : "Generate Deliverables"}
                </Button>
              </div>
              <Textarea
                id="deliverables"
                name="deliverables"
                placeholder="Major, tangible outputs (e.g., Fully tested DM Tool; End-User Training Materials; Formal Sign-off.)"
                value={project.deliverables}
                onChange={onChange}
                rows={3}
                maxLength={1000}
                disabled={lockActivity}
              />
              {delivError ? (
                <p className="mt-1 text-xs text-red-500 italic">{delivError}</p>
              ) : null}
            </div>

            {/* Out-of-Scope with generator */}
            <div className="grid gap-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="outOfScope">Out-of-Scope Items</Label>
                <Button
                  variant="default"
                  type="button"
                  size="sm"
                  onClick={onGenerateOutOfScope}
                  disabled={lockActivity || fetchingOos || !canSuggest}
                  title={!canSuggest ? "Fill Project Name/Need/Goal first" : ""}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {fetchingOos ? "Generating…" : "Generate Out-of-Scope"}
                </Button>
              </div>
              <Textarea
                id="outOfScope"
                name="outOfScope"
                placeholder="Clearly state what is not included to prevent scope creep."
                value={project.outOfScope}
                onChange={onChange}
                rows={3}
                maxLength={1000}
                disabled={lockActivity}
              />
              {oosError ? (
                <p className="italics mt-1 text-xs text-red-500">{oosError}</p>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
