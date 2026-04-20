import { createTauriStore } from "@tauri-store/zustand";
import { create, type StateCreator } from "zustand";
import { immer } from "zustand/middleware/immer";

interface ChargenDataSlice {
  disabled: string[];
  setResourcesDisabled: (names: string[], disabled: boolean) => void;
  toggleResource: (name: string) => void;
}

interface SharedSlice {
  reset: () => void;
}

type Data = SharedSlice & ChargenDataSlice;

const createChargenSlice: StateCreator<
  Data,
  [["zustand/immer", never]],
  [],
  ChargenDataSlice
> = (set) => ({
  disabled: [],
  setResourcesDisabled: (names, disabled) =>
    set((state) => {
      const selected = new Set(names);
      if (disabled) {
        state.disabled = Array.from(new Set([...state.disabled, ...selected]));
      } else {
        state.disabled = state.disabled.filter((name) => !selected.has(name));
      }
    }),
  toggleResource: (name) =>
    set((state) => {
      const index = state.disabled.indexOf(name);
      if (index === -1) {
        state.disabled.push(name);
      } else {
        state.disabled.splice(index, 1);
      }
    }),
});

const createSharedSlice: StateCreator<Data, [], [], SharedSlice> = (
  set,
  _,
  store,
) => ({
  reset: () => set(() => store.getInitialState()),
});

export const useDataStore = create<Data>()(
  immer((...args) => ({
    ...createChargenSlice(...args),
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
