import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface YesNoToggleProps {
  value: boolean | undefined;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function YesNoToggle({ value, onChange, disabled, className }: YesNoToggleProps) {
  return (
    <div className={cn("flex gap-2", className)}>
      <Button
        type="button"
        variant={value === true ? "default" : "outline"}
        size="sm"
        onClick={() => onChange(true)}
        disabled={disabled}
        className={cn(
          "min-w-[60px]",
          value === true && "bg-primary text-primary-foreground"
        )}
      >
        Yes
      </Button>
      <Button
        type="button"
        variant={value === false ? "default" : "outline"}
        size="sm"
        onClick={() => onChange(false)}
        disabled={disabled}
        className={cn(
          "min-w-[60px]",
          value === false && "bg-muted text-muted-foreground"
        )}
      >
        No
      </Button>
    </div>
  );
}
