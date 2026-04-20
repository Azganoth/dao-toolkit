import { type ClassValue, clsx } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function overridePathGuard(path: string | null): path is string {
  if (!path) {
    toast.error("Choose an override folder first", {
      description: "Set the Dragon Age override directory in Settings.",
    });
    return false;
  }
  return true;
}

export function pluralize(
  count: number,
  singular: string,
  plural = `${singular}s`,
) {
  return count === 1 ? singular : plural;
}

const SEPARATOR = "/";

export function shortenPath(path: string) {
  const normalized = path.replace(/[\\/]+/g, SEPARATOR);
  const parts = normalized.split(SEPARATOR).filter(Boolean);

  if (parts.length <= 5) return normalized;

  const tail = parts.slice(-4).join(SEPARATOR);
  const drive = normalized.match(/^[A-Za-z]:/)?.at(0);

  if (normalized.startsWith(`${SEPARATOR}${SEPARATOR}`) && parts.length > 5) {
    return `${SEPARATOR}${SEPARATOR}${parts[0]}${SEPARATOR}${parts[1]}${SEPARATOR}...${SEPARATOR}${tail}`;
  }

  if (drive) {
    return `${drive}${SEPARATOR}...${SEPARATOR}${tail}`;
  }

  if (normalized.startsWith(SEPARATOR)) {
    return `${SEPARATOR}...${SEPARATOR}${tail}`;
  }

  return `...${SEPARATOR}${tail}`;
}
