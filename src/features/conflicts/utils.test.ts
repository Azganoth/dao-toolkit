import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createResourceConflictGroup,
  createIndexedResource,
} from "@/test/utils/conflicts";

import {
  createIgnoredResourceConflict,
  formatBytes,
  formatConflictType,
  getStaleIgnoredConflicts,
  getVisibleResourceConflictGroups,
  ignoredConflictMatchesGroup,
} from "./utils";

describe("conflicts utilities", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates ignored conflicts from exact source fingerprints", () => {
    vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));
    const group = createResourceConflictGroup();

    const ignored = createIgnoredResourceConflict(group);

    expect(ignored).toMatchObject({
      identityKey: "shared.utc",
      name: "shared.utc",
      ignoredAt: "2026-01-01T12:00:00.000Z",
    });
    expect(ignored.sources.map((source) => source.fingerprint)).toEqual([
      "loose:d:/dao/packages/core/override/a/shared.utc",
      "loose:d:/dao/packages/core/override/b/shared.utc",
    ]);
  });

  it("hides only conflict groups that match an ignored source snapshot", () => {
    const group = createResourceConflictGroup();
    const ignored = createIgnoredResourceConflict(group);
    const changedGroup = createResourceConflictGroup({
      sources: [
        ...group.sources,
        createIndexedResource({
          path: "D:/DAO/packages/core/override/C/shared.utc",
          relativePath: "packages/core/override/C/shared.utc",
          fingerprint: "loose:d:/dao/packages/core/override/c/shared.utc",
        }),
      ],
    });

    expect(ignoredConflictMatchesGroup(ignored, group)).toBe(true);
    expect(ignoredConflictMatchesGroup(ignored, changedGroup)).toBe(false);
    expect(getVisibleResourceConflictGroups([group], [ignored])).toEqual([]);
    expect(getStaleIgnoredConflicts([changedGroup], [ignored])).toEqual([
      ignored,
    ]);
  });

  it("formats compact conflicts labels", () => {
    expect(formatConflictType("looseVsArchive")).toBe("Loose + archive");
    expect(formatBytes(1536)).toMatch(/1[.,]5 KB/);
    expect(formatBytes(null)).toBeNull();
  });
});
