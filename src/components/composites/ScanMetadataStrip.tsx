/* v8 ignore file */
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
import { formatScanTimestamp } from "@/lib/format";
import { shortenPath } from "@/lib/paths";

interface ScanMetadataStripProps {
  path: string;
  scannedAt: string;
  additionalMetadata: string[];
}

function ScanMetadataStrip({
  path,
  scannedAt,
  additionalMetadata,
}: ScanMetadataStripProps) {
  const scanTime = new Date(scannedAt);

  return (
    <div className="flex w-full min-w-0 flex-wrap items-center justify-center gap-2 rounded-md bg-card px-3 py-2 text-sm font-semibold text-muted-foreground">
      <span>Scanned at {formatScanTimestamp(scanTime)}</span>
      {additionalMetadata.map((metadata) => (
        <span key={metadata} className="contents">
          <span aria-hidden="true">·</span>
          <span>{metadata}</span>
        </span>
      ))}
      <span aria-hidden="true">·</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="min-w-0 truncate font-mono">
            {shortenPath(path)}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-md font-mono break-all">
          {path}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export { ScanMetadataStrip };
