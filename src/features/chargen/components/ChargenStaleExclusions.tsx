import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { P } from "@/components/ui/Typography";
import {
  VirtualList,
  VirtualListContent,
  VirtualListEmpty,
  VirtualListItem,
  VirtualListItems,
} from "@/components/ui/VirtualList";
import { pluralize } from "@/lib/format";
import { Trash2Icon } from "lucide-react";

const STALE_EXCLUSION_ROW_HEIGHT = 40;

interface ChargenStaleExclusionsProps {
  open: boolean;
  names: string[];
  onOpenChange: (open: boolean) => void;
  onClearAll: () => void;
  onRemove: (name: string) => void;
}

function ChargenStaleExclusions({
  open,
  names,
  onOpenChange,
  onClearAll,
  onRemove,
}: ChargenStaleExclusionsProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Stale Exclusions</DialogTitle>
          <DialogDescription>
            These resources are still saved as excluded, but they were not found
            in the current scan. You can keep them for future scans or remove
            the saved exclusions here.{" "}
            <strong>Stale resources will not affect generation!</strong>
          </DialogDescription>
        </DialogHeader>

        <VirtualList
          items={names}
          estimateHeight={STALE_EXCLUSION_ROW_HEIGHT}
          getItemKey={(name) => name}
          className="h-[50vh] rounded-md border p-4"
        >
          <VirtualListContent className="font-mono text-sm">
            <VirtualListItems<string>>
              {(name, virtualRow) => (
                <VirtualListItem
                  key={virtualRow.key}
                  virtualRow={virtualRow}
                  asChild
                >
                  <li className="flex h-9 items-center justify-between gap-3 rounded-md bg-muted/60 px-3 text-muted-foreground">
                    <p className="truncate line-through">{name}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemove(name)}
                    >
                      <Trash2Icon className="size-4" />
                      <span className="sr-only">Remove saved exclusion</span>
                    </Button>
                  </li>
                </VirtualListItem>
              )}
            </VirtualListItems>
          </VirtualListContent>
          <VirtualListEmpty>
            <P className="text-muted-foreground">
              No stale exclusions for this scan.
            </P>
          </VirtualListEmpty>
        </VirtualList>

        <DialogFooter className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            <span className="font-mono text-foreground">{names.length}</span>{" "}
            stale {pluralize(names.length, "exclusion")}
          </div>
          <Button
            variant="outline"
            onClick={onClearAll}
            disabled={names.length === 0}
          >
            Clear All Stale Exclusions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { ChargenStaleExclusions };
