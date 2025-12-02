import { createTauriStore } from "@tauri-store/zustand";
import { create, type StateCreator } from "zustand";
import { immer } from "zustand/middleware/immer";

interface SharedSlice {
  reset: () => void;
}

type Data = SharedSlice;

const createSharedSlice: StateCreator<Data, [], [], SharedSlice> = (
  set,
  _,
  store,
) => ({
  reset: () => set(() => store.getInitialState()),
});

export const useDataStore = create<Data>()(
  immer((...args) => ({
    ...createSharedSlice(...args),
  })),
);

export const dataStoreTauriHandler = createTauriStore(
  "data",
  useDataStore as never,
  {
    saveOnChange: true,
  },
);
