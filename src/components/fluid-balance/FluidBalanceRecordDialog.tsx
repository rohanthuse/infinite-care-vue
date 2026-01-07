import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FluidIntakeSection } from './FluidIntakeSection';
import { FluidOutputSection } from './FluidOutputSection';
import { UrinaryOutputSection } from './UrinaryOutputSection';
import { FluidBalanceSummary } from './FluidBalanceSummary';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FluidBalanceRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  visitRecordId?: string;
}

export function FluidBalanceRecordDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  visitRecordId,
}: FluidBalanceRecordDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateString = format(selectedDate, 'yyyy-MM-dd');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] lg:max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <DialogTitle className="text-lg sm:text-xl">Fluid Intake & Output Record</DialogTitle>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Service User: {clientName}
              </p>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'justify-start text-left font-normal w-full sm:w-auto',
                    !selectedDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </DialogHeader>

        <Tabs defaultValue="intake" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger value="intake" className="text-xs sm:text-sm py-2">Intake</TabsTrigger>
            <TabsTrigger value="output" className="text-xs sm:text-sm py-2">Output</TabsTrigger>
            <TabsTrigger value="urinary" className="text-xs sm:text-sm py-2">Urinary</TabsTrigger>
            <TabsTrigger value="summary" className="text-xs sm:text-sm py-2">Summary</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto mt-4">
            <TabsContent value="intake" className="mt-0">
              <FluidIntakeSection clientId={clientId} date={dateString} visitRecordId={visitRecordId} />
            </TabsContent>

            <TabsContent value="output" className="mt-0">
              <FluidOutputSection clientId={clientId} date={dateString} visitRecordId={visitRecordId} />
            </TabsContent>

            <TabsContent value="urinary" className="mt-0">
              <UrinaryOutputSection clientId={clientId} date={dateString} visitRecordId={visitRecordId} />
            </TabsContent>

            <TabsContent value="summary" className="mt-0">
              <FluidBalanceSummary clientId={clientId} date={dateString} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
