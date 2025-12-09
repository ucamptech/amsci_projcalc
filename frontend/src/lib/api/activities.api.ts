import type { PaginatedResponse } from "@/types/api.type";
import type { Activity } from "@/types/activity.type";

import { apiClient, extractApiErrorMessage } from "./axios";

export async function fetchActivities(page = 1) {
  try {
    const { data } = await apiClient.get<PaginatedResponse<Activity>>(
      "/activities",
      { params: { page } },
    );
    return data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "Failed to load activities"));
  }
}
