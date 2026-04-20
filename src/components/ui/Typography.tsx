import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export function Overline({ className, ...props }: ComponentProps<"div">) {
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
