import { pluralize } from "@/lib/format";
import {
  useExcludedResources,
  useResourceExclusionActions,
} from "@/stores/data";
import type { ChargenData, Resource, ResourceGroup } from "@/types/chargen";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";

function getResourceGroups(data: ChargenData) {
  return Object.values(data).flatMap((group) =>
    Object.values(group),
  ) as ResourceGroup<Resource>[];
}

function getCustomResourceNames(data: ChargenData) {
  return getResourceGroups(data).flatMap((group) =>
    group.custom.map((resource) => resource.name),
  );
}

function useChargenStaleExclusions({ data }: { data?: ChargenData }) {
  const excludedResources = useExcludedResources();
  const { excludeResources } = useResourceExclusionActions();

  const staleDisabledResources = useMemo(() => {
    if (!data) return [];

    const customResourceNames = new Set(getCustomResourceNames(data));
    return excludedResources.filter((name) => !customResourceNames.has(name));
  }, [data, excludedResources]);

  const removeStaleExclusion = useCallback(
    (name: string) => {
      excludeResources(name);
      toast.success("Saved exclusion removed", {
        description: name,
      });
    },
    [excludeResources],
  );

  const clearStaleExclusions = useCallback(() => {
    if (staleDisabledResources.length === 0) return;

    const count = staleDisabledResources.length;
    excludeResources(...staleDisabledResources);
    toast.success("Stale exclusions cleared", {
      description: `Removed ${count} saved ${pluralize(count, "exclusion")} not found in this scan.`,
    });
  }, [staleDisabledResources, excludeResources]);

  return {
    staleDisabledResources,
    staleCount: staleDisabledResources.length,
    removeStaleExclusion,
    clearStaleExclusions,
  };
}

export { useChargenStaleExclusions };
