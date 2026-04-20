import { Button } from "@/components/ui/Button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
import type { HairResource, Resource } from "@/types/chargen";
import { EyeIcon } from "lucide-react";

export interface ChargenStatRowProps {
  label: string;
  total: number;
  files: (Resource | HairResource)[];
  onInspect: (title: string, files: (Resource | HairResource)[]) => void;
}

function ChargenStatRow({
  label,
  total,
  files,
  onInspect,
}: ChargenStatRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-base font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <span className="font-mono text-base text-muted-foreground">
          {total} <span className="text-foreground">(+{files.length})</span>
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              disabled={files.length === 0}
              onClick={() => onInspect(label, files)}
            >
              <EyeIcon className="size-5" />
              <span className="sr-only">View custom files</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>View custom files</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

export { ChargenStatRow };
