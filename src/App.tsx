import "@/App.css";
import { Settings } from "@/components/Settings";
import { TitleBar } from "@/components/TitleBar";
import { Toaster } from "@/components/ui/Sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
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
import { SearchXIcon, SettingsIcon, UserCheckIcon } from "lucide-react";
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
      updateTheme(useSettingsStore.getState().theme);

      await getCurrentWindow().show();
    };

    initializeApp();
  }, []);

  const theme = useSettingsStore((state) => state.theme);

  useEffect(() => {
    updateTheme(theme);
  }, [theme]);

  return (
    <>
      <TitleBar />
      <main className="mt-8 p-4">
        <Tabs defaultValue="settings">
          <TabsList className="w-full">
            <TabsTrigger value="chargen">
              <UserCheckIcon />
              <h2>Chargen</h2>
            </TabsTrigger>
            <TabsTrigger value="scanner" disabled>
              <SearchXIcon />
              <h2>Scanner</h2>
            </TabsTrigger>
            <TabsTrigger value="settings" className="ml-auto">
              <SettingsIcon />
              <h2>Settings</h2>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="chargen" className="p-4">
            TODO
          </TabsContent>
          <TabsContent value="settings" className="p-4">
            <Settings />
          </TabsContent>
        </Tabs>
      </main>
      <Toaster />
    </>
  );
}

export default App;
