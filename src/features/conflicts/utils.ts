import type {
  ConflictType,
  ResourceConflictGroup,
  IgnoredResourceConflict,
  IndexedResource,
  ResourceSourceKind,
} from "@/types/conflicts";

export function getGroupSourceFingerprints(group: ResourceConflictGroup) {
  return group.sources
    .map((source) => source.fingerprint)
    .sort((a, b) => a.localeCompare(b));
}

export function createIgnoredResourceConflict(
  group: ResourceConflictGroup,
): IgnoredResourceConflict {
  return {
    id: `${group.identityKey}:${getGroupSourceFingerprints(group).join("|")}`,
    identityKey: group.identityKey,
    name: group.name,
    extension: group.extension,
    sources: group.sources
      .map((source) => ({
        fingerprint: source.fingerprint,
        label: source.relativePath,
        sourceKind: source.sourceKind,
      }))
      .sort((a, b) => a.fingerprint.localeCompare(b.fingerprint)),
    ignoredAt: new Date().toISOString(),
  };
}

export function ignoredConflictMatchesGroup(
  ignored: IgnoredResourceConflict,
  group: ResourceConflictGroup,
) {
  if (ignored.identityKey !== group.identityKey) return false;

  const ignoredSources = ignored.sources
    .map((source) => source.fingerprint)
    .sort((a, b) => a.localeCompare(b));
  const groupSources = getGroupSourceFingerprints(group);

  return (
    ignoredSources.length === groupSources.length &&
    ignoredSources.every(
      (fingerprint, index) => fingerprint === groupSources[index],
    )
  );
}

export function getMatchingIgnoredConflict(
  group: ResourceConflictGroup,
  ignoredConflicts: IgnoredResourceConflict[],
) {
  return ignoredConflicts.find((ignored) =>
    ignoredConflictMatchesGroup(ignored, group),
  );
}

export function getStaleIgnoredConflicts(
  groups: ResourceConflictGroup[],
  ignoredConflicts: IgnoredResourceConflict[],
) {
  return ignoredConflicts.filter(
    (ignored) =>
      !groups.some((group) => ignoredConflictMatchesGroup(ignored, group)),
  );
}

export function getVisibleResourceConflictGroups(
  groups: ResourceConflictGroup[],
  ignoredConflicts: IgnoredResourceConflict[],
) {
  return groups.filter(
    (group) => !getMatchingIgnoredConflict(group, ignoredConflicts),
  );
}

export function formatConflictType(type: ConflictType) {
  switch (type) {
    case "looseVsLoose":
      return "Loose files";
    case "looseVsArchive":
      return "Loose + archive";
    case "archiveVsArchive":
      return "Archive entries";
  }
}

export function formatSourceKind(kind: ResourceSourceKind) {
  switch (kind) {
    case "loose":
      return "Loose";
    case "archive":
      return "Archive";
  }
}

export function formatBytes(value: number | null) {
  if (value === null) return null;

  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toLocaleString(undefined, {
    maximumFractionDigits: unitIndex === 0 ? 0 : 1,
  })} ${units[unitIndex]}`;
}

export function formatModifiedTime(value: number | null) {
  if (value === null) return null;

  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function sourceMatchesQuery(source: IndexedResource, query: string) {
  if (!query) return true;

  const haystack = [
    source.name,
    source.relativePath,
    source.sourceName,
    source.archive?.relativePath,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}
