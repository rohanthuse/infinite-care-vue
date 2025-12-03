
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUp, ArrowDown } from 'lucide-react';

export const DashboardStat = ({
  title,
  value,
  change,
  icon,
  positive,
  isLoading,
  onClick,
  iconBgClass,
  iconColorClass,
}: {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  positive: boolean;
  isLoading?: boolean;
  onClick?: () => void;
  iconBgClass?: string;
  iconColorClass?: string;
}) => {
  return (
    <Card className={onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""} onClick={onClick}>
      <CardContent className="p-4 md:p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            {isLoading ? (
              <div className="mt-1 space-y-2">
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            ) : (
              <>
                <h3 className="text-lg md:text-2xl font-bold mt-1">{value}</h3>
                <div className={`flex items-center mt-1 text-xs ${positive ? 'text-green-600' : 'text-red-600'}`}>
                  {positive ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                  <span>{change}</span>
                </div>
              </>
            )}
          </div>
          <div className={`p-2 rounded-md border border-border ${iconBgClass || 'bg-muted'} ${iconColorClass || ''}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
