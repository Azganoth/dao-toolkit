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
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Separator } from "@/components/ui/Separator";
import { useDataStore } from "@/stores/data";
import { useSettingsStore } from "@/stores/settings";
import { setTheme as tauriSetTheme } from "@tauri-apps/api/app";
import { open } from "@tauri-apps/plugin-dialog";
import { MoonIcon, SunIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function Settings() {
  const overridePath = useSettingsStore((state) => state.overridePath);
  const setOverridePath = useSettingsStore((state) => state.setOverridePath);

  const selectFolder = async () => {
    const path = await open({
      directory: true,
      defaultPath: overridePath,
    });
    if (!path) return;

    setOverridePath(path);
  };

  // Theme
  const theme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);

  useEffect(() => {
    const isDark =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
        : theme === "dark";
    window.document.documentElement.classList.toggle("dark", isDark);

    tauriSetTheme(theme === "system" ? null : theme);
  }, [theme]);

  // Delete
  const resetData = useDataStore((state) => state.reset);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const deleteData = async () => {
    setDeleteDialogOpen(false);
    resetData();
    toast.success("All app data deleted");
  };

  return (
    <ScrollArea>
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
                value={overridePath || ""}
                onChange={(e) => setOverridePath(e.target.value)}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton onClick={selectFolder}>
                  Select
                </InputGroupButton>
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
                <Button variant="outline" size="icon">
                  <SunIcon className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                  <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
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
                <ItemTitle>Delete app data</ItemTitle>
                <ItemDescription>
                  This will permanently delete all application data except
                  settings. This action cannot be undone.
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
                      <DialogTitle>Delete data</DialogTitle>
                      <DialogDescription>
                        This will permanently delete all application data except
                        settings. This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button variant="destructive" onClick={deleteData}>
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
    </ScrollArea>
  );
}

export { Settings };
