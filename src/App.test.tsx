import { waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/layout/TitleBar", () => ({
  TitleBar: () => <header>DAO Toolkit</header>,
}));

vi.mock("@/features/chargen/ChargenGenerator", () => ({
  ChargenGenerator: () => <section>Chargen panel</section>,
}));

vi.mock("@/features/settings/Settings", () => ({
  Settings: () => <section>Settings panel</section>,
}));

vi.mock("@/features/conflicts/Conflicts", () => ({
  Conflicts: () => <section>Conflicts panel</section>,
}));

import { setTheme } from "@tauri-apps/api/app";
import { getCurrentWindow } from "@tauri-apps/api/window";

import App from "./App";
import { dataStoreTauriHandler } from "./stores/data";
import { settingsStoreTauriHandler, useSettingsStore } from "./stores/settings";
import { render, renderWithUser, screen } from "./test/utils/react";
import { setDefaultSettings } from "./test/utils/stores";

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.className = "";
    setDefaultSettings({ overridePath: null });
  });

  it("starts persisted stores, initializes settings, applies the theme, and shows the window", async () => {
    const appWindow = getCurrentWindow();
    vi.mocked(appWindow.theme).mockResolvedValue("dark");

    render(<App />);

    await waitFor(() => {
      expect(settingsStoreTauriHandler.start).toHaveBeenCalled();
      expect(dataStoreTauriHandler.start).toHaveBeenCalled();
      expect(appWindow.show).toHaveBeenCalled();
    });

    expect(useSettingsStore.getState().overridePath).toBe(
      "C:/Users/Test/Documents/BioWare/Dragon Age/packages/core/override",
    );
    expect(setTheme).toHaveBeenCalledWith(null);
    expect(document.documentElement).toHaveClass("dark");
  });

  it("renders the chargen tab first and can switch to conflicts and settings", async () => {
    const { user } = renderWithUser(<App />);

    expect(screen.getByText("Chargen panel")).toBeVisible();

    await user.click(screen.getByRole("tab", { name: "Conflicts" }));

    expect(screen.getByText("Conflicts panel")).toBeVisible();

    await user.click(screen.getByRole("tab", { name: "Settings" }));

    expect(screen.getByText("Settings panel")).toBeVisible();
  });

  it("applies an explicit dark theme without reading the window theme", async () => {
    const appWindow = getCurrentWindow();
    setDefaultSettings({ theme: "dark" });

    render(<App />);

    await waitFor(() => {
      expect(setTheme).toHaveBeenCalledWith("dark");
    });

    expect(appWindow.theme).not.toHaveBeenCalled();
    expect(document.documentElement).toHaveClass("dark");
  });

  it("applies an explicit light theme and removes the dark class", async () => {
    document.documentElement.classList.add("dark");
    setDefaultSettings({ theme: "light" });

    render(<App />);

    await waitFor(() => {
      expect(setTheme).toHaveBeenCalledWith("light");
    });

    expect(document.documentElement).not.toHaveClass("dark");
  });
});
