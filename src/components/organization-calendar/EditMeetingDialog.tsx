import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SafeSelect, SafeSelectContent, SafeSelectItem, SafeSelectTrigger, SafeSelectValue } from '@/components/ui/safe-select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateClientAppointment } from '@/hooks/useClientAppointments';
import { ClientMultiSelect } from '@/components/ui/client-multi-select';
import { StaffMultiSelect } from '@/components/ui/staff-multi-select';
import { AdminMultiSelect } from '@/components/ui/admin-multi-select';
import { useOrganizationSuperAdmins, useBranchAdminsWithProfiles } from '@/hooks/useOrganizationAdmins';
import { useTenant } from '@/contexts/TenantContext';
import { EnhancedClient } from '@/hooks/useSearchableClients';
import { EnhancedStaff } from '@/hooks/useSearchableStaff';
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

// Helper to parse participant IDs from notes
const parseParticipantIds = (notes: string | null, prefix: string): string[] => {
  if (!notes) return [];
  const regex = new RegExp(`${prefix}: ([a-f0-9-,]+)`);
  const match = notes.match(regex);
  return match ? match[1].split(',').filter(id => id.trim()) : [];
};

export const EditMeetingDialog: React.FC<EditMeetingDialogProps> = ({
  open,
  onOpenChange,
  appointment,
  branchId,
}) => {
  const { organization } = useTenant();
  
  // Parse existing appointment data
  const meetingTypeMatch = appointment?.appointment_type?.match(/^(Client|Internal|Personal|Third Party) Meeting: (.+)$/);
  const initialMeetingType = meetingTypeMatch?.[1].toLowerCase().replace(' ', '-') || 'client';
  const initialTitle = meetingTypeMatch?.[2] || '';

  // Calculate initial end time (1 hour after start)
  const getInitialEndTime = (startTime?: string) => {
    if (!startTime) return '10:00';
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = (hours + 1) % 24;
    return `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const initialNotes = appointment?.notes
    ?.replace(/Meeting Type: .+\n?/g, '')
    ?.replace(/Staff ID: .+\n?/g, '')
    ?.replace(/Staff IDs: .+\n?/g, '')
    ?.replace(/Client IDs: .+\n?/g, '')
    ?.replace(/Super Admin IDs: .+\n?/g, '')
    ?.replace(/Branch Admin IDs: .+\n?/g, '')
    .trim() || '';

  const [title, setTitle] = useState(initialTitle);
  const [meetingType, setMeetingType] = useState(initialMeetingType);
  
  // Multi-selection states for clients
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [selectedClientsData, setSelectedClientsData] = useState<EnhancedClient[]>([]);
  
  // Multi-selection states for staff
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [selectedStaffData, setSelectedStaffData] = useState<EnhancedStaff[]>([]);
  
  // Admin selections
  const [selectedSuperAdmins, setSelectedSuperAdmins] = useState<string[]>([]);
  const [selectedBranchAdmins, setSelectedBranchAdmins] = useState<string[]>([]);
  
  const [date, setDate] = useState(appointment?.appointment_date || '');
  const [time, setTime] = useState(appointment?.appointment_time || '09:00');
  const [endTime, setEndTime] = useState(getInitialEndTime(appointment?.appointment_time));
  const [location, setLocation] = useState(appointment?.location || '');
  const [notes, setNotes] = useState(initialNotes);
  const [status, setStatus] = useState(appointment?.status || 'scheduled');

  // Fetch admins for notification selection
  const effectiveBranchId = branchId || appointment?.branch_id;
  const { data: superAdmins = [] } = useOrganizationSuperAdmins(organization?.id || '');
  const { data: branchAdmins = [] } = useBranchAdminsWithProfiles(effectiveBranchId || '');

  const updateAppointment = useUpdateClientAppointment();

  // Reset form when appointment changes
  useEffect(() => {
    if (appointment && open) {
      const meetingTypeMatch = appointment.appointment_type?.match(/^(Client|Internal|Personal|Third Party) Meeting: (.+)$/);
      const meetingType = meetingTypeMatch?.[1].toLowerCase().replace(' ', '-') || 'client';
      const title = meetingTypeMatch?.[2] || '';

      // Parse all participant IDs from notes
      const clientIds = parseParticipantIds(appointment.notes, 'Client IDs');
      const staffIds = parseParticipantIds(appointment.notes, 'Staff IDs');
      const superAdminIds = parseParticipantIds(appointment.notes, 'Super Admin IDs');
      const branchAdminIds = parseParticipantIds(appointment.notes, 'Branch Admin IDs');

      // If no Client IDs in notes but client_id exists, use that
      const finalClientIds = clientIds.length > 0 ? clientIds : (appointment.client_id ? [appointment.client_id] : []);

      const cleanNotes = appointment.notes
        ?.replace(/Meeting Type: .+\n?/g, '')
        ?.replace(/Staff ID: .+\n?/g, '')
        ?.replace(/Staff IDs: .+\n?/g, '')
        ?.replace(/Client IDs: .+\n?/g, '')
        ?.replace(/Super Admin IDs: .+\n?/g, '')
        ?.replace(/Branch Admin IDs: .+\n?/g, '')
        .trim() || '';

      setTitle(title);
      setMeetingType(meetingType);
      setSelectedClientIds(finalClientIds);
      setSelectedStaffIds(staffIds);
      setSelectedSuperAdmins(superAdminIds);
      setSelectedBranchAdmins(branchAdminIds);
      setDate(appointment.appointment_date || '');
      setTime(appointment.appointment_time || '09:00');
      setEndTime(getInitialEndTime(appointment.appointment_time));
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
    
    if (meetingType === 'client' && selectedClientIds.length === 0) {
      toast.error("Please select at least one client for client meetings");
      return;
    }

    try {
      // Get provider name from selected staff or fallback
      const providerName = selectedStaffData.length > 0 
        ? selectedStaffData[0].full_name 
        : (selectedStaffIds.length > 0 ? appointment.provider_name : getProviderName());

      await updateAppointment.mutateAsync({
        appointmentId: appointment.id,
        updates: {
          client_id: meetingType === 'client' && selectedClientIds.length > 0 ? selectedClientIds[0] : null,
          branch_id: effectiveBranchId,
          appointment_date: date,
          appointment_time: time,
          appointment_type: `${formatMeetingType(meetingType)} Meeting: ${title}`,
          provider_name: providerName,
          location: location || getDefaultLocation(),
          status: status,
          notes: `Meeting Type: ${meetingType}\n${selectedClientIds.length > 0 ? `Client IDs: ${selectedClientIds.join(',')}\n` : ''}${selectedStaffIds.length > 0 ? `Staff IDs: ${selectedStaffIds.join(',')}\n` : ''}${selectedSuperAdmins.length > 0 ? `Super Admin IDs: ${selectedSuperAdmins.join(',')}\n` : ''}${selectedBranchAdmins.length > 0 ? `Branch Admin IDs: ${selectedBranchAdmins.join(',')}\n` : ''}${notes}`
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
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
          <DialogTitle>Edit Meeting</DialogTitle>
          <DialogDescription>Update meeting details and information.</DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-6" style={{ maxHeight: 'calc(85vh - 180px)' }}>
          <div className="grid gap-4 py-4 pr-2">
            <div className="space-y-2">
              <Label htmlFor="meetingType">Meeting Type</Label>
              <SafeSelect value={meetingType} onValueChange={setMeetingType}>
                <SafeSelectTrigger className="h-10">
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

            <div className="space-y-2">
              <Label htmlFor="title">Meeting Title</Label>
              <Input
                id="title"
                className="h-10"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter meeting title"
              />
            </div>

            {/* Participants Section - Matching NewMeetingDialog structure */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <Label className="text-sm font-semibold mb-4 block">Participants</Label>
              <div className="space-y-4">
                {/* Client Selection - Multi-Select (only for client meetings) */}
                {meetingType === 'client' && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Clients *</Label>
                    <ClientMultiSelect
                      branchId={effectiveBranchId || ''}
                      selectedIds={selectedClientIds}
                      onChange={(ids, data) => {
                        setSelectedClientIds(ids);
                        setSelectedClientsData(data);
                      }}
                      placeholder="Select one or more clients"
                    />
                  </div>
                )}

                {/* Super Admin Selection (Optional) */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Super Admin (Optional)</Label>
                  <AdminMultiSelect
                    admins={superAdmins}
                    selectedIds={selectedSuperAdmins}
                    onChange={setSelectedSuperAdmins}
                    placeholder="Select super admins to notify"
                  />
                </div>

                {/* Branch Admin Selection (Optional) */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Branch Admin (Optional)</Label>
                  <AdminMultiSelect
                    admins={branchAdmins}
                    selectedIds={selectedBranchAdmins}
                    onChange={setSelectedBranchAdmins}
                    placeholder="Select branch admins to notify"
                  />
                </div>

                {/* Staff Selection - Multi-Select */}
                {(meetingType === 'client' || meetingType === 'internal') && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Staff Members (Optional)</Label>
                    <StaffMultiSelect
                      branchId={effectiveBranchId || ''}
                      selectedIds={selectedStaffIds}
                      onChange={(ids, data) => {
                        setSelectedStaffIds(ids);
                        setSelectedStaffData(data);
                      }}
                      placeholder="Select one or more staff members"
                    />
                  </div>
                )}
              </div>
            </div>

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
                placeholder="Enter location"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <SafeSelect value={status} onValueChange={setStatus}>
                <SafeSelectTrigger className="h-10">
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
        </div>

        <DialogFooter className="flex-shrink-0 px-6 pb-6 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateMeeting}
            disabled={!title || (meetingType === 'client' && selectedClientIds.length === 0) || !date || !time || updateAppointment.isPending}
          >
            {updateAppointment.isPending ? 'Updating...' : 'Update Meeting'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};