import { TooltipProvider } from "@/components/ui/Tooltip";
import { useSettingsStore } from "@/stores/settings";
import { MotionConfig } from "motion/react";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const reduceMotion = useSettingsStore((state) => state.reduceMotion);

  return (
    <MotionConfig reducedMotion={reduceMotion ? "always" : "user"}>
      <TooltipProvider>{children}</TooltipProvider>
    </MotionConfig>
  );
}
