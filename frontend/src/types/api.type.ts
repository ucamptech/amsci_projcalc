import type { ProjectInit, WBSItem } from "./project.type";

export type PaginatedResponse<T> = {
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    first_page: number;
    first_page_url: string | null;
    last_page_url: string | null;
    next_page_url: string | null;
    prev_page_url: string | null;
  };
  data: T[];
};

export type SubmitProjectPayload = {
  project: ProjectInit;
  wbsItems: WBSItem[];
};
