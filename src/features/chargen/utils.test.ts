import { describe, expect, it } from "vitest";

import { createChargenData } from "@/test/utils/chargen";
import { getCustomResourceCount, getExcludedResourceCount } from "./utils";

const chargenData = createChargenData({
  heads: {
    hm: ["hm_head_a.mop"],
    hf: ["hf_head_a.mop", "hf_head_b.mop"],
  },
  hairs: {
    hf: ["hf_har_a_0"],
  },
  beards: {
    hm: ["hm_brd_a_0"],
  },
  tints: {
    hair: ["t3_har_red"],
  },
  textures: {
    tattoo: ["uh_tat_a_0t"],
  },
});

describe("chargen data utilities", () => {
  it("counts custom resources across all chargen groups", () => {
    expect(getCustomResourceCount(chargenData)).toBe(7);
  });

  it("counts only excluded resources present in the current scan data", () => {
    expect(
      getExcludedResourceCount(
        chargenData,
        new Set(["hf_head_b.mop", "t3_har_red", "stale_resource"]),
      ),
    ).toBe(2);
  });
});
