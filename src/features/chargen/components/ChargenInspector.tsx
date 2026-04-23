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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
import { P } from "@/components/ui/Typography";
import {
  VirtualList,
  VirtualListContent,
  VirtualListEmpty,
  VirtualListItem,
  VirtualListItems,
} from "@/components/ui/VirtualList";
import {
  groupResourcesByMod,
  type ResourceModGroup,
} from "@/features/chargen/resourceMods";
import { cn } from "@/lib/cn";
import { pluralize } from "@/lib/format";
import { getRelativePath } from "@/lib/paths";
import {
  useExcludedResourcesSet,
  useResourceExclusionActions,
} from "@/stores/data";
import type { Resource } from "@/types/chargen";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import {
  BanIcon,
  CheckIcon,
  ChevronRightIcon,
  ChevronsDownUpIcon,
  ChevronsUpDownIcon,
  FolderOpenIcon,
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
    expandedGroups,
    expandGroup,
    collapseGroup,
    expandAllGroups,
    collapseAllGroups,
  } = useResourceGroups({ resources, scanPath });

  const excludedResourcesSet = useExcludedResourcesSet();
  const { includeResources, excludeResources, toggleResource } =
    useResourceExclusionActions();

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

  const handleRevealResource = async (path?: string) => {
    if (path) {
      await revealItemInDir(path);
    }
  };

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
            {pluralize(resourceGroups.length, "mod")}. Choose which resources
            will show in the character creation.
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
              {(row, virtualRow) => (
                <VirtualListItem
                  key={virtualRow.key}
                  virtualRow={virtualRow}
                  asChild
                >
                  <li>
                    {row.type === "group" ? (
                      <GroupRow
                        group={row.group}
                        isExpanded={expandedGroups.has(row.group.id)}
                        excludedCount={
                          groupExcludedCounts.get(row.group.id) ?? 0
                        }
                        includeResources={includeResources}
                        excludeResources={excludeResources}
                        handleOpenChange={(open) => {
                          if (open) {
                            expandGroup(row.group.id);
                          } else {
                            collapseGroup(row.group.id);
                          }
                        }}
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
            <P className="text-muted-foreground">
              No custom resources found for this group.
            </P>
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
                    <span className="inline-flex">
                      <Button
                        variant="ghost"
                        size="icon-lg"
                        onClick={expandAllGroups}
                        disabled={areAllGroupsExpanded}
                      >
                        <ChevronsUpDownIcon />
                        <span className="sr-only">Expand all groups</span>
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Expand all groups</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex">
                      <Button
                        variant="ghost"
                        size="icon-lg"
                        onClick={collapseAllGroups}
                        disabled={areAllGroupsCollapsed}
                      >
                        <ChevronsDownUpIcon />
                        <span className="sr-only">Collapse all groups</span>
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Collapse all groups</TooltipContent>
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
  const resourceGroups = useMemo(
    () => groupResourcesByMod(resources, scanPath),
    [resources, scanPath],
  );

  const groupIds = useMemo(
    () => resourceGroups.map((group) => group.id),
    [resourceGroups],
  );

  const groupStateKey = useMemo(() => groupIds.join("\u001f"), [groupIds]);

  const [collapsedGroupState, setCollapsedGroupState] = useState(() => ({
    groupIds: new Set<string>(),
    key: groupStateKey,
  }));

  const collapsedGroups =
    collapsedGroupState.key === groupStateKey
      ? collapsedGroupState.groupIds
      : EMPTY_GROUP_SET;

  const expandedGroups = useMemo(
    () => new Set(groupIds.filter((id) => !collapsedGroups.has(id))),
    [collapsedGroups, groupIds],
  );

  const updateCollapsedGroups = useCallback(
    (update: (current: Set<string>) => Set<string>) => {
      setCollapsedGroupState((state) => {
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
      updateCollapsedGroups((current) => {
        if (!current.has(groupId)) return current;

        const next = new Set(current);
        next.delete(groupId);
        return next;
      });
    },
    [updateCollapsedGroups],
  );

  const collapseGroup = useCallback(
    (groupId: string) => {
      updateCollapsedGroups((current) => {
        if (current.has(groupId)) return current;

        const next = new Set(current);
        next.add(groupId);
        return next;
      });
    },
    [updateCollapsedGroups],
  );

  const expandAllGroups = useCallback(
    () => updateCollapsedGroups(() => EMPTY_GROUP_SET),
    [updateCollapsedGroups],
  );
  const collapseAllGroups = useCallback(
    () => updateCollapsedGroups(() => new Set(groupIds)),
    [groupIds, updateCollapsedGroups],
  );

  return {
    resourceGroups,
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
  handleOpenChange: (open: boolean) => void;
}

function GroupRow({
  group,
  isExpanded,
  excludedCount,
  includeResources,
  excludeResources,
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
            {group.resources.length.toLocaleString()} custom
          </span>
        </Button>
      </CollapsibleTrigger>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                includeResources(...group.resources.map((r) => r.name))
              }
              disabled={excludedCount === 0}
            >
              <CheckIcon className="size-4.5" />
              <span className="sr-only">
                Include all resources from {group.name}
              </span>
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>Include group</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                excludeResources(...group.resources.map((r) => r.name))
              }
              disabled={excludedCount === group.resources.length}
            >
              <BanIcon className="size-4.5" />
              <span className="sr-only">
                Exclude all resources from {group.name}
              </span>
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>Exclude group</TooltipContent>
      </Tooltip>
    </Collapsible>
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
      <span
        aria-hidden="true"
        className="absolute top-0 bottom-0 left-4 w-px bg-border/70"
      />
      <span
        aria-hidden="true"
        className="absolute top-1/2 left-4 h-px w-3 bg-border/70"
      />
      <Checkbox
        size="lg"
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
                className="text-muted-foreground opacity-70 group-hover/resource:opacity-100"
                onClick={() => handleReveal(resource.path)}
              >
                <FolderOpenIcon className="size-5" />
                <span className="sr-only">Open file location</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open file location</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

export { ChargenInspector };
