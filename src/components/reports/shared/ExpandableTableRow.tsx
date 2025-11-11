import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ExpandableTableRowProps {
  children: React.ReactNode;
  expandedContent: React.ReactNode;
  className?: string;
  expandedClassName?: string;
}

export function ExpandableTableRow({
  children,
  expandedContent,
  className,
  expandedClassName,
}: ExpandableTableRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <tr
        className={cn(
          'hover:bg-muted/50 cursor-pointer transition-colors',
          isExpanded && 'bg-muted/30',
          className
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <td className="px-2 py-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </td>
        {children}
      </tr>
      {isExpanded && (
        <tr className={cn('bg-muted/20', expandedClassName)}>
          <td colSpan={100} className="px-4 py-4">
            <div className="animate-in slide-in-from-top-2 duration-200">
              {expandedContent}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
