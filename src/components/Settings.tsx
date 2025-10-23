import { Button } from "@/components/ui/Button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
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
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/Item";
import { Separator } from "@/components/ui/Separator";
import { useDataStore } from "@/stores/data";
import { useSettingsStore } from "@/stores/settings";
import { open } from "@tauri-apps/plugin-dialog";
import {
  LaptopIcon,
  MoonIcon,
  RotateCcwIcon,
  SunIcon,
  Trash2Icon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
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
    <div className="mx-auto flex max-w-[800px] flex-col gap-8">
      <section>
        <h3 className="heading">General</h3>
        <Field orientation="horizontal" className="gap-8">
          <FieldContent className="flex-none">
            <FieldLabel>Override Folder</FieldLabel>
            <FieldDescription>
              The folder where mods are installed.
            </FieldDescription>
          </FieldContent>
          <InputGroup className="flex-1">
            <InputGroupInput
              type="text"
              value={overridePath ?? ""}
              onChange={(e) => setOverridePath(e.target.value)}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton onClick={selectFolder}>Browse</InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </section>
      <Separator />
      <section>
        <h3 className="heading">Appearance</h3>
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel>Theme</FieldLabel>
            <FieldDescription>
              Select the application's color scheme.
            </FieldDescription>
          </FieldContent>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <AnimatePresence initial={false} mode="wait">
                  <motion.div
                    key={theme}
                    className="absolute"
                    initial={{ opacity: 0, scale: 0.75, rotate: -90 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    {theme === "light" && (
                      <SunIcon className="h-[1.2rem] w-[1.2rem]" />
                    )}
                    {theme === "dark" && (
                      <MoonIcon className="h-[1.2rem] w-[1.2rem]" />
                    )}
                    {theme === "system" && (
                      <LaptopIcon className="h-[1.2rem] w-[1.2rem]" />
                    )}
                  </motion.div>
                </AnimatePresence>
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Field>
      </section>
      <section>
        <h3 className="heading">Actions</h3>
        <div className="grid grid-cols-2 gap-8">
          <Item variant="outline">
            <ItemContent>
              <ItemTitle>
                <RotateCcwIcon className="size-4" />
                Reset Settings
              </ItemTitle>
              <ItemDescription>
                Restores all settings to their default values.
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    Reset
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Are you sure you want to reset?</DialogTitle>
                    <DialogDescription>
                      All settings will be restored to their defaults. This
                      action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={handleResetSettings}>
                      RESET
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </ItemActions>
          </Item>
          <Item variant="outline">
            <ItemContent>
              <ItemTitle>
                <Trash2Icon className="size-4" />
                Delete App Data
              </ItemTitle>
              <ItemDescription>
                Permanently deletes all application data.
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <Dialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    Delete
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>
                      Are you sure you want to delete all data?
                    </DialogTitle>
                    <DialogDescription>
                      This will permanently delete all application data,
                      including resolved conflict lists. Your settings will not
                      be affected. This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={handleDeleteData}>
                      DELETE ALL DATA
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </ItemActions>
          </Item>
        </div>
      </section>
    </div>
  );
}

export { Settings };
