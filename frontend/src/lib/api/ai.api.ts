import type { ProjectInit } from "@/types/project.type";
import axios from "axios";

const apiClient = axios.create({
  baseURL: "/", // same-origin; change if proxy differs
  headers: { "Content-Type": "application/json" },
  // timeout: 60000, // timeout after 1 min
});

type BaseProject = {
  name?: string;
  businessNeed?: string;
  projectGoal?: string;
  creationDate?: string | null;
};

type MinimalWbs = {
  activity: string;
  fxMandays?: number | string;
  abapMandays?: number | string;
  fxStartDate?: string | null;
  abapStartDate?: string | null;
};

type ExtendedProjectForCheck = BaseProject & {
  measurableObjectives?: string;
  deliverables?: string;
  outOfScope?: string;
};

function safeInt(n: unknown): number {
  const v = Math.max(0, Number(n ?? 0));
  return Number.isFinite(v) ? v : 0;
}

function buildBody(project: BaseProject, instruction: string) {
  return {
    model: "qwen/qwen3-vl-30b",
    input: instruction,
    messages: [
      {
        role: "user",
        content:
          project.name || project.projectGoal || project.businessNeed || "N/A",
      },
    ],
    stream: false,
    max_tokens: 220,
    temperature: 0.7,
    top_p: 0.9,
  };
}

async function postPrompt(body: unknown): Promise<string> {
  const { data } = await apiClient.post("/ai/v1/responses", body);

  const text: string = data?.output?.[0]?.content?.[0]?.text || "";
  if (!text.trim()) throw new Error("No content returned by the AI API.");
  return text.trim();
}

export async function generateObjectives(project: ProjectInit) {
  // Build the instruction
  const hasExisting =
    project.measurableObjectives &&
    project.measurableObjectives.trim().length > 0;

  const instruction = hasExisting
    ? `Improve and refine the following SMART objectives based on updated project details. Ensure they remain Specific, Measurable, Achievable, Relevant, and Time-bound.
    
    Existing Objectives:
    ${project.measurableObjectives}

    Project Details:
    - Project Name: ${project.name || "N/A"}
    - Business Need: ${project.businessNeed || "N/A"}
    - Project Goal: ${project.projectGoal || "N/A"}
    - Creation Date: ${project.startDate || "today"}

    Write concise bullet points (one per line). Do not include any intro text or explanations.`
    : `Write 3–5 SMART objectives (Specific, Measurable, Achievable, Relevant, Time-bound) based on:

    Project Details:
    - Project Name: ${project.name || "N/A"}
    - Business Need: ${project.businessNeed || "N/A"}
    - Project Goal: ${project.projectGoal || "N/A"}
    - Creation Date: ${project.startDate || "today"}

    Write concise bullet points (one per line). Do not include any intro text or explanations.`;

  const body = buildBody(project, instruction);
  return postPrompt(body);
}

export async function generateDeliverables(project: ProjectInit) {
  // Build the instruction
  const hasExisting =
    project.deliverables && project.deliverables.trim().length > 0;

  const instruction = hasExisting
    ? `Improve and refine the following list of major in-scope, tangible deliverables based on updated project details.
    
    Existing Deliverables:
    ${project.deliverables}

    Project Details:
    - Project Name: ${project.name || "N/A"}
    - Business Need: ${project.businessNeed || "N/A"}
    - Project Goal: ${project.projectGoal || "N/A"}
    - Creation Date: ${project.startDate || "today"}

    Write concise bullet points (one per line). Do not include any intro text or explanations.`
    : `List 3–5 major in-scope, tangible deliverables based on:
    - Project Name: ${project.name || "N/A"}
    - Business Need: ${project.businessNeed || "N/A"}
    - Project Goal: ${project.projectGoal || "N/A"}
    - Creation Date: ${project.startDate || "today"}

    Write concise bullet points (one per line). Do not include any intro text or explanations.`;

  const body = buildBody(project, instruction);
  return postPrompt(body);
}

export async function generateOutOfScope(project: ProjectInit) {
  // Build the instruction
  const hasExisting =
    project.outOfScope && project.outOfScope.trim().length > 0;

  const instruction = hasExisting
    ? `Improve and refine the following out-of-scope items to prevent scope creep, based on updated project details.
    
    Existing Out-of-Scope Items:
    ${project.outOfScope}

    Project Details:
    - Project Name: ${project.name || "N/A"}
    - Business Need: ${project.businessNeed || "N/A"}
    - Project Goal: ${project.projectGoal || "N/A"}
    - Creation Date: ${project.startDate || "today"}

    Write concise bullet points (one per line). Do not include any intro text or explanations.`
    : `List 3–5 out-of-scope items to prevent scope creep, based on:
    - Project Name: ${project.name || "N/A"}
    - Business Need: ${project.businessNeed || "N/A"}
    - Project Goal: ${project.projectGoal || "N/A"}
    - Creation Date: ${project.startDate || "today"}

    Write concise bullet points (one per line). Do not include any intro text or explanations.`;

  const body = buildBody(project, instruction);
  return postPrompt(body);
}

export async function generateGanttMermaid(
  project: BaseProject,
  wbsRows: MinimalWbs[],
) {
  const fallbackStart =
    (project.creationDate || "").toString().slice(0, 10) ||
    new Date().toISOString().slice(0, 10);

  const normalizeDate = (value?: string | null) => {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  };

  type Task = { name: string; start: string; days: number };

  const tasks: Task[] = [];

  wbsRows.forEach((row, idx) => {
    const label =
      (row.activity || `Task ${idx + 1}`).trim() || `Task ${idx + 1}`;
    const fxDays = safeInt(row.fxMandays);
    const abapDays = safeInt(row.abapMandays);
    const fxStart = normalizeDate(row.fxStartDate) ?? fallbackStart;
    const abapStart = normalizeDate(row.abapStartDate) ?? fallbackStart;

    if (fxDays > 0) {
      tasks.push({
        name: `${label} (FX)`,
        start: fxStart,
        days: Math.max(1, Math.ceil(fxDays)),
      });
    }

    if (abapDays > 0) {
      tasks.push({
        name: `${label} (ABAP)`,
        start: abapStart,
        days: Math.max(1, Math.ceil(abapDays)),
      });
    }
  });

  const title = (project.name || "Project Gantt").replace(/`/g, "'");
  const codeLines = [
    "gantt",
    `title ${title}`,
    "dateFormat YYYY-MM-DD",
    "axisFormat %b %d",
    "section Initiation",
  ];

  if (tasks.length === 0) {
    codeLines.push(`No tasks :t1, ${fallbackStart}, 1d`);
  } else {
    tasks
      .sort((a, b) => a.start.localeCompare(b.start))
      .forEach((task, index) => {
        codeLines.push(
          `${task.name} :t${index + 1}, ${task.start}, ${task.days}d`,
        );
      });
  }

  return ["```mermaid", ...codeLines, "```"].join("\n");
}

/**
 * Validate a project proposal for cohesion and achievability.
 */
export async function validateProjectProposal(
  project: ExtendedProjectForCheck,
  wbsSummary: string,
  ganttMermaid: string | null,
): Promise<string> {
  const wbsLines = wbsSummary || "No WBS provided.";
  const instruction = `
You are an experienced IT project manager reviewing an internal project proposal.

STRICT RULES — YOU MUST FOLLOW:
- Only use data provided in this prompt.
- Ignore outside/internet knowledge, even if the project name is familiar.
- EVERYTHING MUST BE WRITTEN IN BULLET POINTS.
- NO PARAGRAPHS ALLOWED, except the Verdict which must be a single sentence.
- Follow the exact output format below.

Your task is to analyze and validate whether the project is consistent and achievable.  
Check alignment between: title, business need, goal, objectives, deliverables, out of scope, WBS, estimates, and timeline.

Project details:
- Title: ${project.name || "N/A"}
- Business Need: ${project.businessNeed || "N/A"}
- Project Goal: ${project.projectGoal || "N/A"}
- Measurable Objectives: ${project.measurableObjectives || "N/A"}
- Deliverables: ${project.deliverables || "N/A"}
- Out of Scope: ${project.outOfScope || "N/A"}
- Creation Date: ${project.creationDate || "today"}

Timeline / Gantt (Mermaid):
${ganttMermaid || "No Gantt chart provided."}

WBS Summary:
${wbsLines}

OUTPUT FORMAT (STRICT — DO NOT CHANGE):

Summary:
- bullet
- bullet

Strengths:
- bullet
- bullet

Issues / Risks:
- bullet
- bullet

Suggestions:
- bullet
- bullet

Verdict:
A one-sentence verdict about whether the project is realistically achievable.
`.trim();

  const body = buildValidationBody(instruction);
  body.max_tokens = 500;
  body.temperature = 0.4;

  const text = await postPrompt(body);
  return text;
}

function buildValidationBody(instruction: string) {
  return {
    model: "qwen/qwen3-vl-30b",
    messages: [
      {
        role: "system",
        content:
          "as a project manager to check if the project title, business need, objectives, deliverables, WBS, resource estimates, and project timeline are cohesive and achievable before creating the project. ",
      },
      {
        role: "user",
        content: instruction,
      },
    ],
    input: instruction,
    stream: false,
    max_tokens: 700,
    temperature: 0.25,
    top_p: 0.9,
  };
}
