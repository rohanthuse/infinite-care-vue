import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface CarerPageWrapperProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  loading?: boolean;
  loadingText?: string;
  fullHeight?: boolean; // For pages like Messages that need full height
  noPadding?: boolean; // For pages that handle their own padding
}

export const CarerPageWrapper: React.FC<CarerPageWrapperProps> = ({
  children,
  title,
  subtitle,
  icon,
  actions,
  loading,
  loadingText = "Loading...",
  fullHeight = false,
  noPadding = false,
}) => {
  if (loading) {
    return (
      <div className="w-full min-w-0 max-w-full space-y-6">
        {title && (
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            {subtitle && <Skeleton className="h-5 w-64" />}
          </div>
        )}
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full min-w-0 max-w-full ${fullHeight ? 'flex flex-col h-full' : noPadding ? '' : 'space-y-6'}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {icon}
            <div>
              {title && (
                <h1 className="text-xl md:text-2xl font-bold text-card-foreground">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
