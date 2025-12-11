import type { Activity } from "@/types/activity.type";
import type { Resource } from "@/types/resource.type";

export interface ProjectInit {
  id?: number;
  name: string;
  sponsor: string;
  manager: string;
  version?: string;
  startDate?: string;
  businessNeed?: string;
  projectGoal?: string;
  measurableObjectives?: string;
  deliverables?: string;
  outOfScope?: string;
  pmRate?: number | null;
  pmMandays?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface WBSItem {
  id: number; // estimates.id
  wbsId: string; // estimates.activity.wbsId
  activityId: number; // estimates.activity.id
  fxResourceId?: number | null; // estimates.resource.id
  fxMandays: number; // estimates.mandays
  fxStartDate?: string | null; // estimates.startDate
  abapResourceId?: number | null;
  abapMandays: number;
  abapStartDate?: string | null;
}

export type MinimalWbsItem = {
  wbsId?: string;
  activity?: string;
  fxStartDate?: string | null;
  fxResourceId?: string | number | "";
  fxMandays?: number;
  abapStartDate?: string | null;
  abapResourceId?: string | number | "";
  abapMandays?: number;
};

export interface EstimatePayload {
  id?: number;
  resourceId: number;
  activityId: number;
  mandays: number;
  startDate?: string | null;
  rate?: number | null;
}

export interface Estimate extends EstimatePayload {
  projectId: number;
  activity?: Activity;
  resource?: Resource;
}

export interface ProjectPayload {
  name: string;
  sponsor: string;
  manager: string;
  version?: string;
  startDate?: string;
  businessNeed?: string;
  projectGoal?: string;
  measurableObjectives?: string;
  deliverables?: string;
  outOfScope?: string;
  pmRate?: number | null;
  pmMandays?: number | null;
  estimates: EstimatePayload[];
}

export interface Project extends Omit<ProjectPayload, "estimates"> {
  id: number;
  createdAt?: string;
  updatedAt?: string;
  estimates: Estimate[];
}

export interface ProjectDetail {
  pmRate: number;
  pmMandays: number;
  id?: number;
  name: string;
  sponsor: string;
  manager: string;
  version?: string;
  startDate?: string;
  businessNeed?: string;
  projectGoal?: string;
  measurableObjectives?: string;
  deliverables?: string;
  outOfScope?: string;
  createdAt?: string;
  updatedAt?: string;
  estimates?: Estimate[];
}

export type MinimalProject = {
  name: string;
  sponsor: string;
  manager: string;
  version?: string;
  startDate?: string;
  businessNeed?: string;
  projectGoal?: string;
  measurableObjectives?: string;
  deliverables?: string;
  outOfScope?: string;
};

export interface SignersInit {
  role: string;
  name: string;
  signature: string;
  date: string;
}

export interface CostByResource {
  resourceId: number;
  resourceName: string;
  resourceTitle: string;
  rate: number;
  mandays: number;
  subtotal: number;
}
