import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/Field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/InputGroup";
import { Separator } from "@/components/ui/Separator";
import { Overline } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";
import { useDataStore } from "@/stores/data";
import { useSettingsStore } from "@/stores/settings";
import { open } from "@tauri-apps/plugin-dialog";
import {
  FolderOpenIcon,
  LaptopIcon,
  MoonIcon,
  RotateCcwIcon,
  SunIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function Settings() {
  const overridePath = useSettingsStore((state) => state.overridePath);
  const setOverridePath = useSettingsStore((state) => state.setOverridePath);

  const selectFolder = async () => {
    const path = await open({
      directory: true,
      defaultPath: overridePath ?? undefined,
    });
    if (!path) return;

    setOverridePath(path);
  };

  // Theme
  const theme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);

  // Reset Settings
  const resetSettings = useSettingsStore((state) => state.reset);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const handleResetSettings = async () => {
    setResetDialogOpen(false);
    resetSettings();
    toast.success("Settings have been reset to their defaults.");
  };

  // Delete Data
  const resetData = useDataStore((state) => state.reset);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteData = async () => {
    setDeleteDialogOpen(false);
    resetData();
    toast.success("All application data has been deleted.");
  };

  return (
    <div className="mx-auto flex max-w-[800px] flex-col gap-10 pb-10">
      {/* File System Section */}
      <section className="space-y-4">
        <Overline>File System</Overline>
        <Card>
          <Field>
            <FieldContent>
              <FieldLabel>Override Directory</FieldLabel>
              <FieldDescription>
                The location where your Dragon Age: Origins mods are installed.
              </FieldDescription>
            </FieldContent>
            <InputGroup>
              <InputGroupInput
                type="text"
                value={overridePath ?? ""}
                placeholder="Select your Dragon Age override folder..."
                className="font-mono"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton onClick={selectFolder}>
                  <FolderOpenIcon className="size-4" />
                  Browse
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </Field>
        </Card>
      </section>

      {/* Interface Section */}
      <section className="space-y-4">
        <Overline>Interface</Overline>
        <Card>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel>Theme</FieldLabel>
              <FieldDescription>
                Choose the appearance of the application.
              </FieldDescription>
            </FieldContent>
            <div className="flex items-center rounded-md border p-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-none px-3 first:rounded-l-sm last:rounded-r-sm",
                  theme === "light" &&
                    "bg-background text-foreground shadow-sm not-dark:text-primary",
                )}
                onClick={() => setTheme("light")}
              >
                <SunIcon className="size-4" />
                Light
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-none px-3 first:rounded-l-sm last:rounded-r-sm",
                  theme === "system" &&
                    "bg-background text-foreground shadow-sm not-dark:text-primary",
                )}
                onClick={() => setTheme("system")}
              >
                <LaptopIcon className="size-4" />
                System
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-none px-3 first:rounded-l-sm last:rounded-r-sm",
                  theme === "dark" &&
                    "bg-background text-foreground shadow-sm not-dark:text-primary",
                )}
                onClick={() => setTheme("dark")}
              >
                <MoonIcon className="size-4" />
                Dark
              </Button>
            </div>
          </Field>
        </Card>
      </section>

      {/* Data Management Section (Danger Zone) */}
      <section className="space-y-4">
        <Overline className="text-destructive">Data Management</Overline>
        <Card className="border-destructive/20 bg-destructive/5">
          {/* Reset Settings */}
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel>Reset Settings</FieldLabel>
              <FieldDescription>
                Restore default configuration. Your scan data will be preserved.
              </FieldDescription>
            </FieldContent>
            <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="py-5">
                  <RotateCcwIcon className="size-4" />
                  Reset Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Reset all settings?</DialogTitle>
                  <DialogDescription>
                    This will revert your theme and directory preferences to
                    default.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button variant="destructive" onClick={handleResetSettings}>
                    Reset
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Field>

          <Separator className="bg-destructive/10" />

          {/* Delete Data */}
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel>Clear App Data</FieldLabel>
              <FieldDescription>
                Permanently remove all cached scan results and temporary files.
              </FieldDescription>
            </FieldContent>
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm" className="py-5">
                  <Trash2Icon className="size-4" />
                  Clear Data
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Clear all application data?</DialogTitle>
                  <DialogDescription>
                    This will remove all scanned asset data from the application
                    cache. You will need to rescan your folders.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button variant="destructive" onClick={handleDeleteData}>
                    Clear Data
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Field>
        </Card>
      </section>
    </div>
  );
}

export { Settings };
