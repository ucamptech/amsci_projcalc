/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState, type ChangeEvent } from "react";
import type { ProjectInit } from "@/types/project.type";
import { useBusyOverlay } from "@/contexts/BusyOverlayContext";
import { today } from "@/lib/utils/date.utils";
import {
  generateDeliverables,
  generateObjectives,
  generateOutOfScope,
} from "@/lib/api/ai.api";

//--------------------------------------------------------------------------
// Types
//--------------------------------------------------------------------------
type SectionProps = {
  project: ProjectInit;
  setProject: (p: (prev: ProjectInit) => ProjectInit) => void;
  lockActivity?: boolean;
};

//--------------------------------------------------------------------------
// Constants
//--------------------------------------------------------------------------
const suggestedMilestones = `
Phase 1: Project Initiation (Weeks 1-2)
- Project kickoff meeting
- Stakeholder alignment
- Initial requirements gathering

Phase 2: Design & Planning (Weeks 3-5)
- System architecture design
- UI/UX mockups
- Technical specifications
  `.trim();

//--------------------------------------------------------------------------
// Main component
//--------------------------------------------------------------------------
export function InitiationSection({
  project,
  setProject,
  lockActivity = false,
}: SectionProps) {
  //--------------------------------------------------------------------------
  // States
  //--------------------------------------------------------------------------

  // Objectives states
  const [fetchingObjectives, setFetchingObjectives] = useState(false);
  const [showSuggestionsObj, setShowSuggestionsObj] = useState(false);
  const [suggestedObjectives, setSuggestedObjectives] = useState("");
  const [copiedObj, setCopiedObj] = useState(false);
  const [objError, setObjError] = useState<string | null>(null);

  // Deliverables states
  const [fetchingDeliverables, setFetchingDeliverables] = useState(false);
  const [showSuggestionsDeliv, setShowSuggestionsDeliv] = useState(false);
  const [suggestedDeliverables, setSuggestedDeliverables] = useState("");
  const [copiedDeliv, setCopiedDeliv] = useState(false);
  const [delivError, setDelivError] = useState<string | null>(null);

  // Out-of-scopt states
  const [fetchingOos, setFetchingOos] = useState(false);
  const [showSuggestionsOos, setShowSuggestionsOos] = useState(false);
  const [suggestedOos, setSuggestedOos] = useState("");
  const [copiedOos, setCopiedOos] = useState(false);
  const [oosError, setOosError] = useState<string | null>(null);

  //--------------------------------------------------------------------------
  // Helpers
  //--------------------------------------------------------------------------

  const { showBusy, hideBusy } = useBusyOverlay();

  const canSuggest =
    (project.businessNeed?.trim()?.length ?? 0) > 0 ||
    (project.projectGoal?.trim()?.length ?? 0) > 0 ||
    (project.name?.trim()?.length ?? 0) > 0;

  //--------------------------------------------------------------------------
  // useEffect
  //--------------------------------------------------------------------------
  useEffect(() => {
    if (!project.startDate) {
      setProject((p) => ({
        ...p,
        startDate: p.startDate || today,
      }));
    }
  }, [project.startDate, setProject]);

  //--------------------------------------------------------------------------
  // Functions
  //--------------------------------------------------------------------------

  // Insert to field based on suggested output
  const insertObjectives = () =>
    setProject((p) => ({ ...p, measurableObjectives: suggestedObjectives }));
  const insertDeliverables = () =>
    setProject((p) => ({ ...p, deliverables: suggestedDeliverables }));
  const insertOos = () =>
    setProject((p) => ({ ...p, outOfScope: suggestedOos }));

  // onChange of fields
  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProject((p) => ({ ...p, [name]: value }));
  };

  // Copy/Insert per section
  const copyWithHint = async (text: string, setFlag: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setFlag(true);
      setTimeout(() => setFlag(false), 1500);
    } catch {
      // Do nothing
    }
  };

  const onGenerateObjectives = async () => {
    const t0 = performance.now();
    setObjError(null);
    setFetchingObjectives(true);
    setCopiedObj(false);
    showBusy();
    try {
      const text = await generateObjectives(project as ProjectInit);
      setSuggestedObjectives(text);
      setShowSuggestionsObj(true);
    } catch (err) {
      setObjError("Failed to generate suggested objectives.");
      console.error("Objectives API error:", err);
    } finally {
      setFetchingObjectives(false);
      console.log(`Objectives took ${(performance.now() - t0) / 1000}s`);
      hideBusy();
    }
  };

  const onGenerateDeliverables = async () => {
    const t0 = performance.now();
    setDelivError(null);
    setFetchingDeliverables(true);
    setCopiedDeliv(false);
    showBusy();
    try {
      const text = await generateDeliverables(project as ProjectInit);
      setSuggestedDeliverables(text);
      setShowSuggestionsDeliv(true);
    } catch (err) {
      setDelivError("Failed to generate suggested deliverables.");
      console.error("Deliverables API error:", err);
    } finally {
      setFetchingDeliverables(false);
      console.log(`Deliverables took ${(performance.now() - t0) / 1000}s`);
      hideBusy();
    }
  };

  const onGenerateOutOfScope = async () => {
    const t0 = performance.now();
    setOosError(null);
    setFetchingOos(true);
    setCopiedOos(false);
    showBusy();
    try {
      const text = await generateOutOfScope(project as ProjectInit);
      setSuggestedOos(text);
      setShowSuggestionsOos(true);
    } catch (err) {
      setDelivError("Failed to generate suggested deliverables.");
      console.error("Deliverables API error:", err);
    } finally {
      setFetchingDeliverables(false);
      console.log(`Deliverables took ${(performance.now() - t0) / 1000}s`);
      hideBusy();
    }
  };

  //--------------------------------------------------------------------------
  // Render
  //--------------------------------------------------------------------------
  return (
    <section className="mt-0 gap-0" id="sect-initiation">
      <Card>
        <CardHeader>
          <CardTitle>I. Project information</CardTitle>
          <CardDescription>Basic details about the project</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="col-span-2 grid gap-1">
              <Label htmlFor="name">
                Project name <span className="text-red-500">*</span>
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
              <Label htmlFor="startDate">Start date</Label>
              <Input
                id="startDate"
                type="date"
                name="startDate"
                value={project.startDate ?? ""}
                onChange={onChange}
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
              <Label htmlFor="sponsor">Project sponsor</Label>
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
              <Label htmlFor="manager">Project manager</Label>
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
              <Label htmlFor="businessNeed">Business need/Problem</Label>
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
              <Label htmlFor="projectGoal">Project goal</Label>
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

          {/* Objectives */}
          <div className="grid gap-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="measurableObjectives">
                Measurable objectives
              </Label>
              <div className="flex items-center gap-2">
                {suggestedObjectives && (
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => setShowSuggestionsObj((v) => !v)}
                  >
                    {showSuggestionsObj
                      ? "Hide Suggestions"
                      : "Show Suggestions"}
                  </Button>
                )}
                <Button
                  variant="default"
                  type="button"
                  size="sm"
                  onClick={onGenerateObjectives}
                  disabled={lockActivity || fetchingObjectives || !canSuggest}
                  title={!canSuggest ? "Fill Project Name/Need/Goal first" : ""}
                >
                  <Sparkles className="mr-0 h-4 w-4" />
                </Button>
              </div>
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

            {/* Note for suggestion */}
            {!lockActivity &&
            !fetchingObjectives &&
            !objError &&
            !canSuggest ? (
              <SuggestionPrereqNote />
            ) : null}

            {showSuggestionsObj && suggestedObjectives && (
              <div className="bg-muted rounded-lg p-4">
                <div className="mb-2 flex items-start justify-between">
                  <h4 className="font-medium">Suggested objectives</h4>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={insertObjectives}
                      disabled={lockActivity}
                      title="Insert into the Measurable Objectives field"
                    >
                      Insert into field
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() =>
                        copyWithHint(suggestedObjectives, setCopiedObj)
                      }
                      title="Copy to clipboard"
                    >
                      {copiedObj ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                </div>
                <pre className="text-sm whitespace-pre-wrap">
                  {suggestedObjectives}
                </pre>
              </div>
            )}
          </div>

          {/* Deliverables */}
          <div className="grid gap-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="deliverables">In-scope deliverables</Label>
              <div className="flex items-center gap-2">
                {suggestedDeliverables && (
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => setShowSuggestionsDeliv((v) => !v)}
                  >
                    {showSuggestionsDeliv
                      ? "Hide Suggestions"
                      : "Show Suggestions"}
                  </Button>
                )}
                <Button
                  variant="default"
                  type="button"
                  size="sm"
                  onClick={onGenerateDeliverables}
                  disabled={lockActivity || fetchingDeliverables || !canSuggest}
                >
                  <Sparkles className="mr-0 h-4 w-4" />
                </Button>
              </div>
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

            {/* Note for suggestion */}
            {!lockActivity &&
            !fetchingDeliverables &&
            !delivError &&
            !canSuggest ? (
              <SuggestionPrereqNote />
            ) : null}

            {showSuggestionsDeliv && suggestedDeliverables && (
              <div className="bg-muted rounded-lg p-4">
                <div className="mb-2 flex items-start justify-between">
                  <h4 className="font-medium">Suggested deliverables</h4>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={insertDeliverables}
                      disabled={lockActivity}
                      title="Insert into the Deliverables field"
                    >
                      Insert into field
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() =>
                        copyWithHint(suggestedDeliverables, setCopiedDeliv)
                      }
                      title="Copy to clipboard"
                    >
                      {copiedDeliv ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                </div>
                <pre className="text-sm whitespace-pre-wrap">
                  {suggestedDeliverables}
                </pre>
              </div>
            )}
          </div>

          {/* Out-of-scope */}
          <div className="grid gap-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="outOfScope">Out-of-scope items</Label>
              <div className="flex items-center gap-2">
                {suggestedOos && (
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => setShowSuggestionsOos((v) => !v)}
                  >
                    {showSuggestionsOos
                      ? "Hide Suggestions"
                      : "Show Suggestions"}
                  </Button>
                )}
                <Button
                  variant="default"
                  type="button"
                  size="sm"
                  onClick={onGenerateOutOfScope}
                  disabled={lockActivity || fetchingOos || !canSuggest}
                >
                  <Sparkles className="mr-0 h-4 w-4" />
                </Button>
              </div>
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
              <p className="mt-1 text-xs text-red-500 italic">{oosError}</p>
            ) : null}

            {/* Note for suggestion */}
            {!lockActivity && !fetchingOos && !oosError && !canSuggest ? (
              <SuggestionPrereqNote />
            ) : null}

            {showSuggestionsOos && suggestedOos && (
              <div className="bg-muted rounded-lg p-4">
                <div className="mb-2 flex items-start justify-between">
                  <h4 className="font-medium">Suggested Out-of-Scope</h4>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={insertOos}
                      disabled={lockActivity}
                      title="Insert into the Out-of-Scope field"
                    >
                      Insert into field
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => copyWithHint(suggestedOos, setCopiedOos)}
                      title="Copy to clipboard"
                    >
                      {copiedOos ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                </div>
                <pre className="text-sm whitespace-pre-wrap">
                  {suggestedOos}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

//--------------------------------------------------------------------------
// Subcomponent
//--------------------------------------------------------------------------
function SuggestionPrereqNote() {
  return (
    <p className="mt-1 text-xs text-blue-400 italic">
      Note: Fill in <span className="font-medium">Project name</span>,
      <span className="font-medium"> Business need/Problem</span>, or
      <span className="font-medium"> Project goal</span> to enable the
      suggestion.
    </p>
  );
}
