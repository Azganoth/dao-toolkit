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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
import { H4, P } from "@/components/ui/Typography";
import { useChargenStore } from "@/features/chargen/stores/chargen";
import { MOTION_TRANSITION } from "@/lib/motion";
import { overridePathGuard, pluralize, shortenPath } from "@/lib/utils";
import { useDataStore } from "@/stores/data";
import { useSettingsStore } from "@/stores/settings";
import {
  type ChargenData,
  type ChargenScanResult,
  type Resource,
  type ResourceGroup,
} from "@/types/chargen";
import { invoke } from "@tauri-apps/api/core";
import {
  BrushCleaningIcon,
  CircleAlertIcon,
  ClockIcon,
  FolderIcon,
  Loader2Icon,
  SaveIcon,
  SearchIcon,
  Wand2Icon,
} from "lucide-react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { ChargenResults } from "./components/ChargenResults";

function formatScanTimestamp(date: Date) {
  const now = new Date();
  const time = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  if (date.toDateString() === now.toDateString()) {
    return `Scanned at ${time}`;
  }

  const datePart = date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
  });

  return `Scanned ${datePart} at ${time}`;
}

function getResourceGroups(data: ChargenData) {
  return Object.values(data).flatMap((d) =>
    Object.values(d),
  ) as ResourceGroup<Resource>[];
}

function getCustomResourceCount(data: ChargenData) {
  return getResourceGroups(data).reduce(
    (total, group) => total + group.custom.length,
    0,
  );
}

function getExcludedResourceCount(data: ChargenData, disabled: string[]) {
  const disabledSet = new Set(disabled);

  return getResourceGroups(data).reduce(
    (total, group) =>
      total +
      group.custom.filter((resource) => disabledSet.has(resource.name)).length,
    0,
  );
}

const revealResults: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    transition: MOTION_TRANSITION.fast,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: MOTION_TRANSITION.slow,
  },
};

function ChargenGenerator() {
  const { scan, status, setScan, setStatus, setError, reset } =
    useChargenStore();
  const { overridePath } = useSettingsStore();
  const disabledResources = useDataStore((state) => state.disabled);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleScan = async () => {
    if (!overridePathGuard(overridePath)) return;

    setStatus("scanning");
    setError(null);
    const toastId = toast.loading("Scanning override folder", {
      description: `Looking for chargen assets in ${shortenPath(overridePath)}.`,
    });

    try {
      const result = await invoke<ChargenScanResult>(
        "scan_for_chargen_assets",
        {
          path: overridePath,
        },
      );
      setScan(result, overridePath);
      setStatus("success");

      const customCount = getCustomResourceCount(result.data);
      toast.success("Scan ready", {
        id: toastId,
        description:
          customCount > 0
            ? `Found ${customCount} ${pluralize(customCount, "custom file")}. Review exclusions before generating.`
            : "No custom chargen files found in this override folder.",
      });
    } catch (error) {
      const errorMessage = String(error);
      setError(errorMessage);
      setStatus("error");
      toast.error("Scan could not read this folder", {
        id: toastId,
        description: errorMessage,
      });
    }
  };

  const handleGenerate = async () => {
    if (!scan) {
      toast.error("Scan this folder before generating");
      return;
    }

    setStatus("generating");
    setError(null);
    const excludedCount = getExcludedResourceCount(
      scan.data,
      disabledResources,
    );
    const toastId = toast.loading("Generating chargenmorphcfg.xml");

    try {
      await invoke("generate_chargen_file", {
        scanId: scan.id,
        path: scan.path,
        disabled: disabledResources,
      });
      setStatus("success");
      toast.success("chargenmorphcfg.xml updated", {
        id: toastId,
        description:
          excludedCount > 0
            ? `${excludedCount} ${pluralize(excludedCount, "custom file")} excluded.`
            : "All scanned custom resources are included.",
      });
    } catch (error) {
      const errorMessage = String(error);
      setError(errorMessage);
      setStatus("error");
      toast.error("Could not generate chargenmorphcfg.xml", {
        id: toastId,
        description: errorMessage,
      });
    }
  };

  const handleClear = async () => {
    if (!scan) return;

    try {
      await invoke("clear_chargen_scan", { scanId: scan.id });
      reset();
      toast.success("Current scan cleared", {
        description: "Your resource exclusions were kept.",
      });
    } catch (error) {
      toast.error("Could not clear the current scan", {
        description: String(error),
      });
    }
  };

  const handleDelete = async () => {
    if (!overridePathGuard(overridePath)) return;

    setDeleteDialogOpen(false);
    setIsDeleting(true);
    const toastId = toast.loading("Deleting all chargenmorphcfg.xml files", {
      description: `Searching ${shortenPath(overridePath)}.`,
    });

    try {
      const count = await invoke<number>("delete_all_chargen_files", {
        path: overridePath,
      });

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
        description: String(error),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const isBusy = status === "scanning" || status === "generating" || isDeleting;
  const canGenerate = Boolean(scan);
  const data = scan?.data ?? null;
  const currentScanTime = scan && canGenerate ? new Date(scan.scannedAt) : null;
  const currentCustomCount =
    data && canGenerate ? getCustomResourceCount(data) : null;
  const generateDisabledReason = isBusy
    ? "Wait for the current operation to finish."
    : !scan
      ? "Scan the override folder before generating."
      : undefined;

  return (
    <div className="mx-auto flex max-w-300 flex-col gap-6 pb-8">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={MOTION_TRANSITION.slow}
        className="flex flex-col items-center justify-between gap-5"
      >
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_1fr]">
          <Button
            size="lg"
            variant={canGenerate ? "outline" : "default"}
            onClick={handleScan}
            disabled={isBusy || !overridePath}
            className="h-11 w-full min-w-40 gap-2 px-4 text-base"
          >
            {status === "scanning" ? (
              <Loader2Icon className="size-5 animate-spin" />
            ) : (
              <SearchIcon className="size-5" />
            )}
            {data ? "Re-Scan" : "Scan"}
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex w-full">
                <Button
                  size="lg"
                  onClick={handleGenerate}
                  disabled={isBusy || !canGenerate}
                  className="h-11 w-full min-w-40 gap-2 px-4 text-base"
                >
                  {status === "generating" ? (
                    <Loader2Icon className="size-5 animate-spin" />
                  ) : (
                    <SaveIcon className="size-5" />
                  )}
                  Generate
                </Button>
              </span>
            </TooltipTrigger>
            {generateDisabledReason && (
              <TooltipContent>
                <CircleAlertIcon className="size-4" />
                {generateDisabledReason}
              </TooltipContent>
            )}
          </Tooltip>
          <Button
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isBusy || !overridePath}
            variant="outline"
            size="lg"
            className="h-11 w-full gap-2 px-4 sm:w-auto"
          >
            {isDeleting ? (
              <Loader2Icon className="size-5 animate-spin" />
            ) : (
              <BrushCleaningIcon className="size-5" />
            )}
            Cleanup
          </Button>
        </div>
        {(currentScanTime || currentCustomCount) && (
          <div className="flex flex-wrap items-center rounded-md bg-muted/70 px-3 py-1.5 text-sm font-semibold text-muted-foreground">
            {currentScanTime && (
              <>
                <ClockIcon className="mr-2 size-4.5" />
                <span>{formatScanTimestamp(currentScanTime)}</span>
              </>
            )}
            {currentCustomCount !== null && (
              <>
                <span className="mx-2.5">·</span>
                <span>
                  {currentCustomCount}{" "}
                  {pluralize(currentCustomCount, "custom resource")} found
                </span>
              </>
            )}
            {scan && (
              <>
                <span className="mx-2.5">·</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex min-w-0 items-center">
                      <FolderIcon className="mr-1.5 size-4 shrink-0" />
                      <span className="max-w-80 truncate font-mono">
                        {shortenPath(scan.path)}
                      </span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md font-mono break-all">
                    {scan.path}
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        )}
      </motion.div>

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
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete}>
              Delete XML Files
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AnimatePresence mode="wait">
        {data ? (
          <motion.div
            key="results"
            variants={revealResults}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <ChargenResults data={data} />
            <Button
              variant="ghost"
              size="lg"
              onClick={handleClear}
              disabled={isBusy}
              className="mt-4 w-full py-6 text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            variants={revealResults}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="flex flex-col items-center justify-center gap-5 rounded-xl border bg-card p-10 text-center"
          >
            <div className="rounded-full bg-muted p-8 text-muted-foreground">
              <Wand2Icon className="size-20" />
            </div>
            <div className="max-w-md">
              <H4 className="mb-2">Scan</H4>
              <P className="text-muted-foreground">
                Scan your override folder to find custom character creation
                resources. You can review exclusions before generating
                chargenmorphcfg.xml.
              </P>
            </div>
            <P className="text-muted-foreground">
              {overridePath
                ? `Ready to scan ${overridePath}.`
                : "Choose an override folder in Settings first."}
            </P>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { ChargenGenerator };
