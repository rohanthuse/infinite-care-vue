import React from 'react';
import { Calendar, Users, GraduationCap, FileText, UserX } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface AddEventPopoverProps {
  date?: Date;
  timeSlot?: Date;
  onEventTypeSelect: (eventType: string) => void;
  children: React.ReactNode;
}

export const AddEventPopover: React.FC<AddEventPopoverProps> = ({
  date,
  timeSlot,
  onEventTypeSelect,
  children
}) => {
  const [open, setOpen] = React.useState(false);

  const handleEventTypeClick = (eventType: string) => {
    onEventTypeSelect(eventType);
    setOpen(false);
  };

  const eventTypes = [
    {
      type: 'booking',
      label: 'New Booking',
      icon: Calendar,
      description: 'Schedule a client booking'
    },
    {
      type: 'meeting',
      label: 'New Meeting',
      icon: Users,
      description: 'Schedule a team meeting'
    },
    {
      type: 'training',
      label: 'New Training',
      icon: GraduationCap,
      description: 'Schedule training session'
    },
    {
      type: 'agreement',
      label: 'New Agreement',
      icon: FileText,
      description: 'Schedule agreement review'
    },
    {
      type: 'leave',
      label: 'New Leave',
      icon: UserX,
      description: 'Schedule staff leave'
    }
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="start">
        <div className="space-y-1">
          <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground border-b border-border mb-2">
            Select Event Type
          </div>
          {eventTypes.map((eventType) => {
            const Icon = eventType.icon;
            return (
              <Button
                key={eventType.type}
                variant="ghost"
                className="w-full justify-start h-auto p-3 text-left"
                onClick={() => handleEventTypeClick(eventType.type)}
              >
                <div className="flex items-start gap-3">
                  <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <div className="font-medium text-foreground">
                      {eventType.label}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {eventType.description}
                    </div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};