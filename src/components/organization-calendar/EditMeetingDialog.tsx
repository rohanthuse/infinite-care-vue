import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SafeSelect, SafeSelectContent, SafeSelectItem, SafeSelectTrigger, SafeSelectValue } from '@/components/ui/safe-select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { useUpdateClientAppointment } from '@/hooks/useClientAppointments';
import { EnhancedClientSelector } from '@/components/ui/enhanced-client-selector';
import { EnhancedStaffSelector } from '@/components/ui/enhanced-staff-selector';
import { toast } from 'sonner';

interface EditMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: any;
  branchId?: string;
}

// Helper function to format meeting type names
const formatMeetingType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'client': 'Client',
    'internal': 'Internal',
    'personal': 'Personal',
    'third-party': 'Third Party',
    'external': 'External'
  };
  return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
};

export const EditMeetingDialog: React.FC<EditMeetingDialogProps> = ({
  open,
  onOpenChange,
  appointment,
  branchId,
}) => {
  // Parse existing appointment data
  const meetingTypeMatch = appointment?.appointment_type?.match(/^(Client|Internal|Personal|Third Party) Meeting: (.+)$/);
  const initialMeetingType = meetingTypeMatch?.[1].toLowerCase().replace(' ', '-') || 'client';
  const initialTitle = meetingTypeMatch?.[2] || '';

  const staffIdMatch = appointment?.notes?.match(/Staff ID: ([a-f0-9-]+)/);
  const initialStaffId = staffIdMatch?.[1];

  const initialNotes = appointment?.notes
    ?.replace(/Meeting Type: .+\n?/, '')
    .replace(/Staff ID: .+\n?/, '')
    .trim() || '';

  const [title, setTitle] = useState(initialTitle);
  const [meetingType, setMeetingType] = useState(initialMeetingType);
  const [clientId, setClientId] = useState(appointment?.client_id || '');
  const [clientData, setClientData] = useState<any>(null);
  const [staffId, setStaffId] = useState<string | undefined>(initialStaffId);
  const [staffData, setStaffData] = useState<any>(null);
  const [date, setDate] = useState(appointment?.appointment_date || '');
  const [time, setTime] = useState(appointment?.appointment_time || '09:00');
  const [location, setLocation] = useState(appointment?.location || '');
  const [notes, setNotes] = useState(initialNotes);
  const [status, setStatus] = useState(appointment?.status || 'scheduled');

  const updateAppointment = useUpdateClientAppointment();

  // Reset form when appointment changes
  useEffect(() => {
    if (appointment && open) {
      const meetingTypeMatch = appointment.appointment_type?.match(/^(Client|Internal|Personal|Third Party) Meeting: (.+)$/);
      const meetingType = meetingTypeMatch?.[1].toLowerCase().replace(' ', '-') || 'client';
      const title = meetingTypeMatch?.[2] || '';

      const staffIdMatch = appointment.notes?.match(/Staff ID: ([a-f0-9-]+)/);
      const staffId = staffIdMatch?.[1];

      const cleanNotes = appointment.notes
        ?.replace(/Meeting Type: .+\n?/, '')
        .replace(/Staff ID: .+\n?/, '')
        .trim() || '';

      setTitle(title);
      setMeetingType(meetingType);
      setClientId(appointment.client_id || '');
      setStaffId(staffId);
      setDate(appointment.appointment_date || '');
      setTime(appointment.appointment_time || '09:00');
      setLocation(appointment.location || '');
      setNotes(cleanNotes);
      setStatus(appointment.status || 'scheduled');
    }
  }, [appointment, open]);

  const handleUpdateMeeting = async () => {
    // Validation
    if (!title || title.trim().length === 0) {
      toast.error("Please enter a meeting title");
      return;
    }
    
    if (!date) {
      toast.error("Please select a meeting date");
      return;
    }
    
    if (!time) {
      toast.error("Please select a meeting time");
      return;
    }
    
    if (meetingType === 'client' && !clientId) {
      toast.error("Please select a client for client meetings");
      return;
    }

    try {
      await updateAppointment.mutateAsync({
        appointmentId: appointment.id,
        updates: {
          client_id: meetingType === 'client' ? clientId : null,
          branch_id: branchId || appointment.branch_id,
          appointment_date: date,
          appointment_time: time,
          appointment_type: `${formatMeetingType(meetingType)} Meeting: ${title}`,
          provider_name: staffId ? staffData?.full_name || appointment.provider_name : getProviderName(),
          location: location || getDefaultLocation(),
          status: status,
          notes: `Meeting Type: ${meetingType}\n${staffId ? `Staff ID: ${staffId}\n` : ''}${notes}`
        }
      });

      // Wait for React Query to process invalidations
      await new Promise(resolve => setTimeout(resolve, 100));

      onOpenChange(false);
    } catch (error) {
      console.error('Error updating meeting:', error);
    }
  };

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

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

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Meeting</DialogTitle>
          <DialogDescription>Update meeting details and information.</DialogDescription>
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
                placeholder="Enter meeting title"
              />
            </div>

            {meetingType === 'client' && (
              <div className="grid gap-2">
                <Label htmlFor="client">Client *</Label>
                <EnhancedClientSelector
                  branchId={branchId || appointment.branch_id}
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
                  branchId={branchId || appointment.branch_id}
                  selectedStaffId={staffId}
                  onStaffSelect={(id, data) => {
                    setStaffId(id);
                    setStaffData(data);
                  }}
                  placeholder="Search staff member"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
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
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter location"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <SafeSelect value={status} onValueChange={setStatus}>
                <SafeSelectTrigger>
                  <SafeSelectValue placeholder="Select status" />
                </SafeSelectTrigger>
                <SafeSelectContent>
                  <SafeSelectItem value="scheduled">Scheduled</SafeSelectItem>
                  <SafeSelectItem value="in-progress">In Progress</SafeSelectItem>
                  <SafeSelectItem value="completed">Completed</SafeSelectItem>
                  <SafeSelectItem value="cancelled">Cancelled</SafeSelectItem>
                </SafeSelectContent>
              </SafeSelect>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes"
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
            onClick={handleUpdateMeeting}
            disabled={!title || (meetingType === 'client' && !clientId) || !date || !time || updateAppointment.isPending}
          >
            {updateAppointment.isPending ? 'Updating...' : 'Update Meeting'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
