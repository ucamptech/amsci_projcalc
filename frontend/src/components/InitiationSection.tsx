import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProjectInit } from "@/data/types";
import SectionTitle from "./SectionTitle";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";

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
  const [objError, setObjError] = useState<string | null>(null);

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

  async function fetchObjectivesFromApi() {
    const start = Date.now();
    console.log("Start time:", new Date(start).toLocaleTimeString());
    setObjError(null);
    setFetchingObjectives(true);

    try {
      const body = {
        model: "qwen/qwen3-4b-2507",
        input: `Write 3–5 SMART objectives (Specific, Measurable, Achievable, Relevant, Time-bound) based on the following details.
        Project Name: ${project.name || "N/A"}
        Business Need: ${project.businessNeed || "N/A"}
        Project Goal: ${project.projectGoal || "N/A"}
        Creation Date: ${project.creationDate || "today"} 
        Respond with the objectives only and no intro or explanations.`,
        messages: [
          {
            role: "user",
            content:
              // project.measurableObjectives ||
              project.name ||
              project.projectGoal ||
              project.businessNeed ||
              "N/A",
          },
        ],
        stream: false,
        max_tokens: 150,
        temperature: 0.7,
        top_p: 0.9,
      };

      console.log("Request body:", body);

      const { data } = await axios.post("/ai/v1/responses", body, {
        headers: { "Content-Type": "application/json" },
        // timeout: 10000, // 10 seconds timeout
      });

      console.log("Response data: ", data);

      const text = data?.output?.[0]?.content?.[0]?.text || "";

      if (!text.trim()) throw new Error("No objectives returned by the API.");

      setProject((p) => ({
        ...p,
        measurableObjectives: text.trim(),
      }));
    } catch (err) {
      console.error("Error fetching objectives:", err);
      if (axios.isAxiosError(err)) {
        setObjError(
          err.response
            ? `API error (${err.response.status}): ${err.response.statusText}`
            : "Network error: please check your connection or server.",
        );
      } else {
        setObjError("Failed to generate objectives. Please try again.");
      }
    } finally {
      setFetchingObjectives(false);
      const end = Date.now();
      console.log("End time:", new Date(end).toLocaleTimeString());
      console.log(`Elapsed time: ${(end - start) / 1000} seconds`);
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
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-1">
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

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-1">
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
            <div className="grid gap-1">
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

          <div className="grid gap-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="measurableObjectives">
                Measurable Objectives
              </Label>
              <Button
                variant="default"
                type="button"
                size="sm"
                onClick={fetchObjectivesFromApi}
                disabled={lockActivity || fetchingObjectives || !canSuggest}
              >
                {fetchingObjectives ? "Generating…" : "Generate Objectives"}
              </Button>
            </div>
            <Textarea
              id="measurableObjectives"
              name="measurableObjectives"
              placeholder="List 3-5 SMART objectives. (e.g., Achieve 99% data accuracy on migrated records.)"
              value={project.measurableObjectives}
              onChange={onChange}
              rows={3}
              maxLength={1000}
              disabled={lockActivity}
            />
            {objError ? (
              <p className="mt-1 text-sm text-red-500">{objError}</p>
            ) : null}
            {!lockActivity &&
            !fetchingObjectives &&
            !objError &&
            !canSuggest ? (
              <p className="text-muted-foreground mt-1 text-xs">
                Tip: Fill in <span className="font-medium">Project Name</span>,
                <span className="font-medium"> Business Need</span>, or
                <span className="font-medium"> Project Goal</span> to improve
                the API suggestion.
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-1">
              <Label htmlFor="deliverables">In-Scope Deliverables</Label>
              <Textarea
                id="deliverables"
                name="deliverables"
                placeholder="Major, tangible outputs (e.g., Fully tested DM Tool; End-User Training Materials; Formal Data Migration Sign-off.)"
                value={project.deliverables}
                onChange={onChange}
                rows={3}
                maxLength={500}
                disabled={lockActivity}
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="outOfScope">Out-of-Scope Items</Label>
              <Textarea
                id="outOfScope"
                name="outOfScope"
                placeholder="Clearly state what is not included to prevent scope creep."
                value={project.outOfScope}
                onChange={onChange}
                rows={3}
                maxLength={500}
                disabled={lockActivity}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
