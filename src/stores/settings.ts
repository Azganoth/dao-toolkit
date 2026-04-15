import { documentDir, join } from "@tauri-apps/api/path";
import { createTauriStore } from "@tauri-store/zustand";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

async function getDefaultOverridePath() {
  try {
    const docDir = await documentDir();
    const defaultPath = await join(
      docDir,
      "BioWare",
      "Dragon Age",
      "packages",
      "core",
      "override",
    );

    return defaultPath;
  } catch (e) {
    console.error("Failed to get default override directory:", e);
  }

  return null;
}

export interface SettingsStore {
  theme: "light" | "dark" | "system";
  overridePath: string | null;
  reduceMotion: boolean;

  setTheme: (theme: SettingsStore["theme"]) => void;
  setOverridePath: (path: SettingsStore["overridePath"]) => void;
  setReduceMotion: (value: boolean) => void;

  reset: () => void;
  init: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>()(
  immer((set, get, store) => ({
    theme: "system",
    overridePath: null,
    reduceMotion: false,

    setTheme: (theme) =>
      set((state) => {
        state.theme = theme;
      }),
    setOverridePath: (path) =>
      set((state) => {
        state.overridePath = path;
      }),
    setReduceMotion: (value) =>
      set((state) => {
        state.reduceMotion = value;
      }),

    reset: async () => {
      const defaultPath = await getDefaultOverridePath();

      set(() => {
        const initialState = store.getInitialState();
        if (defaultPath) {
          initialState.overridePath = defaultPath;
        }

        return initialState;
      });
    },
    init: async () => {
      if (get().overridePath) {
        return;
      }

      const defaultPath = await getDefaultOverridePath();
      set((state) => {
        state.overridePath = defaultPath;
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
