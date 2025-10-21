import type { Activity, ProjectInit, Resource } from "./types";

export const DEFAULT_ACTIVITIES: Activity[] = [
  { id: 1, wbsId: "2.1", activity: "Requirements Gathering" },
  { id: 2, wbsId: "2.2", activity: "Functional Design" },
  { id: 3, wbsId: "3.1", activity: "Code Development" },
  { id: 4, wbsId: "4.1", activity: "Unit Testing" },
  { id: 5, wbsId: "5.1", activity: "UAT Support" },
  { id: 6, wbsId: "6.1", activity: "Post PRD Support" },
];

export const DEFAULT_RESOURCES: Resource[] = [
  {
    id: 1,
    name: "Test Resource 1",
    title: "Functional Consultant",
    cost: 100.0,
  },
  {
    id: 2,
    name: "Test Resource 2",
    title: "Technical Consultant",
    cost: 100.0,
  },
];

export const DEFAULT_PROJECTS: ProjectInit[] = [
  {
    id: 1,
    name: "Project A",
    sponsor: "Poseidon",
    manager: "Aphrodite",
    version: "v1.0",
    creationDate: "2025-10-17",
    businessNeed: "",
    projectGoal: "",
    measurableObjectives: "",
    inScope: "",
    outOfScope: "",
  },
  {
    id: 2,
    name: "Project B",
    sponsor: "Athena",
    manager: "Medusa",
    version: "v1.0",
    creationDate: "2025-10-17",
    businessNeed: "",
    projectGoal: "",
    measurableObjectives: "",
    inScope: "",
    outOfScope: "",
  },
  {
    id: 3,
    name: "Project B",
    sponsor: "Athena",
    manager: "Medusa",
    version: "v2.0",
    creationDate: "2025-10-17",
    businessNeed: "",
    projectGoal: "",
    measurableObjectives: "",
    inScope: "",
    outOfScope: "",
  },
];
