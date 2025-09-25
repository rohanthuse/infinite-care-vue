import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [staffId, setStaffId] = useState('');
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
    setStaffId('');
    setDate(prefilledDate ? format(prefilledDate, 'yyyy-MM-dd') : '');
    setTime('09:00');
    setEndTime('10:00');
    setLocation('');
    setNotes('');
  };

  const handleScheduleMeeting = async () => {
    if (!title || !clientId || !date || !time || !branchId) return;

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
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule New Meeting</DialogTitle>
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
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients?.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="staff">Staff Member (Optional)</Label>
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger>
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No specific staff</SelectItem>
                {staff?.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleScheduleMeeting}
            disabled={!title || !clientId || !date || !time || !branchId || createAppointment.isPending}
          >
            {createAppointment.isPending ? 'Scheduling...' : 'Schedule Meeting'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};