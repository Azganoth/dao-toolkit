import { createTauriStore } from "@tauri-store/zustand";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface SettingsStore {
  theme: "light" | "dark" | "system";
  overridePath: string | null;

  setTheme: (theme: SettingsStore["theme"]) => void;
  setOverridePath: (path: SettingsStore["overridePath"]) => void;

  reset: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  immer((set, _, store) => ({
    theme: "system",
    overridePath: null,

    setTheme: (theme) =>
      set((state) => {
        state.theme = theme;
      }),
    setOverridePath: (path) =>
      set((state) => {
        state.overridePath = path;
      }),

    reset: () => set(() => store.getInitialState()),
  })),
);

export const settingsStoreTauriHandler = createTauriStore(
  "settings",
  // @ts-expect-error
  useSettingsStore,
);
