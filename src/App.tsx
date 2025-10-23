import "@/App.css";
import { Settings } from "@/components/Settings";
import { TitleBar } from "@/components/TitleBar";
import { Toaster } from "@/components/ui/Sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { dataStoreTauriHandler } from "@/stores/data";
import { settingsStoreTauriHandler, useSettingsStore } from "@/stores/settings";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { SearchXIcon, SettingsIcon, UserCheckIcon } from "lucide-react";
import { useEffect } from "react";

function App() {
  useEffect(() => {
    const initializeApp = async () => {
      await settingsStoreTauriHandler.start();
      await dataStoreTauriHandler.start();

      await useSettingsStore.getState().init();

      await getCurrentWindow().show();
    };

    initializeApp();
  }, []);

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
