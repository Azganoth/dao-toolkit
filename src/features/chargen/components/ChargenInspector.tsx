import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { ScrollArea } from "@/components/ui/ScrollArea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";
import { useDataStore } from "@/stores/data";
import type { Resource } from "@/types/chargen";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { FolderOpenIcon } from "lucide-react";
import { useState } from "react";

export interface InspectorData {
  title: string;
  resources: Resource[];
}

export interface CharenInspectorProps {
  data?: InspectorData | null;
  onClose?: () => void;
}

function ChargenInspector({ data, onClose }: CharenInspectorProps) {
  const disabledResources = useDataStore((state) => state.disabled);
  const toggleResource = useDataStore((state) => state.toggleResource);

  const handleReveal = async (path?: string) => {
    if (path) {
      await revealItemInDir(path);
    }
  };

  const [activeData, setActiveData] = useState(data);

  if (data && data !== activeData) {
    setActiveData(data);
  }

  const displayData = data || activeData;

  return (
    <Dialog
      open={!!data}
      onOpenChange={(open) => {
        if (!open) {
          onClose?.();
        }
      }}
    >
      {displayData && (
        <DialogContent
          className="max-h-[80vh] sm:max-w-lg"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{displayData.title}</DialogTitle>
            <DialogDescription>
              Found {displayData.resources.length} custom file
              {displayData.resources.length === 1 ? "" : "s"}. Uncheck to
              exclude from generation.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[50vh] rounded-md border p-4">
            {displayData.resources.length > 0 ? (
              <ul className="space-y-2 font-mono text-sm">
                {displayData.resources.map((resource, i) => {
                  const isExcluded = disabledResources.includes(resource.name);
                  return (
                    <li
                      key={i}
                      className={cn(
                        "flex items-center gap-3 rounded bg-muted/50 p-3",
                        isExcluded && "opacity-60",
                      )}
                    >
                      <Checkbox
                        size="lg"
                        checked={!isExcluded}
                        onCheckedChange={() => toggleResource(resource.name)}
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
                        {resource.path && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 shrink-0"
                                onClick={() => handleReveal(resource.path)}
                              >
                                <FolderOpenIcon className="size-5" />
                                <span className="sr-only">
                                  Open file location
                                </span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Open file location</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No files found.</p>
            )}
          </ScrollArea>
        </DialogContent>
      )}
    </Dialog>
  );
}

export { ChargenInspector };
