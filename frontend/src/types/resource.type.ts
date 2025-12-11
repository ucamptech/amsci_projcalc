export type ResourceType = {
  id: number;
  name: string;
};

export type Resource = {
  id: number;
  name: string;
  title: string;
  cost: number;
  resourceTypeId: number;
  resourceType?: ResourceType;
};
