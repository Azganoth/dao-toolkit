import { Button } from "@/components/ui/Button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
import type { Resource, ResourceGroup } from "@/types/chargen";
import { EyeIcon } from "lucide-react";

export interface ChargenSummaryRowProps {
  label: string;
  data: ResourceGroup<Resource>;
  onInspect: (title: string, resources: Resource[]) => void;
}

function ChargenSummaryRow({ label, data, onInspect }: ChargenSummaryRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-base font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <span className="font-mono text-base text-muted-foreground">
          {data.total}{" "}
          <span className="text-foreground">(+{data.custom.length})</span>
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              disabled={data.custom.length === 0}
              onClick={() => onInspect(label, data.custom)}
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

export { ChargenSummaryRow };
