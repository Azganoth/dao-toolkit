import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Collapsible, CollapsibleTrigger } from "@/components/ui/Collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/Empty";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "@/components/ui/Select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
import {
  VirtualList,
  VirtualListContent,
  VirtualListEmpty,
  VirtualListItem,
  VirtualListItems,
} from "@/components/ui/VirtualList";
import {
  getModGroupRootCandidates,
  groupResourcesByMod,
  type ModGroupRule,
  type ResourceModGroup,
} from "@/features/chargen/resourceMods";
import { cn } from "@/lib/cn";
import { pluralize } from "@/lib/format";
import { getRelativePath } from "@/lib/paths";
import {
  useExcludedResourcesSet,
  useModGroupRuleActions,
  useModGroupRules,
  useResourceExclusionActions,
} from "@/stores/data";
import type { Resource } from "@/types/chargen";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import {
  ChevronRightIcon,
  ChevronsDownUpIcon,
  ChevronsUpDownIcon,
  FolderOpenIcon,
  ListCheckIcon,
  ListXIcon,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

const INSPECTOR_ROW_HEIGHT = 40;

const EMPTY_INSPECTOR_TARGET: ChargenInspectorTarget = {
  title: "",
  resources: [],
  scanPath: "",
};

export interface ChargenInspectorTarget {
  title: string;
  resources: Resource[];
  scanPath: string;
}

export type ChargenInspectorSelection = Omit<
  ChargenInspectorTarget,
  "scanPath"
>;

type InspectorListRow =
  | {
      type: "group";
      group: ResourceModGroup;
    }
  | {
      type: "resource";
      resource: Resource;
    };

export interface CharenInspectorProps {
  target?: ChargenInspectorTarget | null;
  onClose?: () => void;
}

function ChargenInspector({ target, onClose }: CharenInspectorProps) {
  const [activeTarget, setActiveTarget] =
    useState<ChargenInspectorTarget | null>(target ?? null);

  if (target && target !== activeTarget) {
    setActiveTarget(target);
  }

  const { title, resources, scanPath } =
    target || activeTarget || EMPTY_INSPECTOR_TARGET;

  const resourceNames = useMemo(
    () => resources.map((resource) => resource.name),
    [resources],
  );

  const {
    resourceGroups,
    groupRootCandidates,
    expandedGroups,
    expandGroup,
    collapseGroup,
    expandAllGroups,
    collapseAllGroups,
  } = useResourceGroups({ resources, scanPath });

  const excludedResourcesSet = useExcludedResourcesSet();
  const { includeResources, excludeResources, toggleResource } =
    useResourceExclusionActions();
  const { upsertModGroupRule } = useModGroupRuleActions();

  const excludedResourcesCount = useMemo(
    () =>
      resources.filter((resource) => excludedResourcesSet.has(resource.name))
        .length,
    [excludedResourcesSet, resources],
  );
  const groupExcludedCounts = useMemo(
    () =>
      new Map(
        resourceGroups.map((group) => [
          group.id,
          group.resources.filter((resource) =>
            excludedResourcesSet.has(resource.name),
          ).length,
        ]),
      ),
    [excludedResourcesSet, resourceGroups],
  );

  const visibleRows = useMemo(
    () =>
      resourceGroups.flatMap((group): InspectorListRow[] => [
        { type: "group", group },
        ...(expandedGroups.has(group.id)
          ? group.resources.map((resource) => ({
              type: "resource" as const,
              resource,
            }))
          : []),
      ]),
    [resourceGroups, expandedGroups],
  );

  const handleRevealResource = useCallback(async (path?: string) => {
    if (path) {
      await revealItemInDir(path);
    }
  }, []);

  const getRelativeResourcePath = useCallback(
    (path: string) => getRelativePath(path, scanPath),
    [scanPath],
  );

  const areAllGroupsExpanded =
    resourceGroups.length > 0 && expandedGroups.size === resourceGroups.length;
  const areAllGroupsCollapsed =
    resourceGroups.length > 0 && expandedGroups.size === 0;

  return (
    <Dialog
      open={!!target}
      onOpenChange={(open) => {
        if (!open) {
          onClose?.();
        }
      }}
    >
      <DialogContent
        className="max-h-[80vh] sm:max-w-2xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {resources.length.toLocaleString()}{" "}
            {pluralize(resources.length, "resource")} from{" "}
            {resourceGroups.length.toLocaleString()} detected{" "}
            {pluralize(resourceGroups.length, "mod")}. Review custom resources
            by detected mod; excluded resources are skipped during generation.
          </DialogDescription>
        </DialogHeader>
        <VirtualList
          items={visibleRows}
          estimateHeight={INSPECTOR_ROW_HEIGHT}
          getItemKey={(row) =>
            row.type === "group" ? `group:${row.group.id}` : row.resource.name
          }
          className="h-[50vh] rounded-md border p-3"
        >
          <VirtualListContent>
            <VirtualListItems<InspectorListRow>>
              {(row, virtualRow, _index, isScrolling) => (
                <VirtualListItem
                  key={virtualRow.key}
                  virtualRow={virtualRow}
                  asChild
                >
                  <li>
                    {row.type === "group" && isScrolling ? (
                      <ScrollingGroupRow
                        group={row.group}
                        isExpanded={expandedGroups.has(row.group.id)}
                        excludedCount={
                          groupExcludedCounts.get(row.group.id) ?? 0
                        }
                      />
                    ) : row.type === "group" ? (
                      <GroupRow
                        group={row.group}
                        isExpanded={expandedGroups.has(row.group.id)}
                        excludedCount={
                          groupExcludedCounts.get(row.group.id) ?? 0
                        }
                        includeResources={includeResources}
                        excludeResources={excludeResources}
                        rootCandidates={
                          groupRootCandidates.get(row.group.id) ?? []
                        }
                        setRootRule={upsertModGroupRule}
                        handleOpenChange={(open) => {
                          if (open) {
                            expandGroup(row.group.id);
                          } else {
                            collapseGroup(row.group.id);
                          }
                        }}
                      />
                    ) : isScrolling ? (
                      <ScrollingResourceRow
                        resource={row.resource}
                        isExcluded={excludedResourcesSet.has(row.resource.name)}
                      />
                    ) : (
                      <ResourceRow
                        resource={row.resource}
                        isExcluded={excludedResourcesSet.has(row.resource.name)}
                        toggleExclusion={toggleResource}
                        handleReveal={handleRevealResource}
                        getRelativePath={getRelativeResourcePath}
                      />
                    )}
                  </li>
                </VirtualListItem>
              )}
            </VirtualListItems>
          </VirtualListContent>
          <VirtualListEmpty>
            <Empty className="h-full min-h-64 rounded-md bg-transparent text-muted-foreground">
              <EmptyHeader>
                <EmptyMedia className="text-muted-foreground/70">
                  <FolderOpenIcon className="size-9" />
                </EmptyMedia>
                <EmptyTitle className="text-base text-foreground">
                  No custom resources found
                </EmptyTitle>
                <EmptyDescription className="max-w-sm text-pretty">
                  This category has no custom files in the current scan, so
                  there is nothing to include or exclude here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </VirtualListEmpty>
        </VirtualList>
        {resources.length > 0 && (
          <DialogFooter className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              <span className="font-mono text-foreground">
                {excludedResourcesCount}
              </span>{" "}
              of{" "}
              <span className="font-mono text-foreground">
                {resources.length}
              </span>{" "}
              excluded
            </div>
            <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:items-center">
              <div className="flex justify-end gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-lg"
                      onClick={expandAllGroups}
                      disabled={areAllGroupsExpanded}
                    >
                      <ChevronsUpDownIcon />
                      <span className="sr-only">Expand all groups</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Expand all mod groups</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-lg"
                      onClick={collapseAllGroups}
                      disabled={areAllGroupsCollapsed}
                    >
                      <ChevronsDownUpIcon />
                      <span className="sr-only">Collapse all groups</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Collapse all mod groups</TooltipContent>
                </Tooltip>
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  size="xl"
                  onClick={() => includeResources(...resourceNames)}
                  disabled={excludedResourcesCount === 0}
                >
                  Include All
                </Button>
                <Button
                  variant="outline"
                  size="xl"
                  onClick={() => excludeResources(...resourceNames)}
                  disabled={excludedResourcesCount === resources.length}
                >
                  Exclude All
                </Button>
              </div>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

const EMPTY_GROUP_SET = new Set<string>();

interface UseResourceGroupsOptions {
  resources: Resource[];
  scanPath: string;
}

function useResourceGroups({ resources, scanPath }: UseResourceGroupsOptions) {
  const modGroupRules = useModGroupRules();
  const resourceGroups = useMemo(
    () => groupResourcesByMod(resources, scanPath, modGroupRules),
    [modGroupRules, resources, scanPath],
  );
  const groupRootCandidates = useMemo(
    () =>
      new Map(
        resourceGroups.map((group) => [
          group.id,
          getModGroupRootCandidates(group.resources, scanPath),
        ]),
      ),
    [resourceGroups, scanPath],
  );

  const groupIds = useMemo(
    () => resourceGroups.map((group) => group.id),
    [resourceGroups],
  );

  const groupStateKey = useMemo(() => groupIds.join("\u001f"), [groupIds]);

  const [expandedGroupState, setExpandedGroupState] = useState(() => ({
    groupIds: new Set<string>(),
    key: groupStateKey,
  }));

  const expandedGroups =
    expandedGroupState.key === groupStateKey
      ? expandedGroupState.groupIds
      : EMPTY_GROUP_SET;

  const updateExpandedGroups = useCallback(
    (update: (current: Set<string>) => Set<string>) => {
      setExpandedGroupState((state) => {
        const current =
          state.key === groupStateKey ? state.groupIds : EMPTY_GROUP_SET;
        const next = update(current);

        if (state.key === groupStateKey && next === current) return state;

        return {
          groupIds: next,
          key: groupStateKey,
        };
      });
    },
    [groupStateKey],
  );

  const expandGroup = useCallback(
    (groupId: string) => {
      updateExpandedGroups((current) => {
        if (current.has(groupId)) return current;

        const next = new Set(current);
        next.add(groupId);
        return next;
      });
    },
    [updateExpandedGroups],
  );

  const collapseGroup = useCallback(
    (groupId: string) => {
      updateExpandedGroups((current) => {
        if (!current.has(groupId)) return current;

        const next = new Set(current);
        next.delete(groupId);
        return next;
      });
    },
    [updateExpandedGroups],
  );

  const expandAllGroups = useCallback(
    () => updateExpandedGroups(() => new Set(groupIds)),
    [groupIds, updateExpandedGroups],
  );
  const collapseAllGroups = useCallback(
    () => updateExpandedGroups(() => EMPTY_GROUP_SET),
    [updateExpandedGroups],
  );

  return {
    resourceGroups,
    groupRootCandidates,
    expandedGroups,
    expandGroup,
    collapseGroup,
    expandAllGroups,
    collapseAllGroups,
  };
}

interface GroupRowProps {
  group: ResourceModGroup;
  isExpanded: boolean;
  excludedCount: number;
  includeResources: (...names: string[]) => void;
  excludeResources: (...names: string[]) => void;
  rootCandidates: ModGroupRule[];
  setRootRule: (path: string) => void;
  handleOpenChange: (open: boolean) => void;
}

function GroupRow({
  group,
  isExpanded,
  excludedCount,
  includeResources,
  excludeResources,
  rootCandidates,
  setRootRule,
  handleOpenChange,
}: GroupRowProps) {
  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={handleOpenChange}
      className={cn(
        "flex h-9 min-w-0 flex-1 items-center gap-1 rounded-md border border-transparent pr-2 hover:bg-muted/40",
        group.isLoose && "bg-muted/30 text-muted-foreground hover:bg-muted/50",
      )}
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-9 min-w-0 flex-1 justify-start rounded-r-none pr-4 pl-2 font-sans hover:bg-transparent aria-expanded:bg-transparent",
            group.isLoose && "text-muted-foreground",
          )}
        >
          <ChevronRightIcon
            className={cn(
              "size-4 transition-transform",
              isExpanded && "rotate-90",
            )}
          />
          <span className="min-w-0 flex-1 truncate text-left text-sm font-medium">
            {group.name}
          </span>
          <span className="shrink-0 font-mono text-xs text-muted-foreground">
            {excludedCount > 0 &&
              `${excludedCount.toLocaleString()} excluded · `}
            {group.resources.length.toLocaleString()} items
          </span>
        </Button>
      </CollapsibleTrigger>
      <GroupRootSelect
        groupName={group.name}
        candidates={rootCandidates}
        setRootRule={setRootRule}
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              includeResources(...group.resources.map((r) => r.name))
            }
            disabled={excludedCount === 0}
          >
            <ListCheckIcon className="size-4.5" />
            <span className="sr-only">
              Include all resources from {group.name}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          Include every resource in this group
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              excludeResources(...group.resources.map((r) => r.name))
            }
            disabled={excludedCount === group.resources.length}
          >
            <ListXIcon className="size-4.5" />
            <span className="sr-only">
              Exclude all resources from {group.name}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          Exclude every resource in this group
        </TooltipContent>
      </Tooltip>
    </Collapsible>
  );
}

interface GroupRootSelectProps {
  groupName: string;
  candidates: ModGroupRule[];
  setRootRule: (path: string) => void;
}

function GroupRootSelect({
  groupName,
  candidates,
  setRootRule,
}: GroupRootSelectProps) {
  if (candidates.length === 0) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <Select onValueChange={setRootRule}>
            <SelectTrigger
              aria-label={`Choose group root for ${groupName}`}
              size="sm"
              className="h-8 border-transparent bg-transparent px-2 text-xs text-muted-foreground hover:bg-muted"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              Root
            </SelectTrigger>
            <SelectContent
              align="end"
              position="popper"
              className="z-60 min-w-72"
            >
              <SelectGroup>
                <SelectLabel>Use folder as group root</SelectLabel>
                {candidates.map((candidate) => (
                  <SelectItem key={candidate.path} value={candidate.path}>
                    <span className="font-mono text-xs">{candidate.path}</span>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </span>
      </TooltipTrigger>
      <TooltipContent side="right">
        Choose the mod folder that defines this group.
      </TooltipContent>
    </Tooltip>
  );
}

interface ScrollingGroupRowProps {
  group: ResourceModGroup;
  isExpanded: boolean;
  excludedCount: number;
}

function ScrollingGroupRow({
  group,
  isExpanded,
  excludedCount,
}: ScrollingGroupRowProps) {
  return (
    <div
      className={cn(
        "flex h-9 min-w-0 flex-1 items-center gap-1 rounded-md border border-transparent pr-2 hover:bg-muted/40",
        "pointer-events-none pr-24.75 pl-2.25 font-sans",
        group.isLoose && "bg-muted/30 text-muted-foreground",
      )}
    >
      <ChevronRightIcon
        className={cn(
          "size-4 shrink-0 transition-transform",
          isExpanded && "rotate-90",
        )}
      />
      <span className="min-w-0 flex-1 truncate text-left text-sm font-medium">
        {group.name}
      </span>
      <span className="shrink-0 font-mono text-xs text-muted-foreground">
        {excludedCount > 0 && `${excludedCount.toLocaleString()} excluded · `}
        {group.resources.length.toLocaleString()} items
      </span>
      <span aria-hidden="true" className="w-16 shrink-0" />
    </div>
  );
}

interface ResourceRowProps {
  resource: Resource;
  isExcluded: boolean;
  toggleExclusion: (name: string) => void;
  handleReveal: (path?: string) => void;
  getRelativePath: (path: string) => string;
}

function ResourceRow({
  resource,
  isExcluded,
  toggleExclusion,
  handleReveal,
  getRelativePath,
}: ResourceRowProps) {
  return (
    <div className="group/resource relative flex h-9 items-center gap-3 rounded-md pr-2 pl-9 font-mono text-sm hover:bg-muted/45">
      <ResourceTreeGuide />
      <Checkbox
        size="lg"
        aria-label={
          isExcluded ? `Include ${resource.name}` : `Exclude ${resource.name}`
        }
        checked={!isExcluded}
        onCheckedChange={() => toggleExclusion(resource.name)}
      />
      <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
        <span
          className={cn(
            "truncate",
            isExcluded && "text-muted-foreground line-through",
          )}
        >
          {resource.path ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>{resource.name}</span>
              </TooltipTrigger>
              <TooltipContent className="max-w-md font-mono break-all">
                {getRelativePath(resource.path)}
              </TooltipContent>
            </Tooltip>
          ) : (
            resource.name
          )}
        </span>
        {resource.path && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleReveal(resource.path)}
              >
                <FolderOpenIcon className="size-5" />
                <span className="sr-only">Open file location</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Open file location</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

interface ScrollingResourceRowProps {
  resource: Resource;
  isExcluded: boolean;
}

function ScrollingResourceRow({
  resource,
  isExcluded,
}: ScrollingResourceRowProps) {
  return (
    <div
      className={cn(
        "group/resource relative flex h-9 items-center gap-3 rounded-md pr-2 pl-9 font-mono text-sm hover:bg-muted/45",
        "pointer-events-none",
      )}
    >
      <ResourceTreeGuide />
      <span
        aria-hidden="true"
        className={cn(
          "size-5 shrink-0 rounded-lg border border-border/70",
          !isExcluded && "border-primary/50 bg-primary/15",
        )}
      />
      <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
        <span
          className={cn(
            "truncate",
            isExcluded && "text-muted-foreground line-through",
          )}
        >
          {resource.name}
        </span>
        <span aria-hidden="true" className="size-8 shrink-0" />
      </div>
    </div>
  );
}

function ResourceTreeGuide() {
  return (
    <>
      <span
        aria-hidden="true"
        className="absolute top-0 bottom-0 left-4 w-px bg-border/70"
      />
      <span
        aria-hidden="true"
        className="absolute top-1/2 left-4 h-px w-3 bg-border/70"
      />
    </>
  );
}

export { ChargenInspector };
