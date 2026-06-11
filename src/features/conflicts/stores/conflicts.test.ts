import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createConflictScanResult } from "@/test/utils/conflicts";

import { useConflictsStore } from "./conflicts";

describe("conflicts store", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));
    useConflictsStore.getState().reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stores the latest conflicts snapshot with a frontend scan time", () => {
    const result = createConflictScanResult();

    useConflictsStore.getState().setScan(result);

    expect(useConflictsStore.getState().scan).toMatchObject({
      id: "conflicts-scan-1",
      path: "D:/DAO",
      scannedAt: "2026-01-01T12:00:00.000Z",
      conflictGroups: result.conflictGroups,
    });
  });

  it("clears the session scan", () => {
    useConflictsStore.getState().setScan(createConflictScanResult());

    useConflictsStore.getState().reset();

    expect(useConflictsStore.getState().scan).toBeNull();
  });
});
