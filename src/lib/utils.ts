import { type ClassValue, clsx } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function overridePathGuard(path: string | null): path is string {
  if (!path) {
    toast.error("Override path is not set.", {
      description: "Please set the override path in the settings.",
    });
    return false;
  }
  return true;
}
