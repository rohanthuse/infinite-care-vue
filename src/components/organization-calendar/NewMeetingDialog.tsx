import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SafeSelect, SafeSelectContent, SafeSelectItem, SafeSelectTrigger, SafeSelectValue } from '@/components/ui/safe-select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { useCreateClientAppointment } from '@/hooks/useClientAppointments';
import { EnhancedClientSelector } from '@/components/ui/enhanced-client-selector';
import { EnhancedStaffSelector } from '@/components/ui/enhanced-staff-selector';

interface NewMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId?: string;
  prefilledDate?: Date;
}

export const NewMeetingDialog: React.FC<NewMeetingDialogProps> = ({
  open,
  onOpenChange,
  branchId,
  prefilledDate
}) => {
  const [title, setTitle] = useState('');
  const [meetingType, setMeetingType] = useState('client');
  const [clientId, setClientId] = useState('');
  const [clientData, setClientData] = useState<any>(null);
  const [staffId, setStaffId] = useState<string | undefined>(undefined);
  const [staffData, setStaffData] = useState<any>(null);
  const [date, setDate] = useState(prefilledDate ? format(prefilledDate, 'yyyy-MM-dd') : '');
  const [time, setTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const createAppointment = useCreateClientAppointment();

  const resetForm = () => {
    setTitle('');
    setMeetingType('client');
    setClientId('');
    setClientData(null);
    setStaffId(undefined);
    setStaffData(null);
    setDate(prefilledDate ? format(prefilledDate, 'yyyy-MM-dd') : '');
    setTime('09:00');
    setEndTime('10:00');
    setLocation('');
    setNotes('');
  };

  const handleScheduleMeeting = async () => {
    // Validation based on meeting type
    const isClientMeeting = meetingType === 'client';
    const requiresClient = isClientMeeting;
    
    if (!title || !date || !time || !branchId || (requiresClient && !clientId)) {
      console.log('Missing required fields:', { title, meetingType, clientId, date, time, branchId });
      return;
    }

    try {
      console.log('Creating appointment with data:', {
        client_id: clientId,
        appointment_date: date,
        appointment_time: time,
        appointment_type: title,
        provider_name: staffId ? staffData?.full_name || 'Staff Member' : 'Team Meeting',
        location: location || 'Office',
        status: 'scheduled',
        notes
      });

      await createAppointment.mutateAsync({
        client_id: meetingType === 'client' ? clientId : null,
        appointment_date: date,
        appointment_time: time,
        appointment_type: `${meetingType.charAt(0).toUpperCase() + meetingType.slice(1)} Meeting: ${title}`,
        provider_name: staffId ? staffData?.full_name || 'Staff Member' : getProviderName(),
        location: location || getDefaultLocation(),
        status: 'scheduled',
        notes: `Meeting Type: ${meetingType}\n${notes}`
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error scheduling meeting:', error);
    }
  };

  const handleClose = useCallback(() => {
    try {
      resetForm();
      onOpenChange(false);
      
      // Comprehensive cleanup to prevent UI freezing
      setTimeout(() => {
        // Remove all aria-hidden and inert attributes
        const elementsToCleanup = [
          document.getElementById('root'),
          document.querySelector('.group\\/sidebar-wrapper'),
          ...document.querySelectorAll('[data-radix-popper-content-wrapper]'),
          ...document.querySelectorAll('[aria-hidden="true"]')
        ];
        
        elementsToCleanup.forEach(element => {
          if (element) {
            element.removeAttribute('aria-hidden');
            element.removeAttribute('inert');
          }
        });
        
        // Remove orphaned portals and restore document state
        document.querySelectorAll('[data-radix-popper-content-wrapper]:empty').forEach(el => el.remove());
        document.body.style.removeProperty('overflow');
        document.documentElement.style.removeProperty('overflow');
        document.body.style.removeProperty('pointer-events');
      }, 50);
    } catch (error) {
      console.error('Error closing dialog:', error);
      onOpenChange(false);
    }
  }, [onOpenChange]);

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      const timeoutId = setTimeout(resetForm, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [open]);

  const getProviderName = () => {
    switch (meetingType) {
      case 'internal':
        return 'Internal Team';
      case 'personal':
        return 'Personal';
      case 'third-party':
        return 'Third Party';
      default:
        return 'Team Meeting';
    }
  };

  const getDefaultLocation = () => {
    switch (meetingType) {
      case 'personal':
        return 'Personal';
      case 'third-party':
        return 'External';
      default:
        return 'Office';
    }
  };

  const getMeetingTypeLabel = () => {
    switch (meetingType) {
      case 'client':
        return 'Client Meeting';
      case 'internal':
        return 'Internal Meeting';
      case 'personal':
        return 'Personal Meeting';
      case 'third-party':
        return 'Third Party Meeting';
      default:
        return 'Meeting';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Schedule New Meeting</DialogTitle>
          <DialogDescription>Create a new meeting or appointment with clients or staff members.</DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="meetingType">Meeting Type</Label>
              <SafeSelect value={meetingType} onValueChange={setMeetingType}>
                <SafeSelectTrigger>
                  <SafeSelectValue placeholder="Select meeting type" />
                </SafeSelectTrigger>
                <SafeSelectContent>
                  <SafeSelectItem value="client">Client Meeting</SafeSelectItem>
                  <SafeSelectItem value="internal">Internal Meeting</SafeSelectItem>
                  <SafeSelectItem value="personal">Personal Meeting</SafeSelectItem>
                  <SafeSelectItem value="third-party">Third Party Meeting</SafeSelectItem>
                </SafeSelectContent>
              </SafeSelect>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">Meeting Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`e.g., ${meetingType === 'client' ? 'Care Plan Review' : meetingType === 'internal' ? 'Team Discussion' : meetingType === 'personal' ? 'Personal Task' : 'External Meeting'}`}
              />
            </div>

            {meetingType === 'client' && (
              <div className="grid gap-2">
                <Label htmlFor="client">Client *</Label>
                <EnhancedClientSelector
                  branchId={branchId || ''}
                  selectedClientId={clientId}
                  onClientSelect={(id, data) => {
                    setClientId(id);
                    setClientData(data);
                  }}
                  placeholder="Search and select a client"
                />
              </div>
            )}

            {(meetingType === 'client' || meetingType === 'internal') && (
              <div className="grid gap-2">
                <Label htmlFor="staff">Staff Member (Optional)</Label>
                <EnhancedStaffSelector
                  branchId={branchId || ''}
                  selectedStaffId={staffId}
                  onStaffSelect={(id, data) => {
                    setStaffId(id);
                    setStaffData(data);
                  }}
                  placeholder={
                    meetingType === 'client' 
                      ? "Search staff member (optional)" 
                      : "Search and select staff member"
                  }
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <div className="grid gap-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="time">Start Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={meetingType === 'personal' ? 'Personal location' : meetingType === 'third-party' ? 'External venue' : 'e.g., Office, Video Call'}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={`Additional notes about the ${getMeetingTypeLabel().toLowerCase()}`}
                rows={3}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleScheduleMeeting}
            disabled={!title || (meetingType === 'client' && !clientId) || !date || !time || !branchId || createAppointment.isPending}
          >
            {createAppointment.isPending ? 'Scheduling...' : `Schedule ${getMeetingTypeLabel()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};