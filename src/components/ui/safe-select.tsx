import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

const SafeSelect = SelectPrimitive.Root
const SafeSelectGroup = SelectPrimitive.Group
const SafeSelectValue = SelectPrimitive.Value

const SafeSelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SafeSelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SafeSelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-[9999] max-h-[400px] min-w-[8rem] overflow-hidden rounded-md border border-border bg-background text-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <ScrollArea className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        <SelectPrimitive.Viewport className={cn(
          "p-1",
          position === "popper" &&
            "w-full min-w-[var(--radix-select-trigger-width)]"
        )}>
          {children}
        </SelectPrimitive.Viewport>
      </ScrollArea>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SafeSelectContent.displayName = SelectPrimitive.Content.displayName

const SafeSelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, value, ...props }, ref) => {
  // Filter out empty, null, or undefined values
  if (!value || value === "" || value === null || value === undefined) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('SafeSelectItem: Filtered out invalid value:', value);
    }
    return null;
  }

  return (
    <SelectPrimitive.Item
      ref={ref}
      value={value}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent hover:text-accent-foreground",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
})
SafeSelectItem.displayName = SelectPrimitive.Item.displayName

interface SafeSelectWrapperProps {
  value?: string | undefined;
  onValueChange?: (value: string | undefined) => void;
  children: React.ReactNode;
  [key: string]: any;
}

const SafeSelectWrapper = ({ value, onValueChange, children, ...props }: SafeSelectWrapperProps) => {
  // Convert empty string to undefined for internal handling
  const internalValue = value === "" ? undefined : value;
  
  const handleValueChange = (newValue: string) => {
    // Allow clearing by passing undefined instead of empty string
    if (newValue === "__CLEAR__") {
      onValueChange?.(undefined);
    } else {
      onValueChange?.(newValue);
    }
  };

  return (
    <SafeSelect value={internalValue} onValueChange={handleValueChange} {...props}>
      {children}
    </SafeSelect>
  );
};

export {
  SafeSelect,
  SafeSelectGroup,
  SafeSelectValue,
  SafeSelectTrigger,
  SafeSelectContent,
  SafeSelectItem,
  SafeSelectWrapper,
}