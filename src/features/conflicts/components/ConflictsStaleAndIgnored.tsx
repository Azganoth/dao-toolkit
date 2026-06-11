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
import { pluralize } from "@/lib/format";
import type { IgnoredResourceConflict } from "@/types/conflicts";
import { RotateCcwIcon, XIcon } from "lucide-react";

interface ConflictsStaleAndIgnoredProps {
  open: boolean;
  ignored: IgnoredResourceConflict[];
  stale: IgnoredResourceConflict[];
  onOpenChange: (open: boolean) => void;
  onRestore: (id: string) => void;
}

function ConflictsStaleAndIgnored({
  open,
  ignored,
  stale,
  onOpenChange,
  onRestore,
}: ConflictsStaleAndIgnoredProps) {
  const staleIds = new Set(stale.map((conflict) => conflict.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ignored conflict groups</DialogTitle>
          <DialogDescription>
            Restore ignored groups or remove stale entries that no longer match
            the current scan.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto rounded-md border p-2">
          {ignored.length > 0 ? (
            ignored.map((conflict) => (
              <div
                key={conflict.id}
                className="flex min-w-0 items-center justify-between gap-3 rounded-md px-2 py-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-mono text-sm">
                      {conflict.name}
                    </span>
                    {staleIds.has(conflict.id) && (
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        stale
                      </span>
                    )}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {conflict.sources.length}{" "}
                    {pluralize(conflict.sources.length, "source")}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRestore(conflict.id)}
                >
                  {staleIds.has(conflict.id) ? <XIcon /> : <RotateCcwIcon />}
                  {staleIds.has(conflict.id) ? "Remove stale" : "Restore"}
                </Button>
              </div>
            ))
          ) : (
            <p className="p-4 text-center text-sm text-muted-foreground">
              No conflict groups have been ignored.
            </p>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="xl">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { ConflictsStaleAndIgnored };
