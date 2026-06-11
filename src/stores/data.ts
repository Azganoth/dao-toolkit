import { createTauriStore } from "@tauri-store/zustand";
import {
  createModGroupRule,
  type ModGroupRule,
} from "@/features/chargen/resourceMods";
import { createIgnoredResourceConflict } from "@/features/conflicts/utils";
import type { ResourceConflictGroup, IgnoredResourceConflict } from "@/types/conflicts";
import { useMemo } from "react";
import { create, type StateCreator } from "zustand";
import { immer } from "zustand/middleware/immer";
import { useShallow } from "zustand/shallow";

interface ChargenDataSlice {
  excludedResources: string[];
  modGroupRules: ModGroupRule[];
  includeResources: (...names: string[]) => void;
  excludeResources: (...names: string[]) => void;
  toggleResource: (name: string) => void;
  upsertModGroupRule: (path: string) => void;
  removeModGroupRule: (path: string) => void;
}

interface ConflictsDataSlice {
  ignoredResourceConflicts: IgnoredResourceConflict[];
  ignoreResourceConflict: (group: ResourceConflictGroup) => void;
  restoreResourceConflict: (id: string) => void;
}

interface SharedSlice {
  reset: () => void;
}

type Data = SharedSlice & ChargenDataSlice & ConflictsDataSlice;

const EMPTY_MOD_GROUP_RULES: ModGroupRule[] = [];

const createChargenSlice: StateCreator<
  Data,
  [["zustand/immer", never]],
  [],
  ChargenDataSlice
> = (set) => ({
  excludedResources: [],
  modGroupRules: [],
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
  upsertModGroupRule: (path) =>
    set((state) => {
      const rule = createModGroupRule(path);
      const rules = state.modGroupRules ?? [];
      const index = rules.findIndex(
        (existing) => existing.path.toLowerCase() === rule.path.toLowerCase(),
      );

      if (index === -1) {
        state.modGroupRules = [...rules, rule].sort((a, b) =>
          a.path.localeCompare(b.path),
        );
      } else {
        state.modGroupRules[index] = rule;
      }
    }),
  removeModGroupRule: (path) =>
    set((state) => {
      const rule = createModGroupRule(path);
      state.modGroupRules = (state.modGroupRules ?? []).filter(
        (existing) => existing.path.toLowerCase() !== rule.path.toLowerCase(),
      );
    }),
});

const createSharedSlice: StateCreator<Data, [], [], SharedSlice> = (
  set,
  _,
  store,
) => ({
  reset: () => set(() => store.getInitialState()),
});

const createConflictsSlice: StateCreator<
  Data,
  [["zustand/immer", never]],
  [],
  ConflictsDataSlice
> = (set) => ({
  ignoredResourceConflicts: [],
  ignoreResourceConflict: (group) =>
    set((state) => {
      const ignored = createIgnoredResourceConflict(group);
      const conflicts = state.ignoredResourceConflicts ?? [];
      const index = conflicts.findIndex(
        (conflict) => conflict.id === ignored.id,
      );

      if (index === -1) {
        state.ignoredResourceConflicts = [...conflicts, ignored].sort((a, b) =>
          a.name.localeCompare(b.name),
        );
      } else {
        state.ignoredResourceConflicts[index] = ignored;
      }
    }),
  restoreResourceConflict: (id) =>
    set((state) => {
      state.ignoredResourceConflicts = (
        state.ignoredResourceConflicts ?? []
      ).filter((conflict) => conflict.id !== id);
    }),
});

export const useDataStore = create<Data>()(
  immer((...args) => ({
    ...createChargenSlice(...args),
    ...createConflictsSlice(...args),
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

export function useModGroupRules() {
  return useDataStore((state) => state.modGroupRules ?? EMPTY_MOD_GROUP_RULES);
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

export function useModGroupRuleActions() {
  return useDataStore(
    useShallow((state) => ({
      upsertModGroupRule: state.upsertModGroupRule,
      removeModGroupRule: state.removeModGroupRule,
    })),
  );
}

export function useIgnoredResourceConflicts() {
  return useDataStore((state) => state.ignoredResourceConflicts ?? []);
}

export function useResourceConflictActions() {
  return useDataStore(
    useShallow((state) => ({
      ignoreResourceConflict: state.ignoreResourceConflict,
      restoreResourceConflict: state.restoreResourceConflict,
    })),
  );
}
