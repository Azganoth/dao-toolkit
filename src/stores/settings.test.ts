import { documentDir } from "@tauri-apps/api/path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { setDefaultSettings } from "@/test/utils/stores";
import { useSettingsStore } from "./settings";

const defaultOverridePath =
  "C:/Users/Test/Documents/BioWare/Dragon Age/packages/core/override";

describe("settings store", () => {
  beforeEach(() => {
    setDefaultSettings({ overridePath: null });
  });

  it("initializes the default DAO override path when no path is saved", async () => {
    await useSettingsStore.getState().init();

    expect(useSettingsStore.getState().overridePath).toBe(defaultOverridePath);
  });

  it("does not replace an existing override path during init", async () => {
    useSettingsStore.getState().setOverridePath("D:/DAO/custom-override");
    vi.mocked(documentDir).mockClear();

    await useSettingsStore.getState().init();

    expect(documentDir).not.toHaveBeenCalled();
    expect(useSettingsStore.getState().overridePath).toBe(
      "D:/DAO/custom-override",
    );
  });

  it("resets appearance settings while restoring the default override path", async () => {
    setDefaultSettings({
      overridePath: "D:/DAO/custom-override",
      reduceMotion: true,
      theme: "dark",
    });

    await useSettingsStore.getState().reset();

    expect(useSettingsStore.getState()).toMatchObject({
      overridePath: defaultOverridePath,
      reduceMotion: false,
      theme: "system",
    });
  });

  it("keeps the override path unset when the default documents path cannot be resolved", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    vi.mocked(documentDir).mockRejectedValueOnce(
      new Error("documents folder unavailable"),
    );

    await useSettingsStore.getState().init();

    expect(useSettingsStore.getState().overridePath).toBeNull();
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to get default override directory:",
      expect.any(Error),
    );

    consoleError.mockRestore();
  });
});
