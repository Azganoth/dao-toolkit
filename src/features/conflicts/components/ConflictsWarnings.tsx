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
import type { ConflictWarning } from "@/types/conflicts";
import { AlertTriangleIcon } from "lucide-react";

interface ConflictWarningsProps {
  open: boolean;
  warnings: ConflictWarning[];
  onOpenChange: (open: boolean) => void;
}

function ConflictWarnings({
  open,
  warnings,
  onOpenChange,
}: ConflictWarningsProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Scan warnings</DialogTitle>
          <DialogDescription>
            These files could not be read or parsed, but the rest of the scan
            completed.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto rounded-md border p-2">
          {warnings.map((warning) => (
            <div
              key={`${warning.path}:${warning.message}`}
              className="flex gap-2 rounded-md px-2 py-2 text-sm"
            >
              <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <div className="truncate font-mono">{warning.path}</div>
                <div className="text-muted-foreground">{warning.message}</div>
              </div>
            </div>
          ))}
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

export { ConflictWarnings };
