import { useChargenStore } from "@/features/chargen/stores/chargen";
import { useDataStore } from "@/stores/data";
import { useSettingsStore, type SettingsStore } from "@/stores/settings";
import { TEST_OVERRIDE_PATH } from "./constants";

export function resetDataStore() {
  useDataStore.getState().reset();
}

export function resetChargenStore() {
  useChargenStore.getState().reset();
}

export function setDefaultSettings(
  settings: Partial<
    Pick<SettingsStore, "overridePath" | "reduceMotion" | "theme">
  > = {},
) {
  useSettingsStore.setState({
    overridePath: TEST_OVERRIDE_PATH,
    reduceMotion: false,
    theme: "system",
    ...settings,
  });
}

export function resetAppStores() {
  resetChargenStore();
  resetDataStore();
  setDefaultSettings();
}
