import type { Project } from "./types";
import axios from "axios";

const apiClient = axios.create({
  baseURL: "/", // same-origin; change if proxy differs
  headers: { "Content-Type": "application/json" },
  timeout: 60000, // timeout after 1 min
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

export async function generateObjectives(project: Project) {
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
    - Creation Date: ${project.creationDate || "today"}

    Write concise bullet points (one per line). Do not include any intro text or explanations.`
    : `Write 3–5 SMART objectives (Specific, Measurable, Achievable, Relevant, Time-bound) based on:
    - Project Name: ${project.name || "N/A"}
    - Business Need: ${project.businessNeed || "N/A"}
    - Project Goal: ${project.projectGoal || "N/A"}
    - Creation Date: ${project.creationDate || "today"}

    Write concise bullet points (one per line). Do not include any intro text or explanations.`;

  const body = buildBody(project, instruction);
  return postPrompt(body);
}

export async function generateDeliverables(project: Project) {
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
    - Creation Date: ${project.creationDate || "today"}

    Write concise bullet points (one per line). Do not include any intro text or explanations.`
    : `List 3–5 major in-scope, tangible deliverables based on:
    - Project Name: ${project.name || "N/A"}
    - Business Need: ${project.businessNeed || "N/A"}
    - Project Goal: ${project.projectGoal || "N/A"}
    - Creation Date: ${project.creationDate || "today"}

    Write concise bullet points (one per line). Do not include any intro text or explanations.`;

  const body = buildBody(project, instruction);
  return postPrompt(body);
}

export async function generateOutOfScope(project: Project) {
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
    - Creation Date: ${project.creationDate || "today"}

    Write concise bullet points (one per line). Do not include any intro text or explanations.`
    : `List 3–5 out-of-scope items to prevent scope creep, based on:
    - Project Name: ${project.name || "N/A"}
    - Business Need: ${project.businessNeed || "N/A"}
    - Project Goal: ${project.projectGoal || "N/A"}
    - Creation Date: ${project.creationDate || "today"}

    Write concise bullet points (one per line). Do not include any intro text or explanations.`;

  const body = buildBody(project, instruction);
  return postPrompt(body);
}

export async function generateGanttMermaid(
  project: BaseProject,
  wbsRows: MinimalWbs[],
) {
  // Collapse same activity rows and convert mandays to days
  const totals = new Map<string, number>();
  for (const r of wbsRows) {
    const name = (r.activity || "").trim();
    if (!name) continue;
    const days = safeInt(r.fxMandays) + safeInt(r.abapMandays);
    if (days <= 0) continue;
    totals.set(name, (totals.get(name) ?? 0) + days);
  }

  const ordered = Array.from(totals.entries()).map(([name, md]) => ({
    name,
    days: Math.max(1, Math.ceil(md)),
  }));

  const start = (project.creationDate || "").toString().slice(0, 10) || "today";

  const taskListLines =
    ordered.length === 0
      ? "- (No tasks)\n"
      : ordered.map((t, i) => `- ${i + 1}. ${t.name} | ${t.days}d`).join("\n");

  const instruction = `
          You are to output ONLY a Mermaid Gantt diagram as a single fenced code block.
          Use exactly this structure:

          \`\`\`mermaid
          gantt
          title <Project Title>
          dateFormat YYYY-MM-DD
          axisFormat %b %d
          section Execution
          <Task 1> :t1, <YYYY-MM-DD>, <Nd>
          <Task 2> :after t1, <Nd>
          <Task 3> :after t2, <Nd>
          ...
          \`\`\`

          Rules:
          - Output nothing except the \`\`\`mermaid fenced block.
          - Use "Execution" as the only section.
          - Use "t1", "t2", ... sequential task ids (no spaces).
          - Set the first task to start on ${start}.
          - Schedule tasks SEQUENTIALLY in the listed order.
          - Each "manday" equals 1 day duration.
          - Title should be "${(project.name || "Project Gantt").replace(/"/g, "'")}".
          - If there are no tasks, still output a valid (empty) Gantt with just the header lines.
          - Please ensure that all of it are properly labeled and connected.
          - Do not add weekend dates on the gantt chart.

          Tasks (in order; "Name | Duration"):
          ${taskListLines}
            `.trim();

  const body = buildBody(project, instruction);
  return postPrompt(body);
}
