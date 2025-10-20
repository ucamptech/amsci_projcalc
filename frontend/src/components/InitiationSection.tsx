// src/components/InitiationSection.tsx
import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProjectInit } from "@/data/types";
import SectionTitle from "./SectionTitle";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  project: ProjectInit;
  setProject: (p: (prev: ProjectInit) => ProjectInit) => void;
};

export default function InitiationSection({ project, setProject }: Props) {
  // ---- functions ----
  function onChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setProject((p) => ({ ...p, [name]: value }));
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <section className="mt-2">
      <SectionTitle title="I. Project Charter (Initiation)" />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Project Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
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
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="grid gap-1">
              <Label htmlFor="creationDate">Creation Date</Label>
              <Input
                id="creationDate"
                type="date"
                name="creationDate"
                value={project.creationDate ?? ""}
                onChange={onChange}
                max={today}
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
              />
            </div>
          </div>

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
            />
          </div>

          <div className="grid gap-1">
            <Label htmlFor="measurableObjectives">Measurable Objectives</Label>
            <Textarea
              id="measurableObjectives"
              name="measurableObjectives"
              placeholder="List 3-5 SMART objectives. (e.g., Achieve 99% data accuracy on migrated records.)"
              value={project.measurableObjectives}
              onChange={onChange}
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-1">
              <Label htmlFor="inScope">In-Scope Deliverables</Label>
              <Textarea
                id="inScope"
                name="inScope"
                placeholder="Major, tangible outputs (e.g., Fully tested DM Tool; End-User Training Materials; Formal Data Migration Sign-off.)"
                value={project.inScope}
                onChange={onChange}
                rows={3}
                maxLength={500}
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
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
