import type {
  Project,
  ProjectDetail,
  ProjectPayload,
} from "@/types/project.type";
import { apiClient, extractApiErrorMessage } from "./axios";

import type { PaginatedResponse } from "@/types/api.type";

export async function createProject(payload: ProjectPayload) {
  try {
    const { data } = await apiClient.post<Project>("/projects", payload);
    return data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "Failed to create project"));
  }
}

export async function updateProject(
  projectId: number,
  payload: ProjectPayload,
) {
  try {
    const { data } = await apiClient.put<Project>(
      `/projects/${projectId}`,
      payload,
    );
    return data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "Failed to update project"));
  }
}

export async function getProjects(page = 1) {
  try {
    const { data } = await apiClient.get<PaginatedResponse<Project>>(
      "/projects",
      { params: { page } },
    );
    return data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "Failed to load projects"));
  }
}

export async function getProjectById(projectId: number) {
  try {
    const { data } = await apiClient.get<ProjectDetail>(
      `/projects/${projectId}`,
    );
    return data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "Failed to load project"));
  }
}
