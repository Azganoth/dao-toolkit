import { within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./ChargenInspector", () => ({
  ChargenInspector: ({
    onClose,
    target,
  }: {
    onClose: () => void;
    target: null | {
      scanPath: string;
      title: string;
    };
  }) =>
    target ? (
      <section aria-label="chargen inspector">
        <p>{target.title}</p>
        <p>{target.scanPath}</p>
        <button onClick={onClose}>Close inspector</button>
      </section>
    ) : (
      <section aria-label="chargen inspector">No inspector open</section>
    ),
}));

import { useDataStore } from "@/stores/data";
import {
  composeHairResourceGroup,
  composeResourceGroup,
  createChargenData,
} from "@/test/utils/chargen";
import { render, renderWithUser, screen } from "@/test/utils/react";
import { resetDataStore } from "@/test/utils/stores";

import {
  ChargenFaceSummaryCard,
  ChargenSummaryCard,
} from "./ChargenSummaryCard";
import { ChargenSummaryRow } from "./ChargenSummaryRow";
import { ChargenSummary } from "./ChargenSummary";

describe("chargen summary components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDataStore();
  });

  it("renders a summary card title and children", () => {
    render(
      <ChargenSummaryCard title="Shared">
        <p>Shared resources</p>
      </ChargenSummaryCard>,
    );

    expect(screen.getByText("Shared")).toBeInTheDocument();
    expect(screen.getByText("Shared resources")).toBeInTheDocument();
  });

  it("shows custom and excluded counts and opens the row inspector target", async () => {
    const onInspect = vi.fn();
    const resourceGroup = composeResourceGroup(["hm_cps_head", "hm_cps_old"]);
    useDataStore.getState().excludeResources("hm_cps_old");

    const { user } = renderWithUser(
      <ChargenSummaryRow
        title="Heads"
        resourceGroup={resourceGroup}
        onInspect={onInspect}
      />,
    );

    expect(screen.getByText("2 items")).toBeInTheDocument();
    expect(screen.getByText("1 excluded")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Choose custom files for Heads" }),
    );

    expect(onInspect).toHaveBeenCalledWith({
      resources: resourceGroup.custom,
      title: "Heads",
    });
  });

  it("prefixes face row inspector titles with the face group title", async () => {
    const onInspect = vi.fn();

    const { user } = renderWithUser(
      <ChargenFaceSummaryCard
        title="Human Male"
        resourceGroups={{
          beards: composeResourceGroup(["hm_brd_01"]),
          hairs: composeHairResourceGroup(["hm_har_01"]),
          heads: composeResourceGroup(["hm_cps_01"]),
        }}
        onInspect={onInspect}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Choose custom files for Beards" }),
    );

    expect(onInspect).toHaveBeenCalledWith({
      resources: [{ name: "hm_brd_01" }],
      title: "Human Male - Beards",
    });
  });

  it("passes the active scan path into the inspector selection", async () => {
    const data = createChargenData({
      heads: {
        hf: ["hf_cps_01"],
      },
    });

    const { user } = renderWithUser(
      <ChargenSummary data={data} scanPath="D:/DAO/override" />,
    );

    const humanFemaleCard = screen
      .getByText("Human Female")
      .closest('[data-slot="card"]');

    expect(humanFemaleCard).not.toBeNull();

    await user.click(
      within(humanFemaleCard as HTMLElement).getByRole("button", {
        name: "Choose custom files for Heads",
      }),
    );

    expect(screen.getByLabelText("chargen inspector")).toHaveTextContent(
      "Human Female - Heads",
    );
    expect(screen.getByLabelText("chargen inspector")).toHaveTextContent(
      "D:/DAO/override",
    );
  });

  it("closes the active inspector selection", async () => {
    const data = createChargenData({
      heads: {
        hf: ["hf_cps_01"],
      },
    });

    const { user } = renderWithUser(
      <ChargenSummary data={data} scanPath="D:/DAO/override" />,
    );

    const humanFemaleCard = screen
      .getByText("Human Female")
      .closest('[data-slot="card"]');

    expect(humanFemaleCard).not.toBeNull();

    await user.click(
      within(humanFemaleCard as HTMLElement).getByRole("button", {
        name: "Choose custom files for Heads",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Close inspector" }));

    expect(screen.getByLabelText("chargen inspector")).toHaveTextContent(
      "No inspector open",
    );
  });
});
