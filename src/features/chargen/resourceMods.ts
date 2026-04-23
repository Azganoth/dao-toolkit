import { normalizePath, PATH_SEPARATOR, splitPath } from "@/lib/paths";
import type { Resource } from "@/types/chargen";

const LOOSE_OVERRIDE_FILES = "Loose Override Files";
const UNKNOWN_SOURCE = "Unknown Source";

const GENERIC_FOLDER_NAMES = new Set([
  "asset",
  "assets",
  "brow",
  "brows",
  "chargen",
  "eye",
  "eyes",
  "face",
  "faces",
  "file",
  "files",
  "hair",
  "hairs",
  "makeup",
  "material",
  "materials",
  "mesh",
  "meshes",
  "model",
  "models",
  "morph",
  "morphs",
  "override",
  "skin",
  "skins",
  "tattoo",
  "tattoos",
  "texture",
  "textures",
  "tint",
  "tints",
  "df",
  "dm",
  "ef",
  "em",
  "hf",
  "hm",
  "dwarf female",
  "dwarf male",
  "elf female",
  "elf male",
  "human female",
  "human male",
]);

const WEAK_ORGANIZER_FOLDER_NAMES = new Set([
  "appearance",
  "compat patches",
  "compatibility patches",
  "content",
  "core",
  "docs",
  "docs utils",
  "gameplay",
  "override",
  "utils",
]);

const TRANSIENT_FOLDER_NAMES = new Set([
  "backup",
  "backups",
  "dump",
  "extract",
  "extracted",
  "install",
  "installed",
  "new",
  "old",
  "temp",
  "tmp",
]);

const MOD_NAME_HINTS = [
  "additional",
  "better",
  "collection",
  "dao",
  "dragon age",
  "expanded",
  "fix",
  "fixed",
  "improved",
  "mod",
  "overhaul",
  "pack",
  "redesign",
  "remaster",
  "tweak",
  "unofficial",
];

const GENERIC_FOLDER_PATTERNS = [/^(hair|hairs)\s*\d+$/];
const GENERIC_COMPACT_TOKEN_PATTERNS = [/^[a-z]hairs?$/i, /^hairs?\d+$/i];

const MOD_SOURCE_SCORE = {
  distanceStep: 8,
  exactGeneric: 90,
  genericCompactToken: 34,
  exactWeakOrganizer: 45,
  genericToken: 28,
  longName: 6,
  modNameHint: 14,
  multiWord: 10,
  titleShape: 14,
  weakOrganizerToken: 24,
};

export interface ResourceModGroup<T extends Resource = Resource> {
  id: string;
  name: string;
  sourcePath?: string;
  isLoose: boolean;
  resources: T[];
}

export interface ModGroupRule {
  path: string;
  name: string;
}

type ResourceModGroupSource = Omit<ResourceModGroup, "resources">;

interface NormalizedScanRoot {
  path: string;
  lowerPath: string;
}

interface PreparedModGroupRule extends ModGroupRule {
  lowerPath: string;
  depth: number;
}

function normalizeSegment(segment: string) {
  return segment
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function getSegmentTokens(segment: string) {
  return normalizeSegment(segment)
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);
}

function isWeakOrganizerSegment(segment: string) {
  return WEAK_ORGANIZER_FOLDER_NAMES.has(normalizeSegment(segment));
}

function hasWeakOrganizerToken(segment: string) {
  const tokens = getSegmentTokens(segment);

  return Array.from(WEAK_ORGANIZER_FOLDER_NAMES).some((name) =>
    name.split(" ").some((token) => tokens.includes(token)),
  );
}

function isExactGenericSegment(segment: string) {
  const normalized = normalizeSegment(segment);

  return (
    GENERIC_FOLDER_NAMES.has(normalized) ||
    TRANSIENT_FOLDER_NAMES.has(normalized) ||
    GENERIC_FOLDER_PATTERNS.some((pattern) => pattern.test(normalized))
  );
}

function countWords(segment: string) {
  return getSegmentTokens(segment).length;
}

function hasModNameHint(segment: string) {
  const normalized = normalizeSegment(segment);

  return MOD_NAME_HINTS.some((hint) => normalized.includes(hint));
}

function hasGenericToken(segment: string) {
  const tokens = getSegmentTokens(segment);

  return tokens.some((token) => GENERIC_FOLDER_NAMES.has(token));
}

function hasGenericCompactToken(segment: string) {
  const tokens = getSegmentTokens(segment);

  return tokens.some((token) =>
    GENERIC_COMPACT_TOKEN_PATTERNS.some((pattern) => pattern.test(token)),
  );
}

function hasTitleShape(segment: string) {
  if (!/\s/.test(segment)) return false;

  const words = segment.replace(/[_-]+/g, " ").split(/\s+/).filter(Boolean);

  return words.length >= 2 && words.some((word) => /^[A-Z][a-z]/.test(word));
}

function scoreModCandidate(
  segment: string,
  index: number,
  parentCount: number,
) {
  const normalized = normalizeSegment(segment);
  if (!normalized || /^[a-z]:$/.test(normalized)) {
    return null;
  }

  const distanceFromFile = parentCount - index - 1;
  let score = 100 - distanceFromFile * MOD_SOURCE_SCORE.distanceStep;
  const words = countWords(segment);

  if (isExactGenericSegment(segment)) score -= MOD_SOURCE_SCORE.exactGeneric;
  else if (hasGenericToken(segment)) score -= MOD_SOURCE_SCORE.genericToken;
  else if (hasGenericCompactToken(segment)) {
    score -= MOD_SOURCE_SCORE.genericCompactToken;
  }

  if (isWeakOrganizerSegment(segment)) {
    score -= MOD_SOURCE_SCORE.exactWeakOrganizer;
  } else if (hasWeakOrganizerToken(segment)) {
    score -= MOD_SOURCE_SCORE.weakOrganizerToken;
  }

  if (words >= 2) score += MOD_SOURCE_SCORE.multiWord;
  if (words >= 4) score += MOD_SOURCE_SCORE.longName;
  if (hasTitleShape(segment)) score += MOD_SOURCE_SCORE.titleShape;
  if (hasModNameHint(segment)) score += MOD_SOURCE_SCORE.modNameHint;

  return score;
}

function createScanRoot(scanPath: string): NormalizedScanRoot {
  const path = normalizePath(scanPath);

  return {
    path,
    lowerPath: path.toLowerCase(),
  };
}

function getRelativeParentSegments(
  resourcePath: string,
  scanRoot: NormalizedScanRoot,
) {
  const resource = normalizePath(resourcePath);
  const resourceLower = resource.toLowerCase();

  if (resourceLower.startsWith(`${scanRoot.lowerPath}${PATH_SEPARATOR}`)) {
    return {
      parentSegments: resource
        .slice(scanRoot.path.length + PATH_SEPARATOR.length)
        .split(PATH_SEPARATOR)
        .filter(Boolean)
        .slice(0, -1),
    };
  }

  const absoluteSegments = splitPath(resourcePath);
  const overrideIndex = absoluteSegments
    .map(normalizeSegment)
    .lastIndexOf("override");

  if (overrideIndex !== -1) {
    return {
      parentSegments: absoluteSegments.slice(overrideIndex + 1, -1),
    };
  }

  return {
    parentSegments: absoluteSegments.slice(0, -1),
  };
}

function toSourcePath(parentSegments: string[], index: number) {
  return parentSegments.slice(0, index + 1).join(PATH_SEPARATOR);
}

function normalizeRulePath(path: string) {
  return splitPath(path).join(PATH_SEPARATOR);
}

export function createModGroupRule(path: string): ModGroupRule {
  const normalizedPath = normalizeRulePath(path);
  const name = splitPath(normalizedPath).at(-1) ?? normalizedPath;

  return {
    path: normalizedPath,
    name,
  };
}

function createGroupId(sourcePath: string | undefined, name: string) {
  return sourcePath ? `path:${sourcePath}` : `name:${name}`;
}

function prepareModGroupRules(rules: ModGroupRule[]) {
  return rules
    .map((rule) => {
      const normalized = createModGroupRule(rule.path);
      const segments = splitPath(normalized.path);

      return {
        ...normalized,
        lowerPath: normalized.path.toLowerCase(),
        depth: segments.length,
      };
    })
    .filter((rule) => rule.path.length > 0)
    .sort((a, b) => {
      if (b.depth !== a.depth) return b.depth - a.depth;
      return b.path.length - a.path.length;
    });
}

function findMatchingRule(
  parentSegments: string[],
  rules: PreparedModGroupRule[],
) {
  const parentPath = parentSegments.join(PATH_SEPARATOR);
  const lowerParentPath = parentPath.toLowerCase();

  return rules.find(
    (rule) =>
      lowerParentPath === rule.lowerPath ||
      lowerParentPath.startsWith(`${rule.lowerPath}${PATH_SEPARATOR}`),
  );
}

function inferFromParentSegments(
  parentSegments: string[],
): ResourceModGroupSource {
  if (parentSegments.length === 0) {
    return {
      id: createGroupId(undefined, LOOSE_OVERRIDE_FILES),
      name: LOOSE_OVERRIDE_FILES,
      isLoose: true,
    };
  }

  const candidates = parentSegments
    .map((segment, index) => ({
      index,
      score: scoreModCandidate(segment, index, parentSegments.length),
      segment,
    }))
    .filter(
      (
        candidate,
      ): candidate is { index: number; score: number; segment: string } =>
        candidate.score !== null,
    )
    .sort((a, b) =>
      b.score !== a.score ? b.score - a.score : b.index - a.index,
    );

  if (candidates.length === 0) {
    return {
      id: createGroupId(undefined, LOOSE_OVERRIDE_FILES),
      name: LOOSE_OVERRIDE_FILES,
      isLoose: true,
    };
  }

  const bestCandidate = candidates[0];
  const name = bestCandidate.segment;
  const sourcePath = toSourcePath(parentSegments, bestCandidate.index);

  return {
    id: createGroupId(sourcePath, name),
    name,
    sourcePath,
    isLoose: false,
  };
}

export function inferResourceMod(resource: Resource, scanPath: string) {
  return inferResourceModFromScanRoot(resource, createScanRoot(scanPath));
}

function inferResourceModFromScanRoot(
  resource: Resource,
  scanRoot: NormalizedScanRoot,
  rules: PreparedModGroupRule[] = [],
) {
  if (!resource.path) {
    return {
      id: createGroupId(undefined, UNKNOWN_SOURCE),
      name: UNKNOWN_SOURCE,
      isLoose: true,
    };
  }

  const { parentSegments } = getRelativeParentSegments(resource.path, scanRoot);
  const rule = findMatchingRule(parentSegments, rules);

  if (rule) {
    return {
      id: createGroupId(rule.path, rule.name),
      name: rule.name,
      sourcePath: rule.path,
      isLoose: false,
    };
  }

  return inferFromParentSegments(parentSegments);
}

export function groupResourcesByMod<T extends Resource>(
  resources: T[],
  scanPath: string,
  rules: ModGroupRule[] = [],
) {
  const groups = new Map<string, ResourceModGroup<T>>();
  const scanRoot = createScanRoot(scanPath);
  const preparedRules = prepareModGroupRules(rules);

  for (const resource of resources) {
    const inference = inferResourceModFromScanRoot(
      resource,
      scanRoot,
      preparedRules,
    );
    const group = groups.get(inference.id);

    if (group) {
      group.resources.push(resource);
    } else {
      groups.set(inference.id, {
        id: inference.id,
        name: inference.name,
        sourcePath: inference.sourcePath,
        isLoose: inference.isLoose,
        resources: [resource],
      });
    }
  }

  return Array.from(groups.values());
}

export function getModGroupRootCandidates(
  resources: Resource[],
  scanPath: string,
) {
  const scanRoot = createScanRoot(scanPath);
  const candidates = new Map<string, ModGroupRule & { depth: number }>();

  for (const resource of resources) {
    if (!resource.path) continue;

    const { parentSegments } = getRelativeParentSegments(
      resource.path,
      scanRoot,
    );

    parentSegments.forEach((_, index) => {
      const path = toSourcePath(parentSegments, index);
      if (!path || candidates.has(path)) return;

      candidates.set(path, {
        ...createModGroupRule(path),
        depth: index + 1,
      });
    });
  }

  return Array.from(candidates.values())
    .sort((a, b) => {
      if (a.depth !== b.depth) return a.depth - b.depth;
      return a.path.localeCompare(b.path);
    })
    .map(({ name, path }) => ({ name, path }));
}
