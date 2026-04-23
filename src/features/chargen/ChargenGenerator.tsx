import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/Empty";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
import { chargenApi } from "@/features/chargen/api";
import { useChargenStaleExclusions } from "@/features/chargen/hooks/useChargenStaleExclusions";
import { useChargenStore } from "@/features/chargen/stores/chargen";
import {
  getCustomResourceCount,
  getExcludedResourceCount,
} from "@/features/chargen/utils";
import { requireOverridePath } from "@/features/settings/utils";
import { getErrorMessage } from "@/lib/errors";
import { pluralize } from "@/lib/format";
import { MOTION_TRANSITION } from "@/lib/motion";
import { shortenPath } from "@/lib/paths";
import { useExcludedResources, useExcludedResourcesSet } from "@/stores/data";
import { useSettingsStore } from "@/stores/settings";
import {
  BrushCleaningIcon,
  CircleAlertIcon,
  Loader2Icon,
  SaveIcon,
  SearchIcon,
  Wand2Icon,
} from "lucide-react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { ChargenStaleExclusions } from "./components/ChargenStaleExclusions";
import { ChargenSummary } from "./components/ChargenSummary";

function formatScanTimestamp(date: Date) {
  const now = new Date();
  const time = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  if (date.toDateString() === now.toDateString()) {
    return time;
  }

  const datePart = date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
  });

  return `${datePart}, ${time}`;
}

const revealResults: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    transition: MOTION_TRANSITION.fast,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: MOTION_TRANSITION.slow,
  },
};

type PendingAction = "scan" | "generate" | "cleanup";

function ChargenGenerator() {
  const { scan, setScan, reset } = useChargenStore();
  const { overridePath } = useSettingsStore();
  const disabledResources = useExcludedResources();
  const disabledResourcesSet = useExcludedResourcesSet();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [staleDialogOpen, setStaleDialogOpen] = useState(false);

  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );

  const handleScan = async () => {
    if (!requireOverridePath(overridePath)) return;

    setPendingAction("scan");
    const toastId = toast.loading("Scanning override folder", {
      description: `Looking for chargen assets in ${shortenPath(overridePath)}.`,
    });

    try {
      const result = await chargenApi.scanAssets(overridePath);
      setScan(result, overridePath);

      const customCount = getCustomResourceCount(result.data);
      toast.success("Scan ready", {
        id: toastId,
        description:
          customCount > 0
            ? `Found ${customCount} ${pluralize(customCount, "custom file")}. Review exclusions before generating.`
            : "No custom chargen files found in this override folder.",
      });
    } catch (error) {
      toast.error("Scan could not read this folder", {
        id: toastId,
        description: getErrorMessage(error),
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleGenerate = async () => {
    if (!scan) {
      toast.error("Scan this folder before generating");
      return;
    }

    setPendingAction("generate");
    const excludedCount = getExcludedResourceCount(
      scan.data,
      disabledResourcesSet,
    );
    const toastId = toast.loading("Generating chargenmorphcfg.xml");

    try {
      await chargenApi.generateFile(scan.id, scan.path, disabledResources);
      toast.success("chargenmorphcfg.xml updated", {
        id: toastId,
        description:
          excludedCount > 0
            ? `${excludedCount} ${pluralize(excludedCount, "custom file")} excluded.`
            : "All scanned custom resources are included.",
      });
    } catch (error) {
      toast.error("Could not generate chargenmorphcfg.xml", {
        id: toastId,
        description: getErrorMessage(error),
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleClearScan = async () => {
    if (!scan) return;

    try {
      await chargenApi.clearScan(scan.id);
      reset();
      toast.success("Current scan cleared", {
        description: "Your resource exclusions were kept.",
      });
    } catch (error) {
      toast.error("Could not clear the current scan", {
        description: getErrorMessage(error),
      });
    }
  };

  const handleDeleteChargenFiles = async () => {
    if (!requireOverridePath(overridePath)) return;

    setDeleteDialogOpen(false);
    setPendingAction("cleanup");
    const toastId = toast.loading("Deleting all chargenmorphcfg.xml files", {
      description: `Searching ${shortenPath(overridePath)}.`,
    });

    try {
      const count = await chargenApi.deleteFiles(overridePath);

      toast.success(
        count > 0
          ? "chargenmorphcfg.xml files deleted"
          : "No chargenmorphcfg.xml files found",
        {
          id: toastId,
          description:
            count > 0
              ? `Removed ${count} ${pluralize(count, "chargenmorphcfg.xml file")}.`
              : "Nothing was removed from this override folder.",
        },
      );
    } catch (error) {
      toast.error("Could not delete chargenmorphcfg.xml files", {
        id: toastId,
        description: getErrorMessage(error),
      });
    } finally {
      setPendingAction(null);
    }
  };

  const {
    staleDisabledResources,
    staleCount,
    removeStaleExclusion,
    clearStaleExclusions,
  } = useChargenStaleExclusions({ data: scan?.data });

  const isBusy = pendingAction !== null;

  return (
    <div className="mx-auto flex max-w-300 flex-col pb-8">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={MOTION_TRANSITION.slow}
        className="grid w-full gap-3 sm:grid-cols-3"
      >
        <Button
          variant={scan ? "outline" : "default"}
          size="xl"
          onClick={handleScan}
          disabled={isBusy || !overridePath}
          className="w-full min-w-40 text-base"
        >
          {pendingAction === "scan" ? (
            <Loader2Icon className="size-5 animate-spin" />
          ) : (
            <SearchIcon className="size-5" />
          )}
          {scan?.data ? "Rescan" : "Scan"}
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={scan ? "default" : "outline"}
              size="xl"
              onClick={handleGenerate}
              disabled={isBusy || !scan}
              className="w-full min-w-40 text-base"
            >
              {pendingAction === "generate" ? (
                <Loader2Icon className="size-5 animate-spin" />
              ) : (
                <SaveIcon className="size-5" />
              )}
              Generate
            </Button>
          </TooltipTrigger>
          {!scan && (
            <TooltipContent>
              <CircleAlertIcon className="size-4" />
              Scan the override folder before generating.
            </TooltipContent>
          )}
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isBusy || !overridePath}
              variant="outline"
              size="xl"
              className="w-full text-base"
            >
              {pendingAction === "cleanup" ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <BrushCleaningIcon />
              )}
              Cleanup
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Remove all chargenmorphcfg.xml files from the override folder
            (Recommended before generating).
          </TooltipContent>
        </Tooltip>
      </motion.div>

      <AnimatePresence mode="wait">
        {scan ? (
          <motion.div
            key="results"
            variants={revealResults}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="mt-6 flex flex-col gap-4"
          >
            <ChargenSummary data={scan.data} scanPath={scan.path} />
            <ScanMetadata
              path={scan.path}
              scannedAt={scan.scannedAt}
              customCount={getCustomResourceCount(scan.data)}
            />
            <div className="mt-6 flex gap-4">
              {staleCount > 0 && (
                <Button
                  variant="outline"
                  size="xl"
                  onClick={() => setStaleDialogOpen(true)}
                  className="flex-1"
                >
                  Review <strong>{staleCount}</strong> Stale{" "}
                  {pluralize(staleCount, "Exclusion")}
                </Button>
              )}
              <Button
                variant="outline"
                size="xl"
                onClick={handleClearScan}
                disabled={isBusy}
                className="flex-1"
              >
                Discard Scan
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            variants={revealResults}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="flex min-h-[calc(100vh-18rem)] flex-col items-center justify-center gap-4 px-6 py-16 text-center text-muted-foreground"
          >
            <Empty>
              <EmptyHeader>
                <EmptyMedia>
                  <Wand2Icon className="size-12" />
                </EmptyMedia>
                <EmptyTitle>No chargen data loaded</EmptyTitle>
                <EmptyDescription className="max-w-xs text-pretty">
                  Scan your override folder to find custom character creation
                  resources. You can review exclusions before generating
                  chargenmorphcfg.xml.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent className="">
                {overridePath ? (
                  <>
                    <span>Ready to scan:</span>
                    <strong>{shortenPath(overridePath)}</strong>
                  </>
                ) : (
                  <strong>Choose an override folder in Settings first.</strong>
                )}
              </EmptyContent>
            </Empty>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Delete chargenmorphcfg.xml files?</DialogTitle>
            <DialogDescription>
              This will recursively delete every chargenmorphcfg.xml file under
              the selected override directory.
            </DialogDescription>
          </DialogHeader>
          {overridePath && (
            <code className="block max-h-32 overflow-y-auto rounded-md bg-muted p-3 font-mono text-sm leading-relaxed wrap-anywhere whitespace-pre-wrap text-foreground">
              {overridePath}
            </code>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="xl">
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              size="xl"
              onClick={handleDeleteChargenFiles}
            >
              Delete XML Files
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ChargenStaleExclusions
        open={staleDialogOpen}
        names={staleDisabledResources}
        onOpenChange={setStaleDialogOpen}
        onRemove={removeStaleExclusion}
        onClearAll={clearStaleExclusions}
      />
    </div>
  );
}

interface ScanMetadataProps {
  path: string;
  scannedAt: string;
  customCount: number;
}

function ScanMetadata({ path, scannedAt, customCount }: ScanMetadataProps) {
  const scanTime = new Date(scannedAt);

  return (
    <div className="flex w-full min-w-0 flex-wrap items-center justify-center gap-2 rounded-md bg-card px-3 py-2 text-sm font-semibold text-muted-foreground">
      <span>Scanned at {formatScanTimestamp(scanTime)}</span>
      <span aria-hidden="true">·</span>
      <span>
        {customCount.toLocaleString()}{" "}
        {pluralize(customCount, "custom resource")}
      </span>
      <span aria-hidden="true">·</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="min-w-0 truncate font-mono">
            {shortenPath(path)}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-md font-mono break-all">
          {path}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export { ChargenGenerator };
