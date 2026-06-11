import { documentDir, join } from "@tauri-apps/api/path";
import { createTauriStore } from "@tauri-store/zustand";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export interface SettingsStore {
  theme: "light" | "dark" | "system";
  overridePath: string | null;
  conflictsPath: string | null;
  reduceMotion: boolean;

  setTheme: (theme: SettingsStore["theme"]) => void;
  setOverridePath: (path: SettingsStore["overridePath"]) => void;
  setConflictsPath: (path: SettingsStore["conflictsPath"]) => void;
  setReduceMotion: (value: boolean) => void;

  reset: () => Promise<void>;
  init: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>()(
  immer((set, get, store) => ({
    theme: "system",
    overridePath: null,
    conflictsPath: null,
    reduceMotion: false,

    setTheme: (theme) =>
      set((state) => {
        state.theme = theme;
      }),
    setOverridePath: (path) =>
      set((state) => {
        state.overridePath = path;
      }),
    setConflictsPath: (path) =>
      set((state) => {
        state.conflictsPath = path;
      }),
    setReduceMotion: (value) =>
      set((state) => {
        state.reduceMotion = value;
      }),

    reset: async () => {
      const defaultDragonAgePath = await getDefaultDragonAgePath();
      const defaultOverridePath = defaultDragonAgePath
        ? await getDefaultOverridePath(defaultDragonAgePath)
        : null;

      set(() => {
        return {
          ...store.getInitialState(),
          overridePath: defaultOverridePath,
          conflictsPath: defaultDragonAgePath,
        };
      });
    },
    init: async () => {
      if (get().overridePath && get().conflictsPath) {
        return;
      }

      const defaultDragonAgePath = await getDefaultDragonAgePath();
      const defaultOverridePath = defaultDragonAgePath
        ? await getDefaultOverridePath(defaultDragonAgePath)
        : null;
      set((state) => {
        state.overridePath ??= defaultOverridePath;
        state.conflictsPath ??= defaultDragonAgePath;
      });
    },
  })),
);

export const settingsStoreTauriHandler = createTauriStore(
  "settings",
  useSettingsStore as never,
  {
    saveOnChange: true,
  },
);

async function getDefaultDragonAgePath() {
  try {
    const docDir = await documentDir();
    return join(docDir, "BioWare", "Dragon Age");
  } catch (e) {
    console.error("Failed to get default Dragon Age directory:", e);
  }

  return null;
}

async function getDefaultOverridePath(defaultDragonAgePath: string | null) {
  if (!defaultDragonAgePath) {
    return null;
  }

  return join(defaultDragonAgePath, "packages", "core", "override");
}
