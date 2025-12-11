import type { ProjectInit } from "@/types/project.type";

export const EMPTY_PROJECT: ProjectInit = {
  name: "",
  sponsor: "",
  manager: "",
  version: "v1.0",
  businessNeed: "",
  projectGoal: "",
  measurableObjectives: "",
  deliverables: "",
  outOfScope: "",
};

export const WBSITEMS_INIT = [
  {
    id: 1,
    wbsId: "2.1",
    activityId: 1,
    fxResourceId: null,
    fxStartDate: "",
    fxMandays: 0,
    abapResourceId: null,
    abapStartDate: "",
    abapMandays: 0,
  },
];

export const DEFAULT_ACTIVITIES = [
  {
    id: 1,
    wbsId: "2.1",
    activity: "Requirements Gathering",
  },
  {
    id: 2,
    wbsId: "2.2",
    activity: "Functional Design",
  },
  {
    id: 3,
    wbsId: "3.1",
    activity: "Code Development",
  },
  {
    id: 4,
    wbsId: "4.1",
    activity: "Unit Testing",
  },
  {
    id: 5,
    wbsId: "5.1",
    activity: "UAT Support",
  },
  {
    id: 6,
    wbsId: "6.1",
    activity: "Post PRD Support",
  },
];

export const DEFAULT_RESOURCES = [
  {
    id: 1,
    name: "Test Resource 1",
    title: "Functional Consultant",
    cost: 100,
    resourceTypeId: 1,
    resourceType: {
      id: 1,
      name: "Functional",
    },
  },
  {
    id: 2,
    name: "Test Resource 2",
    title: "Technical Consultant",
    cost: 100,
    resourceTypeId: 2,
    resourceType: {
      id: 2,
      name: "Technical",
    },
  },
  {
    id: 3,
    name: "ABAP Developer",
    title: "Technical Consultant",
    cost: 100,
    resourceTypeId: 2,
    resourceType: {
      id: 2,
      name: "Technical",
    },
  },
  {
    id: 4,
    name: "Functional Lead",
    title: "Functional Consultant",
    cost: 100,
    resourceTypeId: 1,
    resourceType: {
      id: 1,
      name: "Functional",
    },
  },
  {
    id: 5,
    name: "Project Manager 1",
    title: "Project Manager",
    cost: 100,
    resourceTypeId: 3,
    resourceType: {
      id: 3,
      name: "Manager",
    },
  },
];

export const RESOURCE_TYPE = {
  Functional: "Functional",
  Technical: "Technical",
  Manager: "Manager",
};
