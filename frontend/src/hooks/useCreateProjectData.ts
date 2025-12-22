import { useEffect, type Dispatch, type SetStateAction } from "react";
import {
  DEFAULT_ACTIVITIES,
  DEFAULT_RESOURCES,
  RESOURCE_TYPE,
  WBSITEMS_INIT,
} from "@/lib/constants/project";
import { fetchActivities } from "@/lib/api/activities.api";
import { fetchResources } from "@/lib/api/resources.api";
import { getProjectById } from "@/lib/api/projects.api";
import type { Activity } from "@/types/activity.type";
import type { Resource } from "@/types/resource.type";
import type { ProjectInit, WBSItem } from "@/types/project.type";
import { toast } from "sonner";

type WithBusy = <T>(fn: () => Promise<T>, message?: string) => Promise<T>;

type ReferenceDataParams = {
  withBusy: WithBusy;
  setActivities: Dispatch<SetStateAction<Activity[]>>;
  setResources: Dispatch<SetStateAction<Resource[]>>;
};

type LoadProjectParams = {
  hasId: boolean;
  id?: string;
  withBusy: WithBusy;
  setProject: Dispatch<SetStateAction<ProjectInit>>;
  setWbsItems: Dispatch<SetStateAction<WBSItem[]>>;
  setRateOverrides?: Dispatch<SetStateAction<Record<string, number>>>;
  setMandayOverrides?: Dispatch<SetStateAction<Record<string, number>>>;
  onMissingProject?: () => void;
};

export function useLoadReferenceData({
  withBusy,
  setActivities,
  setResources,
}: ReferenceDataParams) {
  useEffect(() => {
    let cancelled = false;

    const loadReferenceData = async () => {
      try {
        const [activitiesRes, resourcesRes] = await withBusy(
          () => Promise.all([fetchActivities(), fetchResources()]),
          "Loading reference data...",
        );
        if (cancelled) return;
        setActivities(activitiesRes.data ?? DEFAULT_ACTIVITIES);
        setResources(resourcesRes.data ?? DEFAULT_RESOURCES);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to load reference data";
        toast.error(message);
      }
    };

    void loadReferenceData();

    return () => {
      cancelled = true;
    };
  }, [setActivities, setResources, withBusy]);
}

export function useLoadProject({
  hasId,
  id,
  withBusy,
  setProject,
  setWbsItems,
  setRateOverrides,
  setMandayOverrides,
  onMissingProject,
}: LoadProjectParams) {
  useEffect(() => {
    if (!hasId) return;

    let cancelled = false;

    const loadProject = async () => {
      try {
        const proj = await withBusy(
          () => getProjectById(Number(id)),
          "Loading project...",
        );

        if (!proj || cancelled) return;
        console.log("Retrieved project: ", proj);

        setProject({
          id: proj.id,
          name: proj.name ?? "",
          sponsor: proj.sponsor ?? "",
          manager: proj.manager ?? "",
          version: proj.version ?? "",
          startDate: proj.startDate ?? "",
          businessNeed: proj.businessNeed ?? "",
          projectGoal: proj.projectGoal ?? "",
          measurableObjectives: proj.measurableObjectives ?? "",
          deliverables: proj.deliverables ?? "",
          outOfScope: proj.outOfScope ?? "",
          pmRate:
            proj.pmRate !== undefined && proj.pmRate !== null
              ? Number(proj.pmRate)
              : null,
          pmMandays:
            proj.pmMandays !== undefined && proj.pmMandays !== null
              ? Number(proj.pmMandays)
              : null,
          projectUid: proj.projectUid ?? null,
          isCurrent: proj.isCurrent ?? false,
          createdAt: proj.createdAt ?? "",
          updatedAt: proj.updatedAt ?? "",
        });

        setWbsItems(() => {
          if (!proj.estimates?.length) return WBSITEMS_INIT;

          const grouped = new Map<number, WBSItem>();

          proj.estimates.forEach((estimate, idx) => {
            const activityId = estimate.activityId ?? estimate.activity?.id;
            if (!activityId) return;

            const existing =
              grouped.get(activityId) ??
              ({
                id: estimate.id ?? idx + 1,
                wbsId: estimate.activity?.wbsId ?? `${activityId}.0`,
                activityId,
                fxResourceId: null,
                fxStartDate: "",
                fxMandays: 0,
                abapResourceId: null,
                abapStartDate: "",
                abapMandays: 0,
              } satisfies WBSItem);

            const resourceType = estimate.resource?.resourceType?.name;
            const startDate = estimate.startDate
              ? String(estimate.startDate)
              : "";

            if (resourceType === RESOURCE_TYPE.Functional) {
              existing.fxResourceId =
                estimate.resourceId ?? existing.fxResourceId;
              existing.fxMandays = estimate.mandays ?? existing.fxMandays;
              existing.fxStartDate = startDate;
            } else if (resourceType === RESOURCE_TYPE.Technical) {
              existing.abapResourceId =
                estimate.resourceId ?? existing.abapResourceId;
              existing.abapMandays = estimate.mandays ?? existing.abapMandays;
              existing.abapStartDate = startDate;
            }

            if (!existing.id) {
              existing.id = estimate.id ?? idx + 1;
            }

            grouped.set(activityId, existing);
          });

          return grouped.size > 0
            ? Array.from(grouped.values())
            : WBSITEMS_INIT;
        });

        // Seed rate and PM manday overrides
        if (setRateOverrides) {
          const rateMap: Record<string, number> = {};
          if (proj.pmRate !== undefined && proj.pmRate !== null) {
            rateMap.projectManager = Number(proj.pmRate);
          }

          proj.estimates?.forEach((estimate) => {
            const resourceType = estimate.resource?.resourceType?.name;
            const rateVal =
              estimate.rate !== undefined && estimate.rate !== null
                ? Number(estimate.rate)
                : undefined;
            if (!rateVal) return;

            if (resourceType === RESOURCE_TYPE.Functional && estimate.resourceId) {
              rateMap[`fx-${estimate.resourceId}`] = rateVal;
            } else if (
              resourceType === RESOURCE_TYPE.Technical &&
              estimate.resourceId
            ) {
              rateMap[`abap-${estimate.resourceId}`] = rateVal;
            }
          });

          setRateOverrides((prev) => ({ ...prev, ...rateMap }));
        }

        if (
          setMandayOverrides &&
          proj.pmMandays !== undefined &&
          proj.pmMandays !== null
        ) {
          setMandayOverrides((prev) => ({
            ...prev,
            projectManager: Number(proj.pmMandays),
          }));
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load project";
        toast.error(message);
        onMissingProject?.();
      }
    };

    void loadProject();

    return () => {
      cancelled = true;
    };
  }, [hasId, id, setProject, setWbsItems, withBusy]);
}
