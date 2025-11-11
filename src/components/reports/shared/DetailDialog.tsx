import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Share2, X } from 'lucide-react';
import { format } from 'date-fns';

export interface DetailField {
  label: string;
  value: any;
  type?: 'text' | 'date' | 'badge' | 'number' | 'longtext';
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  section?: string;
}

export interface DetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  fields: DetailField[];
  onExport?: () => void;
  onShare?: () => void;
  children?: React.ReactNode;
}

export function DetailDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  fields,
  onExport,
  onShare,
  children,
}: DetailDialogProps) {
  // Group fields by section
  const sections = fields.reduce((acc, field) => {
    const section = field.section || 'General';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(field);
    return acc;
  }, {} as Record<string, DetailField[]>);

  const renderFieldValue = (field: DetailField) => {
    if (field.value === null || field.value === undefined || field.value === '') {
      return <span className="text-muted-foreground italic">Not provided</span>;
    }

    switch (field.type) {
      case 'date':
        try {
          return format(new Date(field.value), 'dd/MM/yyyy HH:mm');
        } catch {
          return field.value;
        }
      case 'badge':
        return (
          <Badge variant={field.badgeVariant || 'default'}>
            {String(field.value)}
          </Badge>
        );
      case 'number':
        return <span className="font-mono">{field.value}</span>;
      case 'longtext':
        return (
          <div className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
            {field.value}
          </div>
        );
      default:
        return <span>{String(field.value)}</span>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl">{title}</DialogTitle>
              {subtitle && (
                <DialogDescription className="text-base mt-1">
                  {subtitle}
                </DialogDescription>
              )}
            </div>
            <div className="flex gap-2">
              {onShare && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onShare}
                  title="Share"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              )}
              {onExport && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onExport}
                  title="Export"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-12rem)]">
          <div className="space-y-6 pr-4">
            {Object.entries(sections).map(([sectionName, sectionFields], idx) => (
              <div key={sectionName}>
                {idx > 0 && <Separator className="my-6" />}
                <h3 className="text-lg font-semibold mb-4">{sectionName}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sectionFields.map((field, fieldIdx) => (
                    <div
                      key={fieldIdx}
                      className={field.type === 'longtext' ? 'md:col-span-2' : ''}
                    >
                      <dt className="text-sm font-medium text-muted-foreground mb-1">
                        {field.label}
                      </dt>
                      <dd className="text-sm">{renderFieldValue(field)}</dd>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {children && (
              <>
                <Separator className="my-6" />
                {children}
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
