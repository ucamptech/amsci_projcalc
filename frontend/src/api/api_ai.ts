import axios from "axios";

const apiClient = axios.create({
  baseURL: "/", // same-origin; change if proxy differs
  headers: { "Content-Type": "application/json" },
});

type BaseProject = {
  name?: string;
  businessNeed?: string;
  projectGoal?: string;
  creationDate?: string | null;
};

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

export async function generateObjectives(project: BaseProject) {
  const instruction = `Write 3–5 SMART objectives (Specific, Measurable, Achievable, Relevant, Time-bound) based on:
          Project Name: ${project.name || "N/A"}
          Business Need: ${project.businessNeed || "N/A"}
          Project Goal: ${project.projectGoal || "N/A"}
          Creation Date: ${project.creationDate || "today"}
          Write concise bullet points (one per line). No intro text.`;
  const body = buildBody(project, instruction);
  return postPrompt(body);
}

export async function generateDeliverables(project: BaseProject) {
  const instruction = `List 3–5 major in-scope, tangible deliverables based on:
          Project Name: ${project.name || "N/A"}
          Business Need: ${project.businessNeed || "N/A"}
          Project Goal: ${project.projectGoal || "N/A"}
          Write concise bullet points (one per line). No intro text.`;
  const body = buildBody(project, instruction);
  return postPrompt(body);
}

export async function generateOutOfScope(project: BaseProject) {
  const instruction = `List 3-5 out-of-scope items to prevent scope creep, based on:
          Project Name: ${project.name || "N/A"}
          Business Need: ${project.businessNeed || "N/A"}
          Project Goal: ${project.projectGoal || "N/A"}
          Write concise bullet points (one per line). No intro text.`;
  const body = buildBody(project, instruction);
  return postPrompt(body);
}
