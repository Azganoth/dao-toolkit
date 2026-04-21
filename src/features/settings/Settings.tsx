import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
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
  type LucideIcon,
} from "lucide-react";
import { motion, stagger, type Variants } from "motion/react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

const revealContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: stagger(0.12),
    },
  },
};

const revealItem: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
  },
  visible: {
    opacity: 1,
    y: 0,
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

  // Appearance
  const theme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);

  const reduceMotion = useSettingsStore((state) => state.reduceMotion);
  const setReduceMotion = useSettingsStore((state) => state.setReduceMotion);

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
    Icon: LucideIcon;
  }[] = [
    { value: "light", label: "Light", Icon: SunIcon },
    { value: "dark", label: "Dark", Icon: MoonIcon },
    { value: "system", label: "System", Icon: LaptopIcon },
  ];

  return (
    <motion.div
      className="mx-auto flex max-w-200 flex-col gap-8 pb-10"
      variants={revealContainer}
      initial="hidden"
      animate="visible"
    >
      {/* File System Section */}
      <SettingsSection title="File System">
        <Field>
          <FieldContent>
            <FieldLabel htmlFor="settings-override-path">
              Override Directory
            </FieldLabel>
            <FieldDescription>
              The location where your Dragon Age: Origins mods are installed.
            </FieldDescription>
          </FieldContent>
          <InputGroup className="mt-2 h-10">
            <InputGroupInput
              id="settings-override-path"
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
      </SettingsSection>

      {/* Interface Section */}
      <SettingsSection title="Interface">
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
                key={value}
                variant="ghost"
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
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="settings-reduce-motion">
              Reduced Motion
            </FieldLabel>
            <FieldDescription>Reduce motion for animations.</FieldDescription>
          </FieldContent>
          <Checkbox
            id="settings-reduce-motion"
            size="lg"
            checked={reduceMotion}
            onCheckedChange={setReduceMotion}
          />
        </Field>
      </SettingsSection>

      {/* Data Management Section (Danger Zone) */}
      <SettingsSection title="Data Management" danger>
        {/* Reset Settings */}
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel>Restore Defaults</FieldLabel>
            <FieldDescription>
              Revert your theme, override directory, and accessibility
              preferences.
            </FieldDescription>
          </FieldContent>
          <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="py-5">
                <RotateCcwIcon className="size-4" />
                Reset
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-106.25">
              <DialogHeader>
                <DialogTitle>Reset all settings?</DialogTitle>
                <DialogDescription>
                  This will revert your theme, override directory, and
                  accessibility preferences.
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

        {/* Delete Data */}
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel>Clear Application Data</FieldLabel>
            <FieldDescription>
              Permanently remove all scanned asset data and temporary files.
            </FieldDescription>
          </FieldContent>
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="py-5">
                <Trash2Icon className="size-4" />
                Clear Data
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-106.25">
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
      </SettingsSection>
    </motion.div>
  );
}

interface SettingsSectionProps {
  title: ReactNode;
  children: ReactNode;
  danger?: boolean;
}

function SettingsSection({ title, children, danger }: SettingsSectionProps) {
  return (
    <motion.section variants={revealItem}>
      <Card className={cn(danger && "bg-destructive/5 ring-destructive/20")}>
        <CardHeader>
          <CardTitle>
            <Overline className={cn("text-base", danger && "text-destructive")}>
              {title}
            </Overline>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">{children}</CardContent>
      </Card>
    </motion.section>
  );
}

export { Settings };
