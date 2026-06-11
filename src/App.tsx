import "@/App.css";
import { TitleBar } from "@/components/layout/TitleBar";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Toaster } from "@/components/ui/Sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { ChargenGenerator } from "@/features/chargen/ChargenGenerator";
import { Conflicts } from "@/features/conflicts/Conflicts";
import { Settings } from "@/features/settings/Settings";
import { dataStoreTauriHandler } from "@/stores/data";
import {
  settingsStoreTauriHandler,
  useSettingsStore,
  type SettingsStore,
} from "@/stores/settings";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import { setTheme as tauriSetTheme } from "@tauri-apps/api/app";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { SearchIcon, SettingsIcon, UserCheckIcon } from "lucide-react";
import { useEffect } from "react";

const updateTheme = async (theme: SettingsStore["theme"]) => {
  await tauriSetTheme(theme === "system" ? null : theme);

  const isDark =
    theme === "system"
      ? (await getCurrentWindow().theme()) === "dark"
      : theme === "dark";
  window.document.documentElement.classList.toggle("dark", isDark);
};

function App() {
  useEffect(() => {
    const initializeApp = async () => {
      await settingsStoreTauriHandler.start();
      await dataStoreTauriHandler.start();

      await useSettingsStore.getState().init();
      await updateTheme(useSettingsStore.getState().theme);

      await getCurrentWindow().show();
    };

    initializeApp();
  }, []);

  const theme = useSettingsStore((state) => state.theme);

  useEffect(() => {
    void updateTheme(theme);
  }, [theme]);

  return (
    <div className="flex h-screen flex-col">
      <TitleBar />
      <main className="mt-8 flex-1 overflow-hidden p-4">
        <Tabs
          className="flex h-full w-full flex-col gap-4"
          defaultValue="chargen"
        >
          <TabsList className="w-full flex-none">
            <TabsTrigger value="chargen">
              <UserCheckIcon className="size-5" />
              Chargen
            </TabsTrigger>
            <TabsTrigger value="conflicts">
              <SearchIcon className="size-5" />
              Conflicts
            </TabsTrigger>
            <TabsTrigger value="settings" className="ml-auto">
              <SettingsIcon className="size-5" />
              Settings
            </TabsTrigger>
          </TabsList>
          <ScrollArea className="h-full w-full overflow-hidden px-4 pb-4">
            <TabsContent value="chargen">
              <ChargenGenerator />
            </TabsContent>
            <TabsContent value="conflicts">
              <Conflicts />
            </TabsContent>
            <TabsContent value="settings">
              <Settings />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </main>
      <Toaster />
    </div>
  );
}

export default App;
