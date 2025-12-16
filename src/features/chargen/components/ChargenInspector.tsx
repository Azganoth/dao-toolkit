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
import type { HairResource, Resource } from "@/types/chargen";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { FolderOpenIcon } from "lucide-react";

export interface InspectorState {
  open: boolean;
  title: string;
  files: (Resource | HairResource)[];
}

export interface CharenInspectorProps {
  state: InspectorState;
  onOpenChange: (open: boolean) => void;
}

function ChargenInspector({ state, onOpenChange }: CharenInspectorProps) {
  const disabled = useDataStore((state) => state.disabled);
  const toggleResource = useDataStore((state) => state.toggleResource);

  const handleReveal = async (path?: string) => {
    if (path) {
      await revealItemInDir(path);
    }
  };

  return (
    <Dialog open={state.open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[80vh] sm:max-w-lg"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{state.title}</DialogTitle>
          <DialogDescription>
            Found {state.files.length} custom file
            {state.files.length === 1 ? "" : "s"}. Uncheck to exclude from
            generation.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[50vh] rounded-md border p-4">
          {state.files.length > 0 ? (
            <ul className="space-y-2 font-mono text-sm">
              {state.files.map((file, i) => {
                const isExcluded = disabled.includes(file.name);
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
                      onCheckedChange={() => toggleResource(file.name)}
                    />
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                      <span
                        className={cn(
                          "truncate",
                          isExcluded && "text-muted-foreground line-through",
                        )}
                      >
                        {file.name}
                      </span>
                      {file.path && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6 shrink-0"
                              onClick={() => handleReveal(file.path)}
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
    </Dialog>
  );
}

export { ChargenInspector };
