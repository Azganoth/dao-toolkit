import { waitFor, within } from "@testing-library/react";
import { open } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDataStore } from "@/stores/data";
import { useSettingsStore } from "@/stores/settings";
import { TEST_OVERRIDE_PATH } from "@/test/utils/constants";
import { renderWithUser, screen } from "@/test/utils/react";
import { resetDataStore, setDefaultSettings } from "@/test/utils/stores";

import { Settings } from "./Settings";

describe("Settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDataStore();
    setDefaultSettings();
  });

  it("selects an override folder through the Tauri folder picker", async () => {
    vi.mocked(open).mockResolvedValue("E:/DAO/override");

    const { user } = renderWithUser(<Settings />);

    await user.click(screen.getByRole("button", { name: "Browse" }));

    expect(open).toHaveBeenCalledWith({
      defaultPath: TEST_OVERRIDE_PATH,
      directory: true,
    });
    expect(useSettingsStore.getState().overridePath).toBe("E:/DAO/override");
    expect(screen.getByLabelText("Override Directory")).toHaveValue(
      "E:/DAO/override",
    );
  });

  it("updates interface preferences", async () => {
    const { user } = renderWithUser(<Settings />);

    await user.click(screen.getByRole("button", { name: "Dark" }));
    await user.click(screen.getByRole("checkbox", { name: "Reduced Motion" }));

    expect(useSettingsStore.getState().theme).toBe("dark");
    expect(useSettingsStore.getState().reduceMotion).toBe(true);
  });

  it("lists and removes saved chargen grouping rules", async () => {
    useDataStore
      .getState()
      .upsertModGroupRule("03 Content/KH Creations/KH_HAIR");

    const { user } = renderWithUser(<Settings />);

    expect(screen.getByText("KH_HAIR")).toBeInTheDocument();
    expect(
      screen.getByText("03 Content/KH Creations/KH_HAIR"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Remove group root for KH_HAIR" }),
    );

    expect(useDataStore.getState().modGroupRules).toEqual([]);
    expect(
      screen.getByText("No custom chargen group roots have been saved."),
    ).toBeInTheDocument();
  });

  it("confirms before resetting settings", async () => {
    useSettingsStore.setState({
      overridePath: "E:/custom/override",
      reduceMotion: true,
      theme: "dark",
    });

    const { user } = renderWithUser(<Settings />);

    await user.click(screen.getByRole("button", { name: "Reset" }));

    const dialog = screen.getByRole("dialog", {
      name: "Reset all settings?",
    });
    await user.click(within(dialog).getByRole("button", { name: "Reset" }));

    await waitFor(() => {
      expect(useSettingsStore.getState()).toMatchObject({
        overridePath:
          "C:/Users/Test/Documents/BioWare/Dragon Age/packages/core/override",
        reduceMotion: false,
        theme: "system",
      });
    });
    expect(toast.success).toHaveBeenCalledWith(
      "Settings have been reset to their defaults.",
    );
  });

  it("confirms before clearing persisted application data", async () => {
    useDataStore.getState().excludeResources("hm_cps_head");
    useDataStore.getState().upsertModGroupRule("03 Content/KH Creations");

    const { user } = renderWithUser(<Settings />);

    await user.click(screen.getByRole("button", { name: "Clear Data" }));

    const dialog = screen.getByRole("dialog", {
      name: "Clear all application data?",
    });
    await user.click(
      within(dialog).getByRole("button", { name: "Clear Data" }),
    );

    expect(useDataStore.getState().excludedResources).toEqual([]);
    expect(useDataStore.getState().modGroupRules).toEqual([]);
    expect(toast.success).toHaveBeenCalledWith(
      "All application data has been deleted.",
    );
  });
});
