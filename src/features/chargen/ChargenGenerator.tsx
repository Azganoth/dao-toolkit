import { Button } from "@/components/ui/Button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
import { useChargenStore } from "@/features/chargen/stores/chargen";
import { overridePathGuard } from "@/lib/utils";
import { useDataStore } from "@/stores/data";
import { useSettingsStore } from "@/stores/settings";
import { type ChargenManifest, type ChargenStats } from "@/types/chargen";
import { invoke } from "@tauri-apps/api/core";
import {
  BrushCleaningIcon,
  Loader2Icon,
  SaveIcon,
  SearchIcon,
  Wand2Icon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { ChargenResults } from "./components/ChargenResults";

function ChargenGenerator() {
  const { stats, manifest, status, setStats, setPath, setStatus, setError } =
    useChargenStore();
  const { overridePath } = useSettingsStore();
  const disabledResources = useDataStore((state) => state.disabled);

  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);

  const handleScan = async () => {
    if (!overridePathGuard(overridePath)) return;

    setStatus("scanning");
    setError(null);

    try {
      setPath(overridePath);
      const result = await invoke<[ChargenStats, ChargenManifest]>(
        "scan_for_chargen_assets",
        { path: overridePath },
      );
      setStats(result[0], result[1]);
      setStatus("success");
      toast.success("Scan complete.");
    } catch (error) {
      const errorMessage = String(error);
      setError(errorMessage);
      setStatus("error");
      toast.error("Scan failed.", { description: errorMessage });
    } finally {
      setLastScanTime(new Date());
    }
  };

  const handleGenerate = async () => {
    if (!overridePathGuard(overridePath)) return;

    if (!stats) {
      toast.error("No scan data found.", {
        description: "Please run a scan first.",
      });
      return;
    }

    setStatus("generating");
    setError(null);

    try {
      await invoke("generate_chargen_file", { disabled: disabledResources });
      setStatus("success");
      toast.success("chargenmorphcfg.xml generated successfully.");
    } catch (error) {
      const errorMessage = String(error);
      setError(errorMessage);
      setStatus("error");
      toast.error("Failed to generate file.", {
        description: errorMessage,
      });
    }
  };

  const handleDelete = async () => {
    if (!overridePathGuard(overridePath)) return;

    toast.promise(
      invoke<number>("delete_all_chargen_files", { path: overridePath }),
      {
        loading: "Deleting existing config files...",
        success: (count) => `Deleted ${count} chargenmorphcfg.xml file(s).`,
        error: (err) => `Failed to delete files: ${err}`,
      },
    );
  };

  const isBusy = status === "scanning" || status === "generating";

  return (
    <div className="mx-auto flex max-w-[800px] flex-col gap-8 pb-8">
      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col gap-6 p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-4">
          <Button
            size="lg"
            onClick={handleScan}
            disabled={isBusy || !overridePath}
            className="w-32"
          >
            {status === "scanning" ? (
              <Loader2Icon className="size-5 animate-spin" />
            ) : (
              <SearchIcon className="size-5" />
            )}
            Scan
          </Button>
          <Button
            size="lg"
            onClick={handleGenerate}
            disabled={isBusy || !stats}
            variant="outline"
            className="w-32"
          >
            {status === "generating" ? (
              <Loader2Icon className="size-5 animate-spin" />
            ) : (
              <SaveIcon className="size-5" />
            )}
            Generate
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleDelete}
                disabled={isBusy || !overridePath}
                variant="ghost"
                size="icon-lg"
                className="ml-auto text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <BrushCleaningIcon className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete existing chargenmorphcfg.xml files</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <p className="text-sm text-muted-foreground max-sm:px-2">
          {lastScanTime && (
            <span>Last scan: {lastScanTime.toLocaleString()}</span>
          )}
        </p>
      </motion.div>

      {/* Content Section */}
      <AnimatePresence mode="wait">
        {stats && manifest ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="mb-4 text-center text-lg font-bold">Scan results</h2>
            <ChargenResults stats={stats} manifest={manifest} />
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-muted/30 p-12"
          >
            <div className="rounded-full bg-muted p-4">
              <Wand2Icon className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="max-w-xs text-center">
              <h3 className="mb-4 font-medium">No Assets Loaded</h3>
              <p className="text-sm text-muted-foreground">
                Set your override directory in Settings and click Scan to begin.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { ChargenGenerator };
