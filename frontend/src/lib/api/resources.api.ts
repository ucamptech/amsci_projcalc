import type { PaginatedResponse } from "@/types/api.type";
import type { Resource } from "@/types/resource.type";

import { apiClient, extractApiErrorMessage } from "./axios";

type FetchResourcesOptions = {
  page?: number;
  resourceTypeId?: number;
};

export async function fetchResources(options?: FetchResourcesOptions) {
  const { page = 1, resourceTypeId } = options ?? {};
  try {
    const { data } = await apiClient.get<PaginatedResponse<Resource>>(
      "/resources",
      { params: { page, resourceTypeId } },
    );
    return data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "Failed to load resources"));
  }
}
