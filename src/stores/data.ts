import { createTauriStore } from "@tauri-store/zustand";
import { create, type StateCreator } from "zustand";
import { immer } from "zustand/middleware/immer";

interface ChargenDataSlice {
  disabled: string[];
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
