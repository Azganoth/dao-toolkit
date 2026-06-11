import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/conflicts/api", () => ({
  conflictsApi: {
    scanForResourceConflicts: vi.fn(),
  },
}));

import { conflictsApi } from "@/features/conflicts/api";
import { useConflictsStore } from "@/features/conflicts/stores/conflicts";
import { renderWithUser, screen } from "@/test/utils/react";
import {
  createResourceConflictGroup,
  createIndexedResource,
  createConflictScanResult,
} from "@/test/utils/conflicts";
import { resetAppStores } from "@/test/utils/stores";

import { Conflicts } from "./Conflicts";

describe("Conflicts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAppStores();
  });

  it("scans the configured Dragon Age documents folder and renders conflict groups", async () => {
    vi.mocked(conflictsApi.scanForResourceConflicts).mockResolvedValue(
      createConflictScanResult(),
    );

    const { user } = renderWithUser(<Conflicts />);

    await user.click(await screen.findByRole("button", { name: "Scan" }));

    expect(conflictsApi.scanForResourceConflicts).toHaveBeenCalledWith(
      "C:/Users/Test/Documents/BioWare/Dragon Age",
    );
    expect(await screen.findByText("shared.utc")).toBeVisible();
    expect(
      screen.getAllByText((_, element) =>
        Boolean(element?.textContent?.includes("2 sources")),
      ).length,
    ).toBeGreaterThan(0);
  });

  it("filters conflict groups by query", async () => {
    useConflictsStore.getState().setScan(
      createConflictScanResult({
        conflictGroups: [
          createResourceConflictGroup({ name: "shared.utc" }),
          createResourceConflictGroup({ name: "other.gda" }),
        ],
      }),
    );

    const { user } = renderWithUser(<Conflicts />);

    expect(screen.getByText("shared.utc")).toBeVisible();
    expect(screen.getByText("other.gda")).toBeVisible();

    await user.type(
      screen.getByPlaceholderText("Search name, source, or path..."),
      "other",
    );

    expect(screen.queryByText("shared.utc")).not.toBeInTheDocument();
    expect(screen.getByText("other.gda")).toBeVisible();
  });

  it("ignores and restores conflict groups", async () => {
    useConflictsStore.getState().setScan(createConflictScanResult());

    const { user } = renderWithUser(<Conflicts />);

    await user.click(screen.getByRole("button", { name: "Ignore" }));

    expect(screen.queryByText("shared.utc")).not.toBeInTheDocument();
    expect(screen.getByText("All current conflicts are ignored")).toBeVisible();

    await user.click(screen.getByRole("button", { name: /1 ignored/i }));
    const dialog = screen.getByRole("dialog", {
      name: "Ignored conflict groups",
    });
    await user.click(within(dialog).getByRole("button", { name: "Restore" }));

    expect(screen.getByText("shared.utc")).toBeVisible();
  });

  it("reveals loose files and containing archives", async () => {
    const group = createResourceConflictGroup({
      sources: [
        createIndexedResource({
          sourceKind: "loose",
          path: "D:/DAO/packages/core/override/A/shared.utc",
          relativePath: "packages/core/override/A/shared.utc",
          fingerprint: "loose:a",
        }),
        createIndexedResource({
          sourceKind: "archive",
          path: "D:/DAO/AddIns/Test/core/data/test.erf",
          relativePath: "AddIns/Test/core/data/test.erf",
          fingerprint: "archive:test.erf::shared.utc@128:64",
        }),
      ],
    });
    useConflictsStore
      .getState()
      .setScan(createConflictScanResult({ conflictGroups: [group] }));

    const { user } = renderWithUser(<Conflicts />);

    await user.click(screen.getByRole("button", { name: /shared.utc/i }));
    const revealButtons = screen.getAllByRole("button", {
      name: "Open source location",
    });
    await user.click(revealButtons[0]);
    await user.click(revealButtons[1]);

    await waitFor(() => {
      expect(revealItemInDir).toHaveBeenCalledWith(
        "D:/DAO/packages/core/override/A/shared.utc",
      );
      expect(revealItemInDir).toHaveBeenCalledWith(
        "D:/DAO/AddIns/Test/core/data/test.erf",
      );
    });
  });
});
