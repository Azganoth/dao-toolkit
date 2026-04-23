import { Button } from "@/components/ui/Button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
import type { ChargenInspectorSelection } from "@/features/chargen/components/ChargenInspector";
import { useExcludedResourcesSet } from "@/stores/data";
import type { Resource, ResourceGroup } from "@/types/chargen";
import { ListChecksIcon } from "lucide-react";

export interface ChargenSummaryRowProps {
  title: string;
  resourceGroup: ResourceGroup<Resource>;
  onInspect: (selection: ChargenInspectorSelection) => void;
}

function ChargenSummaryRow({
  title,
  resourceGroup,
  onInspect,
}: ChargenSummaryRowProps) {
  const { custom: resources } = resourceGroup;
  const disabledResourcesSet = useExcludedResourcesSet();
  const excludedResourcesCount = resources.filter((resource) =>
    disabledResourcesSet.has(resource.name),
  ).length;

  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <span className="min-w-0 truncate font-medium">{title}</span>
      <div className="flex shrink-0 items-center gap-2 font-mono text-sm">
        {excludedResourcesCount > 0 && (
          <span className="rounded-sm bg-muted px-1.5 py-0.5 text-muted-foreground">
            {excludedResourcesCount.toLocaleString()} excluded
          </span>
        )}
        <span className="rounded-sm bg-primary/50 px-1.5 py-0.5">
          {resources.length.toLocaleString()} items
        </span>
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
