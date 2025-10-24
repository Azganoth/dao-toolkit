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
import { motion, stagger, type Variants } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

const revealVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

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

  const themes: {
    value: typeof theme;
    label: string;
    Icon: React.JSXElementConstructor<any>;
  }[] = [
    { value: "light", label: "Light", Icon: SunIcon },
    { value: "dark", label: "Dark", Icon: MoonIcon },
    { value: "system", label: "System", Icon: LaptopIcon },
  ];

  return (
    <motion.div
      className="mx-auto flex max-w-[800px] flex-col gap-10 pb-10"
      transition={{ delayChildren: stagger(0.15) }}
      initial="hidden"
      animate="visible"
    >
      {/* File System Section */}
      <motion.section className="space-y-4" variants={revealVariants}>
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
      </motion.section>

      {/* Interface Section */}
      <motion.section className="space-y-4" variants={revealVariants}>
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
              {themes.map(({ value, label, Icon }) => (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "rounded-none px-3 first:rounded-l-sm last:rounded-r-sm",
                    theme === value &&
                      "text-primary shadow-sm hover:text-primary",
                  )}
                  onClick={() => setTheme(value)}
                >
                  <Icon className="size-4" />
                  {label}
                </Button>
              ))}
            </div>
          </Field>
        </Card>
      </motion.section>

      {/* Data Management Section (Danger Zone) */}
      <motion.section className="space-y-4" variants={revealVariants}>
        <Overline className="text-destructive">Data Management</Overline>
        <Card className="border-destructive/20 bg-destructive/5">
          {/* Reset Settings */}
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel>Reset Settings</FieldLabel>
              <FieldDescription>
                Restore default configuration.
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
                Permanently remove all cached data and temporary files.
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
      </motion.section>
    </motion.div>
  );
}

export { Settings };
