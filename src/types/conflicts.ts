export type ResourceSourceKind = "loose" | "archive";

export type ConflictType =
  | "looseVsLoose"
  | "looseVsArchive"
  | "archiveVsArchive";

export interface ConflictScanResult {
  id: string;
  path: string;
  resources: IndexedResource[];
  conflictGroups: ResourceConflictGroup[];
  warnings: ConflictWarning[];
  stats: ConflictStats;
}

export interface IndexedResource {
  id: string;
  identityKey: string;
  name: string;
  extension: string;
  sourceKind: ResourceSourceKind;
  path: string;
  relativePath: string;
  fingerprint: string;
  sourceName: string;
  size: number | null;
  modifiedAt: number | null;
  archive: ArchiveResourceSource | null;
}

export interface ArchiveResourceSource {
  path: string;
  relativePath: string;
  format: string;
  version: string;
  offset: number;
  length: number;
}

export interface ResourceConflictGroup {
  id: string;
  identityKey: string;
  name: string;
  extension: string;
  conflictType: ConflictType;
  sources: IndexedResource[];
  winnerFingerprint: string;
}

export interface ConflictWarning {
  path: string;
  message: string;
}

export interface ConflictStats {
  indexedResources: number;
  conflictGroups: number;
  looseResources: number;
  archiveResources: number;
  warnings: number;
}

export interface IgnoredResourceConflictSource {
  fingerprint: string;
  label: string;
  sourceKind: ResourceSourceKind;
}

export interface IgnoredResourceConflict {
  id: string;
  identityKey: string;
  name: string;
  extension: string;
  sources: IgnoredResourceConflictSource[];
  ignoredAt: string;
}
