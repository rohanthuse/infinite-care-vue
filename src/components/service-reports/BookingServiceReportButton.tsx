import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreateServiceReportDialog } from './CreateServiceReportDialog';
import { FileText, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface BookingServiceReportButtonProps {
  bookingId: string;
  clientId: string;
  clientName: string;
  serviceDate: string;
  isCompleted?: boolean;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

export function BookingServiceReportButton({
  bookingId,
  clientId,
  clientName,
  serviceDate,
  isCompleted = false,
  size = 'sm',
  variant = 'outline'
}: BookingServiceReportButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button
        size={size}
        variant={variant}
        onClick={() => setDialogOpen(true)}
        className="flex items-center gap-2"
        disabled={!isCompleted}
        title={!isCompleted ? "Complete the booking first to create a service report" : "Create service report"}
      >
        <FileText className="h-4 w-4" />
        {size !== 'sm' && 'Create Report'}
      </Button>

      <CreateServiceReportDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        preSelectedClient={{
          id: clientId,
          name: clientName
        }}
        preSelectedDate={format(new Date(serviceDate), 'yyyy-MM-dd')}
        bookingId={bookingId}
      />
    </>
  );
}