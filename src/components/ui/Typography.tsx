import { cn } from "@/lib/utils";
import * as React from "react";

export function Overline({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "text-sm font-medium tracking-wider text-muted-foreground uppercase",
        className,
      )}
      {...props}
    />
  );
}
