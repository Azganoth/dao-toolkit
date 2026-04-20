import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { useVirtualizer } from "@tanstack/react-virtual";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { FolderOpenIcon } from "lucide-react";
import { useCallback, useState } from "react";

const RESOURCE_ROW_HEIGHT = 40;

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
  const setResourcesDisabled = useDataStore(
    (state) => state.setResourcesDisabled,
  );
  const toggleResource = useDataStore((state) => state.toggleResource);
  const [viewportElement, setViewportElement] = useState<HTMLDivElement | null>(
    null,
  );
  const setViewportRef = useCallback((element: HTMLDivElement | null) => {
    setViewportElement(element);
  }, []);

  const handleReveal = async (path?: string) => {
    if (path) {
      await revealItemInDir(path);
    }
  };

  const [activeData, setActiveData] = useState(data);

  if (data && data !== activeData) {
    setActiveData(data);
  }

  const { title, resources } = data ||
    activeData || { title: "", resources: [] };
  const excludedCount = resources.filter((resource) =>
    disabledResources.includes(resource.name),
  ).length;
  const resourceNames = resources.map((resource) => resource.name);

  // TanStack Virtual returns instance methods that React Compiler cannot memoize safely.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: resources.length,
    estimateSize: () => RESOURCE_ROW_HEIGHT,
    getItemKey: (index) => resources[index]?.name ?? index,
    getScrollElement: () => viewportElement,
    overscan: 8,
  });

  return (
    <Dialog
      open={!!data}
      onOpenChange={(open) => {
        if (!open) {
          onClose?.();
        }
      }}
    >
      <DialogContent
        className="max-h-[80vh] sm:max-w-lg"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Choose which resources will show in the character creation.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea
          viewportRef={setViewportRef}
          className="h-[50vh] rounded-md border p-4"
        >
          {resources.length > 0 ? (
            <ul
              className="relative font-mono text-sm"
              style={{ height: `${virtualizer.getTotalSize()}px` }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const resource = resources[virtualItem.index];
                const isExcluded = disabledResources.includes(resource.name);
                return (
                  <li
                    key={virtualItem.key}
                    className={cn(
                      "absolute top-0 left-0 flex h-9 w-full items-center gap-3 rounded-md bg-muted px-3",
                    )}
                    style={{
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
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
            <p className="text-sm text-muted-foreground">
              No custom resources found for this group.
            </p>
          )}
        </ScrollArea>
        {resources.length > 0 && (
          <DialogFooter className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              <span className="font-mono text-foreground">{excludedCount}</span>{" "}
              of{" "}
              <span className="font-mono text-foreground">
                {resources.length}
              </span>{" "}
              excluded
            </div>
            <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
              <Button
                variant="outline"
                onClick={() => setResourcesDisabled(resourceNames, false)}
                disabled={excludedCount === 0}
              >
                Include All
              </Button>
              <Button
                variant="outline"
                onClick={() => setResourcesDisabled(resourceNames, true)}
                disabled={excludedCount === resources.length}
              >
                Exclude All
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export { ChargenInspector };
