import type { ChargenData, Resource, ResourceGroup } from "@/types/chargen";

export function getResourceGroups(data: ChargenData) {
  return Object.values(data).flatMap((d) =>
    Object.values(d),
  ) as ResourceGroup<Resource>[];
}

export function getCustomResourceCount(data: ChargenData) {
  return getResourceGroups(data).reduce(
    (total, group) => total + group.custom.length,
    0,
  );
}

export function getExcludedResourceCount(
  data: ChargenData,
  disabled: string[],
) {
  const disabledSet = new Set(disabled);
  return getResourceGroups(data).reduce(
    (total, group) =>
      total +
      group.custom.filter((resource) => disabledSet.has(resource.name)).length,
    0,
  );
}
