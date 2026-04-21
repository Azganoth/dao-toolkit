import { Button } from "@/components/ui/Button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
import type { ChargenInspectorTarget } from "@/features/chargen/components/ChargenInspector";
import type { Resource, ResourceGroup } from "@/types/chargen";
import { ListChecksIcon } from "lucide-react";

export interface ChargenSummaryRowProps {
  title: string;
  resourceGroup: ResourceGroup<Resource>;
  onInspect: (target: ChargenInspectorTarget) => void;
}

function ChargenSummaryRow({
  title,
  resourceGroup,
  onInspect,
}: ChargenSummaryRowProps) {
  const { custom: resources } = resourceGroup;

  return (
    <div className="flex items-center justify-between">
      <span className="text-base font-medium">{title}</span>
      <div className="flex items-center gap-3">
        <span className="font-mono">{resources.length}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => onInspect({ title, resources })}
            >
              <ListChecksIcon className="size-5" />
              <span className="sr-only">Choose custom files for {title}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Manage resource exclusions</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

export { ChargenSummaryRow };
