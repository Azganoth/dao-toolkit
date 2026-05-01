import { beforeEach, describe, expect, it } from "vitest";

import { useDataStore } from "@/stores/data";
import { createChargenData } from "@/test/utils/chargen";
import { act, renderHook } from "@/test/utils/react";
import { resetDataStore } from "@/test/utils/stores";
import { useChargenStaleExclusions } from "./useChargenStaleExclusions";

const scanData = createChargenData({
  heads: {
    hm: ["hm_cps_current.mop"],
  },
  tints: {
    hair: ["t3_har_current"],
  },
});

describe("useChargenStaleExclusions", () => {
  beforeEach(() => {
    resetDataStore();
  });

  it("detects saved exclusions that are missing from the active scan", () => {
    useDataStore
      .getState()
      .excludeResources(
        "hm_cps_current.mop",
        "missing_head.mop",
        "missing_tint",
      );

    const { result } = renderHook(() =>
      useChargenStaleExclusions({ data: scanData }),
    );

    expect(result.current.staleDisabledResources).toEqual([
      "missing_head.mop",
      "missing_tint",
    ]);
    expect(result.current.staleCount).toBe(2);
  });

  it("removes one stale exclusion while preserving current exclusions", () => {
    useDataStore
      .getState()
      .excludeResources("hm_cps_current.mop", "missing_head.mop");

    const { result } = renderHook(() =>
      useChargenStaleExclusions({ data: scanData }),
    );

    act(() => {
      result.current.removeStaleExclusion("missing_head.mop");
    });

    expect(useDataStore.getState().excludedResources).toEqual([
      "hm_cps_current.mop",
    ]);
  });

  it("clears all stale exclusions while preserving current exclusions", () => {
    useDataStore
      .getState()
      .excludeResources(
        "hm_cps_current.mop",
        "missing_head.mop",
        "missing_tint",
      );

    const { result } = renderHook(() =>
      useChargenStaleExclusions({ data: scanData }),
    );

    act(() => {
      result.current.clearStaleExclusions();
    });

    expect(useDataStore.getState().excludedResources).toEqual([
      "hm_cps_current.mop",
    ]);
  });
});
