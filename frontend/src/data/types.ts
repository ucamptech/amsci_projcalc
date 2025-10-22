export type ModalState = { type: "error" | "success"; message: string };
export interface ProjectInit {
  id?: number;
  name: string;
  sponsor: string;
  manager: string;
  version?: string;
  creationDate?: string;
  businessNeed?: string;
  projectGoal?: string;
  measurableObjectives?: string;
  deliverables?: string;
  outOfScope?: string;
}

export interface WbsRow {
  id?: string;
  activityId: string | number | "";
  wbsId: string;
  activity: string;
  fxId?: number;
  fxResourceId: string | number | "";
  fxMandays: number;
  abapId?: number;
  abapResourceId: string | number | "";
  abapMandays: number;
}

export interface EstimatePayload {
  id?: string | number;
  resourceId: number;
  activityId: number;
  mandays: number;
}

export interface ProjectPayload {
  id?: string | number;
  name: string;
  sponsor: string;
  manager: string;
  businessNeed: string;
  projectGoal: string;
  measurableObjectives: string;
  deliverables: string;
  outOfScope: string;
  estimates: EstimatePayload[];
}
