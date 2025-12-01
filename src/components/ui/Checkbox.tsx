"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";
import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

const checkboxContainerVariants = cva(
  "peer shrink-0 rounded-[4px] border border-input shadow-xs transition-shadow outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:bg-input/30 dark:aria-invalid:ring-destructive/40 dark:data-[state=checked]:bg-primary",
  {
    variants: {
      size: {
        sm: "size-3.5",
        md: "size-4",
        lg: "size-5",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

const checkboxIndicatorVariants = cva(
  "grid place-content-center text-current transition-none",
  {
    variants: {
      size: {
        sm: "[&_svg]:size-3",
        md: "[&_svg]:size-3.5",
        lg: "[&_svg]:size-4",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

function Checkbox({
  className,
  size,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root> &
  VariantProps<typeof checkboxContainerVariants>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={checkboxContainerVariants({ size, className })}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className={checkboxIndicatorVariants({ size })}
      >
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
