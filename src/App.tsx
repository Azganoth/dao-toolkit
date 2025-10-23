import "@/App.css";
import { Settings } from "@/components/Settings";
import { TitleBar } from "@/components/TitleBar";
import { ScrollArea } from "@/components/ui/ScrollArea";
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
import { motion } from "motion/react";
import { useEffect, useState } from "react";

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

  const [activeTab, setActiveTab] = useState("settings");

  return (
    <div className="flex h-screen flex-col">
      <TitleBar />
      <main className="mt-8 flex-1 overflow-hidden p-4">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex h-full w-full flex-col"
        >
          <TabsList className="w-full flex-none">
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
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-hidden p-4"
          >
            <ScrollArea className="h-full w-full">
              <TabsContent value="chargen">TODO</TabsContent>
              <TabsContent value="settings">
                <Settings />
              </TabsContent>
            </ScrollArea>
          </motion.div>
        </Tabs>
      </main>
      <Toaster />
    </div>
  );
}

export default App;
