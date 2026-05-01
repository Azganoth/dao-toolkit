import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createChargenData,
  createChargenScanResult,
  setActiveChargenScan,
} from "@/test/utils/chargen";
import { TEST_SCAN_ID } from "@/test/utils/constants";
import { resetChargenStore } from "@/test/utils/stores";
import { useChargenStore } from "./chargen";

const emptyData = createChargenData();

describe("chargen scan store", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-09T13:30:00.000Z"));
    resetChargenStore();
  });

  afterEach(() => {
    resetChargenStore();
    vi.useRealTimers();
  });

  it("stores scan provenance with the frontend scan timestamp", () => {
    const result = createChargenScanResult({
      path: String.raw`\\?\D:\DAO\override`,
      data: emptyData,
    });

    useChargenStore
      .getState()
      .setScan(result, "D:/DAO/packages/core/override/../override");

    expect(useChargenStore.getState().scan).toEqual({
      id: TEST_SCAN_ID,
      path: String.raw`\\?\D:\DAO\override`,
      requestedPath: "D:/DAO/packages/core/override/../override",
      scannedAt: "2026-05-09T13:30:00.000Z",
      data: emptyData,
    });
  });

  it("clears the active scan", () => {
    setActiveChargenScan({ data: emptyData, path: "D:/DAO/override" });

    resetChargenStore();

    expect(useChargenStore.getState().scan).toBeNull();
  });
});
