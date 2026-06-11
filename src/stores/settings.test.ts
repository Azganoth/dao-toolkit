import { documentDir } from "@tauri-apps/api/path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { setDefaultSettings } from "@/test/utils/stores";
import { useSettingsStore } from "./settings";

const defaultOverridePath =
  "C:/Users/Test/Documents/BioWare/Dragon Age/packages/core/override";
const defaultConflictsPath = "C:/Users/Test/Documents/BioWare/Dragon Age";

describe("settings store", () => {
  beforeEach(() => {
    setDefaultSettings({ conflictsPath: null, overridePath: null });
  });

  it("initializes the default DAO paths when no paths are saved", async () => {
    await useSettingsStore.getState().init();

    expect(useSettingsStore.getState().overridePath).toBe(defaultOverridePath);
    expect(useSettingsStore.getState().conflictsPath).toBe(
      defaultConflictsPath,
    );
  });

  it("does not resolve defaults when both paths already exist during init", async () => {
    useSettingsStore.getState().setOverridePath("D:/DAO/custom-override");
    useSettingsStore.getState().setConflictsPath("D:/DAO");
    vi.mocked(documentDir).mockClear();

    await useSettingsStore.getState().init();

    expect(documentDir).not.toHaveBeenCalled();
    expect(useSettingsStore.getState().overridePath).toBe(
      "D:/DAO/custom-override",
    );
    expect(useSettingsStore.getState().conflictsPath).toBe("D:/DAO");
  });

  it("resets appearance settings while restoring the default override path", async () => {
    setDefaultSettings({
      overridePath: "D:/DAO/custom-override",
      conflictsPath: "D:/DAO",
      reduceMotion: true,
      theme: "dark",
    });

    await useSettingsStore.getState().reset();

    expect(useSettingsStore.getState()).toMatchObject({
      conflictsPath: defaultConflictsPath,
      overridePath: defaultOverridePath,
      reduceMotion: false,
      theme: "system",
    });
  });

  it("keeps default paths unset when the documents path cannot be resolved", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    vi.mocked(documentDir).mockRejectedValueOnce(
      new Error("documents folder unavailable"),
    );

    await useSettingsStore.getState().init();

    expect(useSettingsStore.getState().overridePath).toBeNull();
    expect(useSettingsStore.getState().conflictsPath).toBeNull();
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to get default Dragon Age directory:",
      expect.any(Error),
    );

    consoleError.mockRestore();
  });
});
