import { createTauriStore } from "@tauri-store/zustand";
import { useMemo } from "react";
import { create, type StateCreator } from "zustand";
import { immer } from "zustand/middleware/immer";
import { useShallow } from "zustand/shallow";

interface ChargenDataSlice {
  excludedResources: string[];
  includeResources: (...names: string[]) => void;
  excludeResources: (...names: string[]) => void;
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
  excludedResources: [],
  includeResources: (...names) =>
    set((state) => {
      const selected = new Set(names);
      state.excludedResources = state.excludedResources.filter(
        (name) => !selected.has(name),
      );
    }),
  excludeResources: (...names) =>
    set((state) => {
      state.excludedResources = Array.from(
        new Set([...state.excludedResources, ...names]),
      );
    }),
  toggleResource: (name) =>
    set((state) => {
      const index = state.excludedResources.indexOf(name);
      if (index === -1) {
        state.excludedResources.push(name);
      } else {
        state.excludedResources.splice(index, 1);
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

export function useExcludedResources() {
  return useDataStore((state) => state.excludedResources);
}

export function useExcludedResourcesSet() {
  const excludedResources = useExcludedResources();
  return useMemo(() => new Set(excludedResources), [excludedResources]);
}

export function useResourceExclusionActions() {
  return useDataStore(
    useShallow((state) => ({
      includeResources: state.includeResources,
      excludeResources: state.excludeResources,
      toggleResource: state.toggleResource,
    })),
  );
}
