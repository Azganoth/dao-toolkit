import { toast } from "sonner";

export function requireOverridePath(path: string | null): path is string {
  if (!path) {
    toast.error("Choose an override folder first", {
      description: "Set the Dragon Age override directory in Settings.",
    });
    return false;
  }
  return true;
}
