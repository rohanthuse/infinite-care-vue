
import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "outline" | "ghost" | "link" | "pill";
  size?: "default" | "sm" | "lg" | "icon";
  isAnimated?: boolean;
  className?: string;
}

const CustomButton = React.forwardRef<HTMLButtonElement, CustomButtonProps>(
  ({ children, className, variant = "default", size = "default", isAnimated = true, ...props }, ref) => {
    // Handle pill variant by converting it to default + classNames
    const isPill = variant === "pill";
    const actualVariant = isPill ? "default" : variant;
    
    return (
      <Button
        className={cn(
          "font-medium transition-all duration-300",
          isAnimated && "btn-hover-effect",
          isPill && "rounded-full",
          "relative overflow-hidden",
          className
        )}
        variant={actualVariant as any}
        size={size}
        ref={ref}
        {...props}
      >
        <span className="relative z-10 flex items-center">{children}</span>
      </Button>
    );
  }
);

CustomButton.displayName = "CustomButton";

export { CustomButton };
