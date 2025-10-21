/** Common pagination metadata */
export interface Meta {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  firstPage: number;
  firstPageUrl: string;
  lastPageUrl: string;
  nextPageUrl: string | null;
  previousPageUrl: string | null;
}

/** Generic structure for paginated responses */
export interface PaginatedResponse<T> {
  meta: Meta;
  data: T[];
}

/* ---------------------- RESOURCES ---------------------- */
export interface ResourceType {
  id?: number;
  name: string;
}

export interface Resource {
  id?: number;
  name: string;
  title: string;
  cost: number;
  resourceTypeId: number;
  resourceType?: ResourceType;
}

export type ResourceResponse = PaginatedResponse<Resource>;

/* ---------------------- ACTIVITIES ---------------------- */
export interface Activity {
  id?: number;
  wbsId: string;
  activity: string;
}

export type ActivityResponse = PaginatedResponse<Activity>;

/* ---------------------- PROJECTS ---------------------- */
export interface Project {
  id?: number;
  name: string;
  sponsor: string;
  manager: string;
  version: string;
  businessNeed: string;
  projectGoal: string;
  measurableObjectives: string;
  deliverables: string;
  outOfScope: string;
  creationDate?: string;
}
