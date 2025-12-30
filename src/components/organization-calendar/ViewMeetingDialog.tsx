import React from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, User, MapPin, FileText, Trash2, Edit, Users, Shield, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ViewMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: any;
  onEdit?: () => void;
  onDelete?: () => void;
}

// Helper to parse participant IDs from notes
const parseParticipantIds = (notes: string | null, prefix: string): string[] => {
  if (!notes) return [];
  const regex = new RegExp(`${prefix}: ([a-f0-9-,]+)`);
  const match = notes.match(regex);
  return match ? match[1].split(',').filter(id => id.trim()) : [];
};

export const ViewMeetingDialog: React.FC<ViewMeetingDialogProps> = ({
  open,
  onOpenChange,
  appointment,
  onEdit,
  onDelete,
}) => {
  if (!appointment) return null;

  // Parse meeting type and title from appointment_type
  const meetingTypeMatch = appointment.appointment_type?.match(/^(Client|Internal|Personal|Third Party) Meeting: (.+)$/);
  const meetingType = meetingTypeMatch?.[1] || 'Meeting';
  const meetingTitle = meetingTypeMatch?.[2] || appointment.appointment_type;

  // Parse all participant IDs from notes
  const clientIds = parseParticipantIds(appointment.notes, 'Client IDs');
  const staffIds = parseParticipantIds(appointment.notes, 'Staff IDs');
  const superAdminIds = parseParticipantIds(appointment.notes, 'Super Admin IDs');
  const branchAdminIds = parseParticipantIds(appointment.notes, 'Branch Admin IDs');

  // Clean notes (remove metadata)
  const cleanNotes = appointment.notes
    ?.replace(/Meeting Type: .+\n?/g, '')
    ?.replace(/Staff ID: .+\n?/g, '')
    ?.replace(/Staff IDs: .+\n?/g, '')
    ?.replace(/Client IDs: .+\n?/g, '')
    ?.replace(/Super Admin IDs: .+\n?/g, '')
    ?.replace(/Branch Admin IDs: .+\n?/g, '')
    .trim();

  // Fetch client names
  const { data: clientsData } = useQuery({
    queryKey: ['meeting-clients', clientIds],
    queryFn: async () => {
      if (clientIds.length === 0) return [];
      const { data } = await supabase
        .from('clients')
        .select('id, first_name, last_name')
        .in('id', clientIds);
      return data || [];
    },
    enabled: clientIds.length > 0 && open,
  });

  // Fetch staff names
  const { data: staffData } = useQuery({
    queryKey: ['meeting-staff', staffIds],
    queryFn: async () => {
      if (staffIds.length === 0) return [];
      const { data } = await supabase
        .from('staff')
        .select('id, first_name, last_name')
        .in('id', staffIds);
      return data || [];
    },
    enabled: staffIds.length > 0 && open,
  });

  // Fetch super admin names
  const { data: superAdminData } = useQuery({
    queryKey: ['meeting-super-admins', superAdminIds],
    queryFn: async () => {
      if (superAdminIds.length === 0) return [];
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', superAdminIds);
      return data || [];
    },
    enabled: superAdminIds.length > 0 && open,
  });

  // Fetch branch admin names
  const { data: branchAdminData } = useQuery({
    queryKey: ['meeting-branch-admins', branchAdminIds],
    queryFn: async () => {
      if (branchAdminIds.length === 0) return [];
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', branchAdminIds);
      return data || [];
    },
    enabled: branchAdminIds.length > 0 && open,
  });

  // Calculate end time (1 hour after start)
  const calculateEndTime = () => {
    if (!appointment.appointment_time) return 'N/A';
    const [hours, minutes] = appointment.appointment_time.split(':').map(Number);
    const endHours = (hours + 1) % 24;
    return `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const endTime = calculateEndTime();

  // Get meeting type color
  const getMeetingTypeColor = () => {
    switch (meetingType.toLowerCase()) {
      case 'client':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      case 'internal':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
      case 'personal':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'third party':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Fallback single client from relationship
  const singleClientName = appointment.clients 
    ? `${appointment.clients.first_name} ${appointment.clients.last_name}`
    : null;

  const branchName = appointment.branches?.name || 'N/A';

  // Format participant list
  const formatParticipantList = (participants: any[], nameField: 'full_name' | 'profile') => {
    if (!participants || participants.length === 0) return null;
    return participants.map(p => `${p.first_name} ${p.last_name}`).join(', ');
  };

  const clientNames = clientsData && clientsData.length > 0 
    ? clientsData.map(c => `${c.first_name} ${c.last_name}`).join(', ')
    : singleClientName;

  const staffNames = staffData && staffData.length > 0
    ? staffData.map(s => `${s.first_name} ${s.last_name}`).join(', ')
    : appointment.provider_name;

  const superAdminNames = superAdminData && superAdminData.length > 0
    ? superAdminData.map(a => `${a.first_name} ${a.last_name}`).join(', ')
    : null;

  const branchAdminNames = branchAdminData && branchAdminData.length > 0
    ? branchAdminData.map(a => `${a.first_name} ${a.last_name}`).join(', ')
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-purple-600">
            <Users className="h-5 w-5" />
            View Meeting Details
          </DialogTitle>
          <DialogDescription>
            Meeting information and details
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6" style={{ maxHeight: 'calc(85vh - 180px)' }}>
          <div className="space-y-6 py-4">
            {/* Meeting Type and Status */}
            <div className="flex items-center justify-between">
              <Badge variant="custom" className={getMeetingTypeColor()}>
                {meetingType} Meeting
              </Badge>
              <Badge variant="custom" className={getStatusColor(appointment.status)}>
                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
              </Badge>
            </div>

            <Separator />

            {/* Meeting Title */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="h-4 w-4" />
                Meeting Title
              </div>
              <div className="pl-6">
                <span className="text-lg font-semibold">{meetingTitle}</span>
              </div>
            </div>

            <Separator />

            {/* Schedule Information */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Schedule
              </div>
              <div className="pl-6 space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Date:</span>
                  <span className="text-sm font-medium">
                    {appointment.appointment_date 
                      ? format(new Date(appointment.appointment_date), "EEEE, MMMM d, yyyy")
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Start Time:</span>
                  <span className="text-sm font-medium">
                    {appointment.appointment_time || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">End Time:</span>
                  <span className="text-sm font-medium">{endTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Duration:</span>
                  <span className="text-sm font-medium">1 hour</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Participants */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="h-4 w-4" />
                Participants
              </div>
              <div className="pl-6 space-y-2">
                {/* Clients */}
                {clientNames && (
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Client{clientIds.length > 1 ? 's' : ''}:
                    </span>
                    <span className="text-sm font-medium text-right max-w-[60%]">{clientNames}</span>
                  </div>
                )}
                
                {/* Staff Members */}
                {staffNames && (
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Staff:
                    </span>
                    <span className="text-sm font-medium text-right max-w-[60%]">{staffNames}</span>
                  </div>
                )}

                {/* Super Admins */}
                {superAdminNames && (
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Super Admin{superAdminIds.length > 1 ? 's' : ''}:
                    </span>
                    <span className="text-sm font-medium text-right max-w-[60%]">{superAdminNames}</span>
                  </div>
                )}

                {/* Branch Admins */}
                {branchAdminNames && (
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      Branch Admin{branchAdminIds.length > 1 ? 's' : ''}:
                    </span>
                    <span className="text-sm font-medium text-right max-w-[60%]">{branchAdminNames}</span>
                  </div>
                )}

                {/* Branch */}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Branch:</span>
                  <span className="text-sm font-medium">{branchName}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Location */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Location
              </div>
              <div className="pl-6">
                <span className="text-sm font-medium">
                  {appointment.location || 'Not specified'}
                </span>
              </div>
            </div>

            {cleanNotes && (
              <>
                <Separator />
                
                {/* Notes */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    Notes
                  </div>
                  <div className="pl-6">
                    <div className="text-sm font-medium whitespace-pre-wrap break-words bg-muted/50 p-3 rounded-md">
                      {cleanNotes}
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>

        <DialogFooter className="flex-shrink-0 px-6 pb-6 pt-4 border-t gap-2 sm:gap-0">
          <div className="flex justify-between w-full">
            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Meeting
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this meeting. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {onEdit && (
                <Button onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Meeting
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};