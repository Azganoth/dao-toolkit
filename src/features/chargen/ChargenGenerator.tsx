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
import { overridePathGuard, pluralize, shortenPath } from "@/lib/utils";
import { useDataStore } from "@/stores/data";
import { useSettingsStore } from "@/stores/settings";
import {
  type ChargenData,
  type Resource,
  type ResourceGroup,
} from "@/types/chargen";
import { invoke } from "@tauri-apps/api/core";
import {
  BrushCleaningIcon,
  CircleAlertIcon,
  ClockIcon,
  Loader2Icon,
  SaveIcon,
  SearchIcon,
  Wand2Icon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
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

function ChargenGenerator() {
  const {
    path: scanPath,
    data,
    status,
    setData,
    setPath,
    setStatus,
    setError,
    reset,
  } = useChargenStore();
  const { overridePath } = useSettingsStore();
  const disabledResources = useDataStore((state) => state.disabled);

  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!scanPath || scanPath === overridePath) return;

    reset();
  }, [reset, scanPath, overridePath]);

  const handleScan = async () => {
    if (!overridePathGuard(overridePath)) return;

    setStatus("scanning");
    setError(null);
    const toastId = toast.loading("Scanning override folder", {
      description: `Looking for chargen assets in ${shortenPath(overridePath)}.`,
    });

    try {
      setPath(overridePath);
      const result = await invoke<ChargenData>("scan_for_chargen_assets", {
        path: overridePath,
      });
      setData(result);
      setStatus("success");
      setLastScanTime(new Date());

      const customCount = getCustomResourceCount(result);
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
    if (!overridePathGuard(overridePath)) return;

    if (!data) {
      toast.error("Scan this folder before generating");
      return;
    }

    setStatus("generating");
    setError(null);
    const excludedCount = getExcludedResourceCount(data, disabledResources);
    const toastId = toast.loading("Generating chargenmorphcfg.xml");

    try {
      await invoke("generate_chargen_file", {
        path: overridePath,
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

  const handleClear = () => {
    reset();
    setLastScanTime(null);
    toast.success("Current scan cleared", {
      description: "Your resource exclusions were kept.",
    });
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
  const canGenerate = Boolean(
    data && overridePath && scanPath === overridePath,
  );
  const currentScanTime =
    scanPath && scanPath === overridePath ? lastScanTime : null;
  const currentCustomCount =
    data && canGenerate ? getCustomResourceCount(data) : null;
  const generateDisabledReason = isBusy
    ? "Wait for the current operation to finish."
    : !data
      ? "Scan the override folder before generating."
      : scanPath !== overridePath
        ? "Override path changed. Scan this folder again."
        : undefined;

  return (
    <div className="mx-auto flex max-w-300 flex-col gap-6 pb-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col items-center justify-between gap-5 lg:flex-row"
      >
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ChargenResults data={data} />
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
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
      {data && (
        <Button
          variant="ghost"
          size="lg"
          onClick={handleClear}
          disabled={isBusy}
          className="py-6 text-muted-foreground hover:text-foreground"
        >
          Clear
        </Button>
      )}
    </div>
  );
}

export { ChargenGenerator };
