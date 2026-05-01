import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDataStore } from "@/stores/data";
import { renderWithUser, screen } from "@/test/utils/react";
import { resetDataStore } from "@/test/utils/stores";
import type { Resource } from "@/types/chargen";
import {
  ChargenInspector,
  type ChargenInspectorTarget,
} from "./ChargenInspector";

const scanPath =
  "D:/Users/Azganoth/Documents/BioWare/Dragon Age/packages/core/override";

function resource(name: string, relativePath: string): Resource {
  return {
    name,
    path: `${scanPath}/${relativePath}`,
  };
}

function createTarget(): ChargenInspectorTarget {
  return {
    scanPath,
    title: "Human male heads",
    resources: [
      resource(
        "kh_hair_footprint",
        "03 Content/KH Creations/KH_HAIR/Footprint_HM,EM/kh_hair_footprint.mmh",
      ),
      resource(
        "kh_hair_anda",
        "03 Content/KH Creations/KH_HAIR/Anda_HM/kh_hair_anda.mmh",
      ),
      resource("loose_head", "loose_head.mop"),
    ],
  };
}

describe("ChargenInspector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDataStore();
  });

  it("renders grouped resources collapsed by default and supports expand/collapse all", async () => {
    const { user } = renderWithUser(
      <ChargenInspector target={createTarget()} />,
    );

    expect(
      screen.getByText(
        /3 resources from 2 detected mods\. Review custom resources by detected mod/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("KH Creations")).toBeInTheDocument();
    expect(screen.getByText("Loose Override Files")).toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", { name: "Exclude kh_hair_footprint" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Expand all groups" }));

    expect(
      screen.getByRole("checkbox", { name: "Exclude kh_hair_footprint" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Exclude loose_head" }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Collapse all groups" }),
    );

    expect(
      screen.queryByRole("checkbox", { name: "Exclude kh_hair_footprint" }),
    ).not.toBeInTheDocument();
  });

  it("excludes all resources in a detected mod group", async () => {
    const { user } = renderWithUser(
      <ChargenInspector target={createTarget()} />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Exclude all resources from KH Creations",
      }),
    );

    expect(useDataStore.getState().excludedResources).toEqual([
      "kh_hair_footprint",
      "kh_hair_anda",
    ]);
  });

  it("persists an inline group-root rule selected from parent folders", async () => {
    const { user } = renderWithUser(
      <ChargenInspector target={createTarget()} />,
    );

    await user.click(
      screen.getByRole("combobox", {
        name: "Choose group root for KH Creations",
      }),
    );
    await user.click(
      screen.getByRole("option", {
        name: "03 Content/KH Creations/KH_HAIR",
      }),
    );

    expect(useDataStore.getState().modGroupRules).toContainEqual({
      name: "KH_HAIR",
      path: "03 Content/KH Creations/KH_HAIR",
    });
  });
});
