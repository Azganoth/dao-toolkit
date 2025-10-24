import * as TabsPrimitive from "@radix-ui/react-tabs";
import { motion } from "motion/react";
import * as React from "react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const TabsContext = React.createContext<{
  activeTab?: string;
  setActiveTab: (value: string) => void;
} | null>(null);

function useTabs() {
  const context = React.useContext(TabsContext);
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
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  const isControlled = value !== undefined;

  const [uncontrolledValue, setUncontrolledValue] =
    React.useState(defaultValue);
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
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-9 w-fit items-center justify-center p-[3px] text-muted-foreground",
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
}: React.ComponentProps<typeof TabsPrimitive.Trigger> &
  React.ComponentProps<typeof motion.button>) {
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
        className={cn(
          "relative data-[state=active]:text-foreground",
          className,
        )}
      >
        {children}
        {isActive && (
          <motion.div
            className="absolute inset-x-3 top-full h-[3px] rounded-full bg-primary"
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
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger, useTabs };
