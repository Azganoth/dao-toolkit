import { Button } from "@/components/ui/Button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
import { cn } from "@/lib/cn";
import { ChevronsDownUpIcon, ChevronsUpDownIcon } from "lucide-react";

interface ExpandCollapseControlsProps {
  onExpandAll: () => void;
  onCollapseAll: () => void;
  expandDisabled?: boolean;
  collapseDisabled?: boolean;
  itemLabel?: string;
  size?: "icon-lg" | "icon-xl";
  className?: string;
}

function ExpandCollapseControls({
  onExpandAll,
  onCollapseAll,
  expandDisabled = false,
  collapseDisabled = false,
  itemLabel = "groups",
  size = "icon-lg",
  className,
}: ExpandCollapseControlsProps) {
  const expandLabel = `Expand all ${itemLabel}`;
  const collapseLabel = `Collapse all ${itemLabel}`;

  return (
    <div className={cn("flex items-center justify-end gap-1", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size={size}
            onClick={onExpandAll}
            disabled={expandDisabled}
          >
            <ChevronsUpDownIcon />
            <span className="sr-only">{expandLabel}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>{expandLabel}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size={size}
            onClick={onCollapseAll}
            disabled={collapseDisabled}
          >
            <ChevronsDownUpIcon />
            <span className="sr-only">{collapseLabel}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>{collapseLabel}</TooltipContent>
      </Tooltip>
    </div>
  );
}

export { ExpandCollapseControls };
