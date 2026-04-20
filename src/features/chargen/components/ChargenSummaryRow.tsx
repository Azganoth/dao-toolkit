import { Button } from "@/components/ui/Button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
import type { Resource, ResourceGroup } from "@/types/chargen";
import { ListChecksIcon } from "lucide-react";

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
        <span className="font-mono">{data.custom.length}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => onInspect(label, data.custom)}
            >
              <ListChecksIcon className="size-5" />
              <span className="sr-only">Choose custom files for {label}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Manage resource exclusions</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

export { ChargenSummaryRow };
