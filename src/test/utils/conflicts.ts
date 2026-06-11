import type {
  ConflictType,
  ResourceConflictGroup,
  IndexedResource,
  ResourceSourceKind,
  ConflictScanResult,
} from "@/types/conflicts";

export function createIndexedResource(
  overrides: Partial<IndexedResource> = {},
): IndexedResource {
  const name = overrides.name ?? "shared.utc";
  const relativePath =
    overrides.relativePath ?? `packages/core/override/Test/${name}`;
  const sourceKind = overrides.sourceKind ?? "loose";
  const path = overrides.path ?? `D:/DAO/${relativePath}`;
  const fingerprint =
    overrides.fingerprint ??
    `${sourceKind}:${path.replace(/\\/g, "/").toLowerCase()}`;

  return {
    id: fingerprint,
    identityKey: name.toLowerCase(),
    name,
    extension: name.includes(".")
      ? (name.split(".").pop()?.toLowerCase() ?? "")
      : "",
    sourceKind,
    path,
    relativePath,
    fingerprint,
    sourceName: "Test",
    size: sourceKind === "loose" ? 1234 : null,
    modifiedAt: sourceKind === "loose" ? Date.UTC(2026, 0, 1, 12, 0) : null,
    archive:
      sourceKind === "archive"
        ? {
            path,
            relativePath,
            format: "ERF ",
            version: "V2.0",
            offset: 128,
            length: 64,
          }
        : null,
    ...overrides,
  };
}

export function createResourceConflictGroup(
  overrides: Partial<ResourceConflictGroup> & {
    sources?: IndexedResource[];
    name?: string;
    conflictType?: ConflictType;
  } = {},
): ResourceConflictGroup {
  const name = overrides.name ?? "shared.utc";
  const sources = overrides.sources ?? [
    createIndexedResource({
      name,
      relativePath: `packages/core/override/A/${name}`,
      path: `D:/DAO/packages/core/override/A/${name}`,
      fingerprint: `loose:d:/dao/packages/core/override/a/${name}`,
    }),
    createIndexedResource({
      name,
      relativePath: `packages/core/override/B/${name}`,
      path: `D:/DAO/packages/core/override/B/${name}`,
      fingerprint: `loose:d:/dao/packages/core/override/b/${name}`,
    }),
  ];
  const conflictType =
    overrides.conflictType ?? inferConflictTypeFromSources(sources);
  const identityKey = overrides.identityKey ?? name.toLowerCase();

  return {
    id: identityKey,
    identityKey,
    name,
    extension: name.includes(".")
      ? (name.split(".").pop()?.toLowerCase() ?? "")
      : "",
    conflictType,
    sources,
    winnerFingerprint: sources[sources.length - 1]?.fingerprint ?? "",
    ...overrides,
  };
}

export function createConflictScanResult(
  overrides: Partial<ConflictScanResult> = {},
): ConflictScanResult {
  const conflictGroups = overrides.conflictGroups ?? [
    createResourceConflictGroup(),
  ];
  const resources =
    overrides.resources ?? conflictGroups.flatMap((group) => group.sources);

  return {
    id: "conflicts-scan-1",
    path: "D:/DAO",
    resources,
    conflictGroups,
    warnings: [],
    stats: {
      indexedResources: resources.length,
      conflictGroups: conflictGroups.length,
      looseResources: resources.filter(
        (source) => source.sourceKind === "loose",
      ).length,
      archiveResources: resources.filter(
        (source) => source.sourceKind === "archive",
      ).length,
      warnings: 0,
    },
    ...overrides,
  };
}

function inferConflictTypeFromSources(
  sources: IndexedResource[],
): ConflictType {
  const kinds = new Set<ResourceSourceKind>(
    sources.map((source) => source.sourceKind),
  );

  if (kinds.has("loose") && kinds.has("archive")) return "looseVsArchive";
  if (kinds.has("archive")) return "archiveVsArchive";

  return "looseVsLoose";
}
