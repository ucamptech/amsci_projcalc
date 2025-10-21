export interface ProjectInit {
  id?: number;
  name: string;
  sponsor: string;
  manager: string;
  version: string;
  creationDate?: string;
  businessNeed: string;
  projectGoal: string;
  measurableObjectives: string;
  deliverables: string;
  outOfScope: string;
}

export interface WbsRow {
  id: string;
  activityId: string | number | "";
  wbsId: string;
  activity: string;
  fxResourceId: string | number | "";
  fxMandays: number;
  abapResourceId: string | number | "";
  abapMandays: number;
}

export interface EstimatePayload {
  id?: string | number;
  resourceId: number;
  activityId: number;
  mandays: number;
  activity?: string;
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
