import { cn } from "@/lib/cn";
import type { ComponentProps } from "react";

export function H1({ className, ...props }: ComponentProps<"h1">) {
  return (
    <h1
      className={cn(
        "scroll-m-20 text-center font-display text-4xl font-extrabold tracking-tight text-balance",
        className,
      )}
      {...props}
    />
  );
}

export function H2({ className, ...props }: ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "scroll-m-20 border-b pb-2 font-display text-3xl font-semibold tracking-tight first:mt-0",
        className,
      )}
      {...props}
    />
  );
}

export function H3({ className, ...props }: ComponentProps<"h3">) {
  return (
    <h3
      className={cn(
        "scroll-m-20 font-display text-2xl font-semibold tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

export function H4({ className, ...props }: ComponentProps<"h4">) {
  return (
    <h4
      className={cn(
        "scroll-m-20 font-display text-xl font-semibold tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

export function P({ className, ...props }: ComponentProps<"p">) {
  return (
    <p className={cn("text-base leading-relaxed", className)} {...props} />
  );
}

export function Lead({ className, ...props }: ComponentProps<"p">) {
  return (
    <p className={cn("text-xl text-muted-foreground", className)} {...props} />
  );
}

export function Large({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("text-lg font-semibold", className)} {...props} />;
}

export function Small({ className, ...props }: ComponentProps<"small">) {
  return (
    <small
      className={cn("text-sm leading-none font-medium", className)}
      {...props}
    />
  );
}

export function Muted({ className, ...props }: ComponentProps<"p">) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
}

export function Overline({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "text-xs font-semibold tracking-widest text-muted-foreground uppercase",
        className,
      )}
      {...props}
    />
  );
}
