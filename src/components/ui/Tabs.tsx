import { motion } from "motion/react";
import { Tabs as TabsPrimitive } from "radix-ui";
import {
  createContext,
  useContext,
  useState,
  type ComponentProps,
} from "react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const TabsContext = createContext<{
  activeTab?: string;
  setActiveTab: (value: string) => void;
} | null>(null);

function useTabs() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("useTabs must be used within a Tabs provider");
  }

  return context;
}

function Tabs({
  className,
  value,
  onValueChange,
  defaultValue,
  ...props
}: ComponentProps<typeof TabsPrimitive.Root>) {
  const isControlled = value !== undefined;

  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const activeTab = isControlled ? value : uncontrolledValue;

  const handleValueChange = (newValue: string) => {
    if (!isControlled) {
      setUncontrolledValue(newValue);
    }

    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider
      value={{ activeTab, setActiveTab: handleValueChange }}
    >
      <TabsPrimitive.Root
        data-slot="tabs"
        value={activeTab}
        onValueChange={handleValueChange}
        className={cn("flex flex-col gap-2", className)}
        {...props}
      />
    </TabsContext.Provider>
  );
}

function TabsList({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-9 w-fit items-center justify-center p-0.75 text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  children,
  value,
  ...props
}: ComponentProps<typeof TabsPrimitive.Trigger> &
  ComponentProps<typeof motion.button>) {
  const { activeTab } = useTabs();
  const isActive = activeTab === value;

  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      asChild
      value={value}
      {...props}
    >
      <Button
        variant="ghost"
        size="lg"
        className={cn(
          "relative py-5 data-[state=active]:text-foreground",
          className,
        )}
      >
        {children}
        {isActive && (
          <motion.div
            className="absolute inset-x-3 top-full h-0.75 rounded-full bg-primary"
            layout
            layoutId="tab-trigger-indicator"
          />
        )}
      </Button>
    </TabsPrimitive.Trigger>
  );
}

function TabsContent({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("mt-4 flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger, useTabs };
