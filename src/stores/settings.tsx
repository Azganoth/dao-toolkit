import { createTauriStore } from "@tauri-store/zustand";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface SettingsStore {
  theme: "light" | "dark" | "system";
  overridePath?: string;

  setTheme: (theme: SettingsStore["theme"]) => void;
  setOverridePath: (path: SettingsStore["overridePath"]) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  immer((set) => ({
    theme: "system",
    overridePath: undefined,

    setTheme: (theme) =>
      set((state) => {
        state.theme = theme;
      }),
    setOverridePath: (path) =>
      set((state) => {
        state.overridePath = path;
      }),
  })),
);

export const settingsStoreTauriHandler = createTauriStore(
  "settings",
  // @ts-expect-error
  useSettingsStore,
);
