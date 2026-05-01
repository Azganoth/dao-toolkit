import { describe, expect, it } from "vitest";

import type { Resource } from "@/types/chargen";
import {
  createModGroupRule,
  getModGroupRootCandidates,
  groupResourcesByMod,
  inferResourceMod,
} from "./resourceMods";

const scanPath =
  "D:/Users/Azganoth/Documents/BioWare/Dragon Age/packages/core/override";

function resource(name: string, relativePath?: string): Resource {
  return {
    name,
    path: relativePath ? `${scanPath}/${relativePath}` : undefined,
  };
}

describe("chargen resource mod grouping", () => {
  it("uses loose override files for resources directly under the scan root", () => {
    const result = inferResourceMod(
      resource("loose.gda", "loose.gda"),
      scanPath,
    );

    expect(result).toMatchObject({
      name: "Loose Override Files",
      isLoose: true,
    });
  });

  it("uses unknown source for resources without a path", () => {
    const result = inferResourceMod(resource("missing-path.gda"), scanPath);

    expect(result).toMatchObject({
      name: "Unknown Source",
      isLoose: true,
    });
  });

  it("prefers broad mod-like folders over generic leaf folders", () => {
    const result = inferResourceMod(
      resource(
        "em_har_example_0",
        "03 Content/Additional Hairs for DA/mhair 4/Em/em_har_example_0.mmh",
      ),
      scanPath,
    );

    expect(result).toMatchObject({
      name: "Additional Hairs for DA",
      sourcePath: "03 Content/Additional Hairs for DA",
      isLoose: false,
    });
  });

  it("penalizes compact generic leaf folders below a stronger mod folder", () => {
    const result = inferResourceMod(
      resource(
        "hm_har_example_0",
        "03 Content/KH Creations/KH_HAIR/Footprint_HM,EM/hm_har_example_0.mmh",
      ),
      scanPath,
    );

    expect(result).toMatchObject({
      name: "KH Creations",
      sourcePath: "03 Content/KH Creations",
      isLoose: false,
    });
  });

  it("does not let weak organizer folders outrank a nearby descriptive group", () => {
    const result = inferResourceMod(
      resource("hm_har_example_0", "03 Content/Tucked Hair/HM/example.mmh"),
      scanPath,
    );

    expect(result).toMatchObject({
      name: "Tucked Hair",
      sourcePath: "03 Content/Tucked Hair",
      isLoose: false,
    });
  });

  it.each([
    {
      relativePath:
        "00 Core/ZZ00 Unofficial Remaster Tints/eyes/t3_eye_green.tnt",
      expectedName: "ZZ00 Unofficial Remaster Tints",
      expectedSourcePath: "00 Core/ZZ00 Unofficial Remaster Tints",
    },
    {
      relativePath:
        "03 Content/The Hairald of Andraste/Nightcrawler_Dreamcatcher/EF/example.mmh",
      expectedName: "The Hairald of Andraste",
      expectedSourcePath: "03 Content/The Hairald of Andraste",
    },
    {
      relativePath: "Ferelden Models/Face And Eye Textures/Morgana/example.dds",
      expectedName: "Morgana",
      expectedSourcePath: "Ferelden Models/Face And Eye Textures/Morgana",
    },
  ])(
    "infers $expectedName from realistic folder samples",
    ({ expectedName, expectedSourcePath, relativePath }) => {
      const result = inferResourceMod(
        resource("example_resource", relativePath),
        scanPath,
      );

      expect(result).toMatchObject({
        name: expectedName,
        sourcePath: expectedSourcePath,
        isLoose: false,
      });
    },
  );

  it("keeps resources in scan order within inferred groups", () => {
    const resources = [
      resource("first", "03 Content/KH Creations/KH_HAIR/first.mmh"),
      resource("second", "03 Content/KH Creations/KH_HAIR/second.mmh"),
    ];

    const groups = groupResourcesByMod(resources, scanPath);

    expect(groups).toHaveLength(1);
    expect(groups[0].resources.map((item) => item.name)).toEqual([
      "first",
      "second",
    ]);
  });

  it("applies the longest saved group rule first", () => {
    const resources = [
      resource("hair", "03 Content/KH Creations/KH_HAIR/hair.mmh"),
    ];
    const rules = [
      createModGroupRule("03 Content/KH Creations"),
      createModGroupRule("03 Content/KH Creations/KH_HAIR"),
    ];

    const groups = groupResourcesByMod(resources, scanPath, rules);

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      name: "KH_HAIR",
      sourcePath: "03 Content/KH Creations/KH_HAIR",
    });
  });

  it("matches saved group rules case-insensitively", () => {
    const resources = [
      resource("hair", "03 Content/KH Creations/KH_HAIR/hair.mmh"),
    ];
    const rules = [createModGroupRule("03 content/kh creations")];

    const groups = groupResourcesByMod(resources, scanPath, rules);

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      name: "kh creations",
      sourcePath: "03 content/kh creations",
    });
  });

  it("does not match saved group rules across partial path segments", () => {
    const resources = [
      resource("hair", "03 Content/KH Creations/KH_HAIR/hair.mmh"),
    ];
    const rules = [createModGroupRule("03 Content/KH")];

    const groups = groupResourcesByMod(resources, scanPath, rules);

    expect(groups).toHaveLength(1);
    expect(groups[0].sourcePath).not.toBe("03 Content/KH");
  });

  it("lists group root candidates from broad to leaf", () => {
    const candidates = getModGroupRootCandidates(
      [resource("hair", "03 Content/KH Creations/KH_HAIR/hair.mmh")],
      scanPath,
    );

    expect(candidates).toEqual([
      createModGroupRule("03 Content"),
      createModGroupRule("03 Content/KH Creations"),
      createModGroupRule("03 Content/KH Creations/KH_HAIR"),
    ]);
  });
});
