import { beforeEach, describe, expect, it } from "vitest";

import { createResourceConflictGroup } from "@/test/utils/conflicts";
import { resetDataStore } from "@/test/utils/stores";
import { useDataStore } from "./data";

describe("data store", () => {
  beforeEach(() => {
    resetDataStore();
  });

  it("stores excluded resources as a unique ordered list", () => {
    useDataStore
      .getState()
      .excludeResources(
        "hm_cps_custom.mop",
        "hm_cps_custom.mop",
        "hf_head.mop",
      );

    expect(useDataStore.getState().excludedResources).toEqual([
      "hm_cps_custom.mop",
      "hf_head.mop",
    ]);
  });

  it("includes selected resources without disturbing the remaining exclusions", () => {
    useDataStore
      .getState()
      .excludeResources("hm_cps_custom.mop", "hf_head.mop", "t3_har_fire");

    useDataStore
      .getState()
      .includeResources("hf_head.mop", "resource-that-is-not-excluded");

    expect(useDataStore.getState().excludedResources).toEqual([
      "hm_cps_custom.mop",
      "t3_har_fire",
    ]);
  });

  it("toggles an individual resource exclusion", () => {
    useDataStore.getState().toggleResource("hm_cps_custom.mop");
    expect(useDataStore.getState().excludedResources).toEqual([
      "hm_cps_custom.mop",
    ]);

    useDataStore.getState().toggleResource("hm_cps_custom.mop");
    expect(useDataStore.getState().excludedResources).toEqual([]);
  });

  it("normalizes, sorts, and removes mod group rules", () => {
    useDataStore
      .getState()
      .upsertModGroupRule(String.raw`03 Content\KH Creations\KH_HAIR`);
    useDataStore
      .getState()
      .upsertModGroupRule(String.raw`01 Core\ZZ00 Unofficial Remaster Tints`);

    expect(useDataStore.getState().modGroupRules).toEqual([
      {
        name: "ZZ00 Unofficial Remaster Tints",
        path: "01 Core/ZZ00 Unofficial Remaster Tints",
      },
      {
        name: "KH_HAIR",
        path: "03 Content/KH Creations/KH_HAIR",
      },
    ]);

    useDataStore
      .getState()
      .removeModGroupRule("03 content/kh creations/kh_hair");

    expect(useDataStore.getState().modGroupRules).toEqual([
      {
        name: "ZZ00 Unofficial Remaster Tints",
        path: "01 Core/ZZ00 Unofficial Remaster Tints",
      },
    ]);
  });

  it("replaces an existing mod group rule with the same normalized path", () => {
    useDataStore
      .getState()
      .upsertModGroupRule(String.raw`03 Content\KH Creations\KH_HAIR`);
    useDataStore
      .getState()
      .upsertModGroupRule("03 content/kh creations/kh_hair/");

    expect(useDataStore.getState().modGroupRules).toEqual([
      {
        name: "kh_hair",
        path: "03 content/kh creations/kh_hair",
      },
    ]);
  });

  it("stores and restores ignored conflicts conflicts", () => {
    const group = createResourceConflictGroup();

    useDataStore.getState().ignoreResourceConflict(group);
    useDataStore.getState().ignoreResourceConflict(group);

    expect(useDataStore.getState().ignoredResourceConflicts).toHaveLength(1);
    expect(useDataStore.getState().ignoredResourceConflicts[0]).toMatchObject({
      identityKey: "shared.utc",
      name: "shared.utc",
    });

    useDataStore
      .getState()
      .restoreResourceConflict(
        useDataStore.getState().ignoredResourceConflicts[0].id,
      );

    expect(useDataStore.getState().ignoredResourceConflicts).toEqual([]);
  });
});
