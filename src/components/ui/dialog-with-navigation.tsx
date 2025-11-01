import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BackButton } from "@/components/navigation/BackButton";
import { BreadcrumbNavigation } from "@/components/navigation/BreadcrumbNavigation";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  path?: string;
  onClick?: () => void;
}

interface DialogWithNavigationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  showBackButton?: boolean;
  backButtonLabel?: string;
  onBackClick?: () => void;
  breadcrumbItems?: BreadcrumbItem[];
}

export function DialogWithNavigation({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  showBackButton = true,
  backButtonLabel = "Back",
  onBackClick,
  breadcrumbItems,
}: DialogWithNavigationProps) {
  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className}>
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {showBackButton && (
                <BackButton 
                  onClick={handleBack}
                  label={backButtonLabel}
                  variant="ghost"
                />
              )}
              {breadcrumbItems && breadcrumbItems.length > 0 && (
                <BreadcrumbNavigation items={breadcrumbItems} />
              )}
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
