import { pluralize } from "@/lib/format";
import { useDataStore } from "@/stores/data";
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
  const disabledResources = useDataStore((state) => state.disabled);
  const setResourcesDisabled = useDataStore(
    (state) => state.setResourcesDisabled,
  );

  const staleDisabledResources = useMemo(() => {
    if (!data) return [];

    const customResourceNames = new Set(getCustomResourceNames(data));
    return disabledResources.filter((name) => !customResourceNames.has(name));
  }, [data, disabledResources]);

  const removeStaleExclusion = useCallback(
    (name: string) => {
      setResourcesDisabled([name], false);
      toast.success("Saved exclusion removed", {
        description: name,
      });
    },
    [setResourcesDisabled],
  );

  const clearStaleExclusions = useCallback(() => {
    if (staleDisabledResources.length === 0) return;

    const count = staleDisabledResources.length;
    setResourcesDisabled(staleDisabledResources, false);
    toast.success("Stale exclusions cleared", {
      description: `Removed ${count} saved ${pluralize(count, "exclusion")} not found in this scan.`,
    });
  }, [setResourcesDisabled, staleDisabledResources]);

  return {
    staleDisabledResources,
    staleCount: staleDisabledResources.length,
    removeStaleExclusion,
    clearStaleExclusions,
  };
}

export { useChargenStaleExclusions };
