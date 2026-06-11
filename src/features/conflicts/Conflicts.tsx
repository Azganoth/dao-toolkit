import { ScanMetadataStrip } from "@/components/composites/ScanMetadataStrip";
import { ExpandCollapseControls } from "@/components/composites/ExpandCollapseControls";
import { Button } from "@/components/ui/Button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/Empty";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
import { conflictsApi } from "@/features/conflicts/api";
import { ConflictsStaleAndIgnored } from "@/features/conflicts/components/ConflictsStaleAndIgnored";
import { ConflictWarnings } from "@/features/conflicts/components/ConflictsWarnings";
import { useConflictsStore } from "@/features/conflicts/stores/conflicts";
import {
  formatBytes,
  formatConflictType,
  formatModifiedTime,
  formatSourceKind,
  getMatchingIgnoredConflict,
  getStaleIgnoredConflicts,
  getVisibleResourceConflictGroups,
  sourceMatchesQuery,
} from "@/features/conflicts/utils";
import { getErrorMessage } from "@/lib/errors";
import { pluralize } from "@/lib/format";
import { MOTION_TRANSITION } from "@/lib/motion";
import { shortenPath } from "@/lib/paths";
import {
  useIgnoredResourceConflicts,
  useResourceConflictActions,
} from "@/stores/data";
import { useSettingsStore } from "@/stores/settings";
import type {
  ConflictType,
  ResourceConflictGroup,
  IndexedResource,
  ResourceSourceKind,
} from "@/types/conflicts";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import {
  ArchiveIcon,
  ChevronRightIcon,
  FileIcon,
  FolderOpenIcon,
  Loader2Icon,
  SearchIcon,
  ShieldCheckIcon,
  XIcon,
} from "lucide-react";
import { motion, type Variants } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const CONFLICTS_ROW_HEIGHT = 44;
const ALL_FILTER_VALUE = "all";

const revealResults: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.98,
    transition: MOTION_TRANSITION.fast,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: MOTION_TRANSITION.slow,
  },
};

type PendingAction = "scan";

type ConflictsListRow =
  | {
      type: "group";
      group: ResourceConflictGroup;
    }
  | {
      type: "source";
      group: ResourceConflictGroup;
      source: IndexedResource;
    };

function Conflicts() {
  const { scan, setScan } = useConflictsStore();
  const conflictsPath = useSettingsStore((state) => state.conflictsPath);
  const ignoredConflicts = useIgnoredResourceConflicts();
  const { ignoreResourceConflict, restoreResourceConflict } =
    useResourceConflictActions();

  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(),
  );
  const [query, setQuery] = useState("");
  const [conflictType, setConflictType] = useState<ConflictType | "all">("all");
  const [sourceKind, setSourceKind] = useState<ResourceSourceKind | "all">(
    "all",
  );
  const [extension, setExtension] = useState("all");
  const [warningsOpen, setWarningsOpen] = useState(false);
  const [ignoredOpen, setIgnoredOpen] = useState(false);

  const visibleGroups = useMemo(
    () =>
      scan
        ? getVisibleResourceConflictGroups(
            scan.conflictGroups,
            ignoredConflicts,
          )
        : [],
    [ignoredConflicts, scan],
  );
  const staleIgnoredConflicts = useMemo(
    () =>
      scan
        ? getStaleIgnoredConflicts(scan.conflictGroups, ignoredConflicts)
        : [],
    [ignoredConflicts, scan],
  );
  const matchingIgnoredCount = useMemo(
    () =>
      scan
        ? ignoredConflicts.filter((ignored) =>
            scan.conflictGroups.some((group) =>
              getMatchingIgnoredConflict(group, [ignored]),
            ),
          ).length
        : 0,
    [ignoredConflicts, scan],
  );
  const extensions = useMemo(
    () =>
      Array.from(
        new Set(
          visibleGroups
            .map((group) => group.extension)
            .filter((value) => value.length > 0),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [visibleGroups],
  );
  const filteredGroups = useMemo(
    () =>
      visibleGroups.filter((group) => {
        const matchesQuery =
          !query ||
          group.name.toLowerCase().includes(query.toLowerCase()) ||
          group.sources.some((source) => sourceMatchesQuery(source, query));
        const matchesConflict =
          conflictType === ALL_FILTER_VALUE ||
          group.conflictType === conflictType;
        const matchesSource =
          sourceKind === ALL_FILTER_VALUE ||
          group.sources.some((source) => source.sourceKind === sourceKind);
        const matchesExtension =
          extension === ALL_FILTER_VALUE || group.extension === extension;

        return (
          matchesQuery && matchesConflict && matchesSource && matchesExtension
        );
      }),
    [conflictType, extension, query, sourceKind, visibleGroups],
  );
  const visibleRows = useMemo(
    () =>
      filteredGroups.flatMap((group): ConflictsListRow[] => [
        { type: "group", group },
        ...(expandedGroups.has(group.id)
          ? group.sources.map((source) => ({
              type: "source" as const,
              group,
              source,
            }))
          : []),
      ]),
    [expandedGroups, filteredGroups],
  );

  const hasFilters =
    !!query ||
    conflictType !== ALL_FILTER_VALUE ||
    sourceKind !== ALL_FILTER_VALUE ||
    extension !== ALL_FILTER_VALUE;
  const isBusy = pendingAction !== null;
  const warningCount = scan?.warnings.length ?? 0;
  const staleIgnoredCount = staleIgnoredConflicts.length;
  const allExpanded =
    filteredGroups.length > 0 &&
    filteredGroups.every((group) => expandedGroups.has(group.id));
  const allCollapsed =
    filteredGroups.length > 0 &&
    filteredGroups.every((group) => !expandedGroups.has(group.id));

  const handleScan = async () => {
    if (!conflictsPath) {
      toast.error("Choose a Conflicts folder first", {
        description: "Set the Dragon Age documents directory in Settings.",
      });
      return;
    }

    setPendingAction("scan");
    const toastId = toast.loading("Scanning for resource conflicts", {
      description: `Reading ${shortenPath(conflictsPath)}.`,
    });

    try {
      const result = await conflictsApi.scanForResourceConflicts(conflictsPath);
      setScan(result);
      setExpandedGroups(new Set());

      toast.success("Conflict scan ready", {
        id: toastId,
        description:
          result.conflictGroups.length > 0
            ? `Found ${result.conflictGroups.length} ${pluralize(
                result.conflictGroups.length,
                "conflict group",
              )}.`
            : "No resource-name conflicts found.",
      });
    } catch (error) {
      toast.error("Conflict scan failed", {
        id: toastId,
        description: getErrorMessage(error),
      });
    } finally {
      setPendingAction(null);
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((current) => {
      const next = new Set(current);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedGroups(new Set(filteredGroups.map((group) => group.id)));
  };

  const collapseAll = () => {
    setExpandedGroups(new Set());
  };

  const clearFilters = () => {
    setQuery("");
    setConflictType("all");
    setSourceKind("all");
    setExtension("all");
  };

  const revealSource = async (source: IndexedResource) => {
    await revealItemInDir(source.path);
  };

  const additionalMetadata = useMemo(() => {
    const indexedResources = scan?.stats.indexedResources ?? 0;
    const conflictGroups = scan?.stats.conflictGroups ?? 0;

    return [
      `${indexedResources.toLocaleString()} ${pluralize(indexedResources, "resource")}`,
      `${conflictGroups.toLocaleString()} ${pluralize(conflictGroups, "conflict group")}`,
    ];
  }, [scan]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 pb-8">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={MOTION_TRANSITION.slow}
        className="grid gap-3 rounded-md border bg-card p-3 sm:grid-cols-[1fr_auto_auto]"
      >
        <div className="flex min-w-0 flex-col justify-center gap-1">
          <h2 className="text-sm font-semibold">Resource Conflicts</h2>
          <p className="min-w-0 truncate text-sm text-muted-foreground">
            {conflictsPath
              ? `Scanning ${shortenPath(conflictsPath)}`
              : "Choose a Dragon Age documents directory in Settings."}
          </p>
        </div>
        <Button
          size="xl"
          onClick={handleScan}
          disabled={isBusy || !conflictsPath}
          className="w-full sm:w-auto"
        >
          {pendingAction === "scan" ? (
            <Loader2Icon className="animate-spin" />
          ) : (
            <SearchIcon />
          )}
          {scan ? "Rescan" : "Scan"}
        </Button>
        <ExpandCollapseControls
          onExpandAll={expandAll}
          onCollapseAll={collapseAll}
          expandDisabled={filteredGroups.length === 0 || allExpanded}
          collapseDisabled={filteredGroups.length === 0 || allCollapsed}
          itemLabel="conflict groups"
          size="icon-xl"
          className="self-center"
        />
      </motion.div>

      {scan && (
        <motion.div
          variants={revealResults}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-3"
        >
          <ScanMetadataStrip
            path={scan.path}
            scannedAt={scan.scannedAt}
            additionalMetadata={additionalMetadata}
          />
          {(warningCount > 0 ||
            matchingIgnoredCount > 0 ||
            staleIgnoredCount > 0) && (
            <div className="flex flex-wrap items-center justify-center gap-1 text-sm text-muted-foreground">
              {warningCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setWarningsOpen(true)}
                >
                  {warningCount.toLocaleString()}{" "}
                  {pluralize(warningCount, "warning")}
                </Button>
              )}
              {(matchingIgnoredCount > 0 || staleIgnoredCount > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIgnoredOpen(true)}
                >
                  {matchingIgnoredCount.toLocaleString()} ignored
                  {staleIgnoredCount > 0 &&
                    ` · ${staleIgnoredCount.toLocaleString()} stale`}
                </Button>
              )}
            </div>
          )}
          <div className="grid gap-2 rounded-md border bg-card p-3 md:grid-cols-[1fr_auto_auto_auto_auto]">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, source, or path..."
              className="h-9"
            />
            <Select
              value={conflictType}
              onValueChange={(value) =>
                setConflictType(value as ConflictType | "all")
              }
            >
              <SelectTrigger className="h-9 min-w-40">
                <SelectValue placeholder="Conflict type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All conflicts</SelectItem>
                  <SelectItem value="looseVsLoose">Loose files</SelectItem>
                  <SelectItem value="looseVsArchive">
                    Loose + archive
                  </SelectItem>
                  <SelectItem value="archiveVsArchive">
                    Archive entries
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select
              value={sourceKind}
              onValueChange={(value) =>
                setSourceKind(value as ResourceSourceKind | "all")
              }
            >
              <SelectTrigger className="h-9 min-w-34">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All sources</SelectItem>
                  <SelectItem value="loose">Loose</SelectItem>
                  <SelectItem value="archive">Archive</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select value={extension} onValueChange={setExtension}>
              <SelectTrigger className="h-9 min-w-30">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All types</SelectItem>
                  {extensions.map((value) => (
                    <SelectItem key={value} value={value}>
                      .{value}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon-lg"
              onClick={clearFilters}
              disabled={!hasFilters}
            >
              <XIcon />
              <span className="sr-only">Clear filters</span>
            </Button>
          </div>
        </motion.div>
      )}

      <motion.div
        variants={revealResults}
        initial="hidden"
        animate="visible"
        className="min-h-[calc(100vh-22rem)]"
      >
        {scan ? (
          <VirtualList
            items={visibleRows}
            estimateHeight={CONFLICTS_ROW_HEIGHT}
            getItemKey={(row) =>
              row.type === "group"
                ? `group:${row.group.id}`
                : `source:${row.source.fingerprint}`
            }
            className="h-[calc(100vh-23rem)] min-h-96 rounded-md border p-3"
          >
            <VirtualListContent>
              <VirtualListItems<ConflictsListRow>>
                {(row, virtualRow) => (
                  <VirtualListItem
                    key={virtualRow.key}
                    virtualRow={virtualRow}
                    asChild
                  >
                    <li>
                      {row.type === "group" ? (
                        <ResourceConflictGroupRow
                          group={row.group}
                          isExpanded={expandedGroups.has(row.group.id)}
                          onToggle={() => toggleGroup(row.group.id)}
                          onIgnore={() => ignoreResourceConflict(row.group)}
                        />
                      ) : (
                        <ConflictSourceRow
                          source={row.source}
                          isWinner={
                            row.source.fingerprint ===
                            row.group.winnerFingerprint
                          }
                          onReveal={() => revealSource(row.source)}
                        />
                      )}
                    </li>
                  </VirtualListItem>
                )}
              </VirtualListItems>
            </VirtualListContent>
            <VirtualListEmpty>
              <ConflictsEmptyState
                hasScan
                hasFilters={hasFilters}
                hasIgnored={
                  visibleGroups.length === 0 && matchingIgnoredCount > 0
                }
              />
            </VirtualListEmpty>
          </VirtualList>
        ) : (
          <ConflictsEmptyState
            hasScan={false}
            hasFilters={false}
            hasIgnored={false}
          />
        )}
      </motion.div>
      <ConflictWarnings
        open={warningsOpen}
        warnings={scan?.warnings ?? []}
        onOpenChange={setWarningsOpen}
      />
      <ConflictsStaleAndIgnored
        open={ignoredOpen}
        ignored={ignoredConflicts}
        stale={staleIgnoredConflicts}
        onOpenChange={setIgnoredOpen}
        onRestore={restoreResourceConflict}
      />
    </div>
  );
}

interface ResourceConflictGroupRowProps {
  group: ResourceConflictGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onIgnore: () => void;
}

function ResourceConflictGroupRow({
  group,
  isExpanded,
  onToggle,
  onIgnore,
}: ResourceConflictGroupRowProps) {
  return (
    <div className="flex h-10 min-w-0 items-center gap-2 rounded-md border border-transparent pr-2 hover:bg-muted/45">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="h-10 min-w-0 flex-1 justify-start rounded-r-none pr-3 pl-2 font-sans hover:bg-transparent"
      >
        <ChevronRightIcon
          className={`size-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
        />
        <span className="min-w-0 flex-1 truncate text-left text-sm font-medium">
          {group.name}
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatConflictType(group.conflictType)} ·{" "}
          {group.sources.length.toLocaleString()} sources
        </span>
      </Button>
      <Button variant="outline" size="sm" onClick={onIgnore}>
        <ShieldCheckIcon />
        Ignore
      </Button>
    </div>
  );
}

interface ConflictSourceRowProps {
  source: IndexedResource;
  isWinner: boolean;
  onReveal: () => void;
}

function ConflictSourceRow({
  source,
  isWinner,
  onReveal,
}: ConflictSourceRowProps) {
  const size = formatBytes(source.size ?? source.archive?.length ?? null);
  const modified = formatModifiedTime(source.modifiedAt);

  return (
    <div className="relative flex h-10 items-center gap-3 rounded-md pr-2 pl-9 text-sm hover:bg-muted/35">
      <span
        aria-hidden="true"
        className="absolute top-0 bottom-0 left-4 w-px bg-border/70"
      />
      <span
        aria-hidden="true"
        className="absolute top-1/2 left-4 h-px w-3 bg-border/70"
      />
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {source.sourceKind === "archive" ? (
          <ArchiveIcon className="size-4.5 shrink-0 text-muted-foreground" />
        ) : (
          <FileIcon className="size-4.5 shrink-0 text-muted-foreground" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-mono">{source.relativePath}</span>
            {isWinner && (
              <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
                wins
              </span>
            )}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {formatSourceKind(source.sourceKind)} · {source.sourceName}
            {size && ` · ${size}`}
            {modified && ` · ${modified}`}
          </div>
        </div>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onReveal}>
            <FolderOpenIcon />
            <span className="sr-only">Open source location</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          {source.sourceKind === "archive"
            ? "Open containing archive location"
            : "Open file location"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

interface ConflictsEmptyStateProps {
  hasScan: boolean;
  hasFilters: boolean;
  hasIgnored: boolean;
}

function ConflictsEmptyState({
  hasScan,
  hasFilters,
  hasIgnored,
}: ConflictsEmptyStateProps) {
  const title = hasFilters
    ? "No conflict groups match these filters"
    : hasIgnored
      ? "All current conflicts are ignored"
      : hasScan
        ? "No resource conflicts found"
        : "No conflict scan loaded";
  const description = hasFilters
    ? "Clear or adjust the filters to review more resource conflict groups."
    : hasIgnored
      ? "Open ignored conflicts from the scan summary to restore any group."
      : hasScan
        ? "This scan did not find any resource names that appear in more than one source."
        : "Scan the Dragon Age documents folder to find resource-name conflicts across loose override files and archives.";

  return (
    <Empty className="h-full min-h-[calc(100vh-22rem)] bg-transparent text-muted-foreground">
      <EmptyHeader>
        <EmptyMedia className="text-muted-foreground/70">
          <SearchIcon className="size-10" />
        </EmptyMedia>
        <EmptyTitle className="text-lg text-foreground">{title}</EmptyTitle>
        <EmptyDescription className="max-w-md text-pretty">
          {description}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export { Conflicts };
