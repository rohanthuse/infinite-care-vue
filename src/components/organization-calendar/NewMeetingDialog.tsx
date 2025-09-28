import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SafeSelect, SafeSelectContent, SafeSelectItem, SafeSelectTrigger, SafeSelectValue } from '@/components/ui/safe-select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { useTenantAwareQuery } from '@/hooks/useTenantAware';
import { supabase } from '@/integrations/supabase/client';
import { useCreateClientAppointment } from '@/hooks/useClientAppointments';

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
  const [clientId, setClientId] = useState('');
  const [staffId, setStaffId] = useState<string | undefined>(undefined);
  const [date, setDate] = useState(prefilledDate ? format(prefilledDate, 'yyyy-MM-dd') : '');
  const [time, setTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const createAppointment = useCreateClientAppointment();

  // Fetch clients
  const { data: clients } = useTenantAwareQuery(
    ['branch-clients', branchId],
    async () => {
      if (!branchId) return [];
      
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name')
        .eq('branch_id', branchId)
        .eq('status', 'active');
      
      if (error) throw error;
      return data?.map(client => ({
        ...client,
        name: `${client.first_name} ${client.last_name}`
      })) || [];
    },
    { enabled: !!branchId }
  );

  // Fetch staff
  const { data: staff } = useTenantAwareQuery(
    ['branch-staff', branchId],
    async () => {
      if (!branchId) return [];
      
      const { data, error } = await supabase
        .from('staff')
        .select('id, first_name, last_name')
        .eq('branch_id', branchId)
        .eq('status', 'active');
      
      if (error) throw error;
      return data?.map(member => ({
        ...member,
        name: `${member.first_name} ${member.last_name}`
      })) || [];
    },
    { enabled: !!branchId }
  );

  const resetForm = () => {
    setTitle('');
    setClientId('');
    setStaffId(undefined);
    setDate(prefilledDate ? format(prefilledDate, 'yyyy-MM-dd') : '');
    setTime('09:00');
    setEndTime('10:00');
    setLocation('');
    setNotes('');
  };

  const handleScheduleMeeting = async () => {
    if (!title || !clientId || !date || !time || !branchId) {
      console.log('Missing required fields:', { title, clientId, date, time, branchId });
      return;
    }

    try {
      console.log('Creating appointment with data:', {
        client_id: clientId,
        appointment_date: date,
        appointment_time: time,
        appointment_type: title,
        provider_name: staffId ? staff?.find(s => s.id === staffId)?.name || 'Staff Member' : 'Team Meeting',
        location: location || 'Office',
        status: 'scheduled',
        notes
      });

      await createAppointment.mutateAsync({
        client_id: clientId,
        appointment_date: date,
        appointment_time: time,
        appointment_type: title,
        provider_name: staffId ? staff?.find(s => s.id === staffId)?.name || 'Staff Member' : 'Team Meeting',
        location: location || 'Office',
        status: 'scheduled',
        notes
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error scheduling meeting:', error);
    }
  };

  const handleClose = () => {
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule New Meeting</DialogTitle>
          <DialogDescription>Create a new client appointment</DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Meeting Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Care Plan Review"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="client">Client</Label>
            <SafeSelect value={clientId} onValueChange={setClientId}>
              <SafeSelectTrigger>
                <SafeSelectValue placeholder="Select client" />
              </SafeSelectTrigger>
              <SafeSelectContent>
                {clients?.map((client) => (
                  <SafeSelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SafeSelectItem>
                ))}
              </SafeSelectContent>
            </SafeSelect>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="staff">Staff Member (Optional)</Label>
            <SafeSelect value={staffId} onValueChange={setStaffId}>
              <SafeSelectTrigger>
                <SafeSelectValue placeholder="No specific staff" />
              </SafeSelectTrigger>
              <SafeSelectContent>
                {staff?.map((member) => (
                  <SafeSelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SafeSelectItem>
                ))}
              </SafeSelectContent>
            </SafeSelect>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="time">Start Time</Label>
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
              placeholder="e.g., Office, Video Call"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about the meeting"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleScheduleMeeting}
            disabled={!title || !clientId || !date || !time || !branchId || createAppointment.isPending}
          >
            {createAppointment.isPending ? 'Scheduling...' : 'Schedule Meeting'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};