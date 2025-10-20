// src/types.ts
export type ID = number | string;

export interface Activity {
  id: number; // from API
  wbsId: string; // "2.1", "2.2", ...
  activity: string; // label
}

export interface Resource {
  id: number;
  name: string;
  title: string;
  cost: number;
}

export interface ProjectInit {
  id: number;
  name: string;
  sponsor: string;
  manager: string;
  version: string;
  creationDate?: string;
  businessNeed: string;
  projectGoal: string;
  measurableObjectives: string;
  inScope: string;
  outOfScope: string;
}

export interface WbsRow {
  id: string;
  activityId: number;
  wbsId: string;
  activity: string;
  fxResourceId: string | number | "";
  fxMandays: number;
  abapResourceId: string | number | "";
  abapMandays: number;
}

export interface EstimatePayload {
  resourceId: number;
  activityId: number;
  mandays: number;
}

export interface ProjectCreatePayload {
  name: string;
  sponsor: string;
  manager: string;
  businessNeed: string;
  projectGoal: string;
  measurableObjectives: string;
  outOfScope: string;
  estimates: EstimatePayload[];
}
