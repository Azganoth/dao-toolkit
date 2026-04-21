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
import { cn } from "@/lib/cn";
import { useDataStore } from "@/stores/data";
import type { Resource } from "@/types/chargen";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { FolderOpenIcon } from "lucide-react";
import { useMemo, useState } from "react";

const RESOURCE_ROW_HEIGHT = 40;

export interface ChargenInspectorTarget {
  title: string;
  resources: Resource[];
}

export interface CharenInspectorProps {
  target?: ChargenInspectorTarget | null;
  onClose?: () => void;
}

function ChargenInspector({ target, onClose }: CharenInspectorProps) {
  const [activeTarget, setActiveData] = useState(target);
  if (target && target !== activeTarget) {
    setActiveData(target);
  }

  const { title, resources } = target ||
    activeTarget || { title: "", resources: [] };
  const resourceNames = useMemo(
    () => resources.map((resource) => resource.name),
    [resources],
  );

  const disabledResources = useDataStore((state) => state.disabled);
  const setResourcesDisabled = useDataStore(
    (state) => state.setResourcesDisabled,
  );
  const toggleResource = useDataStore((state) => state.toggleResource);
  const disabledResourcesSet = useMemo(
    () => new Set(disabledResources),
    [disabledResources],
  );

  const excludedCount = resources.filter((resource) =>
    disabledResourcesSet.has(resource.name),
  ).length;

  const handleRevealResource = async (path?: string) => {
    if (path) {
      await revealItemInDir(path);
    }
  };

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
        className="max-h-[80vh] sm:max-w-lg"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Choose which resources will show in the character creation.
          </DialogDescription>
        </DialogHeader>
        <VirtualList
          items={resources}
          estimateHeight={RESOURCE_ROW_HEIGHT}
          getItemKey={(resource) => resource.name}
          className="h-[50vh] rounded-md border p-4"
        >
          <VirtualListContent className="font-mono text-sm">
            <VirtualListItems<Resource>>
              {(resource, virtualRow) => {
                const isExcluded = disabledResourcesSet.has(resource.name);

                return (
                  <VirtualListItem
                    key={virtualRow.key}
                    virtualRow={virtualRow}
                    asChild
                  >
                    <li className="flex h-9 items-center gap-3 rounded-md bg-muted px-3">
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
                                onClick={() =>
                                  handleRevealResource(resource.path)
                                }
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
                  </VirtualListItem>
                );
              }}
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
