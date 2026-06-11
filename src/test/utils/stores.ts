import { useChargenStore } from "@/features/chargen/stores/chargen";
import { useConflictsStore } from "@/features/conflicts/stores/conflicts";
import { useDataStore } from "@/stores/data";
import { useSettingsStore, type SettingsStore } from "@/stores/settings";
import { TEST_CONFLICTS_PATH, TEST_OVERRIDE_PATH } from "./constants";

export function resetDataStore() {
  useDataStore.getState().reset();
}

export function resetChargenStore() {
  useChargenStore.getState().reset();
}

export function resetConflictsStore() {
  useConflictsStore.getState().reset();
}

export function setDefaultSettings(
  settings: Partial<
    Pick<
      SettingsStore,
      "conflictsPath" | "overridePath" | "reduceMotion" | "theme"
    >
  > = {},
) {
  useSettingsStore.setState({
    conflictsPath: TEST_CONFLICTS_PATH,
    overridePath: TEST_OVERRIDE_PATH,
    reduceMotion: false,
    theme: "system",
    ...settings,
  });
}

export function resetAppStores() {
  resetChargenStore();
  resetConflictsStore();
  resetDataStore();
  setDefaultSettings();
}
