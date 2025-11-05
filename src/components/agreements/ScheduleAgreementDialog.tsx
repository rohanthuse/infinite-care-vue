import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, Clock, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { useAgreementTypes, useAgreementTemplates, useClients, useStaff, useCreateScheduledAgreement } from "@/data/hooks/agreements";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Time slots
const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
];

interface ScheduleAgreementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId?: string;
  isOrganizationLevel?: boolean;
  prefilledDate?: Date;
  prefilledTime?: string;
}

export function ScheduleAgreementDialog({
  open,
  onOpenChange,
  branchId,
  isOrganizationLevel = false,
  prefilledDate,
  prefilledTime
}: ScheduleAgreementDialogProps) {
  const [title, setTitle] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [schedulingWith, setSchedulingWith] = useState<"client" | "staff" | "other">("client");
  const [otherPersonName, setOtherPersonName] = useState("");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(prefilledDate);
  const [scheduledTime, setScheduledTime] = useState(prefilledTime || "");
  const [notes, setNotes] = useState("");
  
  // Fetch data
  const { data: agreementTypes, isLoading: typesLoading } = useAgreementTypes();
  const { data: templates, isLoading: templatesLoading } = useAgreementTemplates({
    searchQuery: "",
    typeFilter: selectedType || "all",
    branchId,
    isOrganizationLevel
  });
  const { data: clients, isLoading: clientsLoading } = useClients(branchId);
  const { data: staff, isLoading: staffLoading } = useStaff(branchId);
  
  const createScheduledAgreementMutation = useCreateScheduledAgreement();
  
  const handleScheduleAgreement = async () => {
    if (!title || !scheduledDate || !scheduledTime) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    // Validation: ensure at least one person is selected
    if (schedulingWith === "client" && selectedClients.length === 0) {
      toast.error("Please select at least one client");
      return;
    }
    
    if (schedulingWith === "staff" && selectedStaff.length === 0) {
      toast.error("Please select at least one staff member");
      return;
    }
    
    if (schedulingWith === "other" && !otherPersonName.trim()) {
      toast.error("Please enter the person's name");
      return;
    }
    
    // Combine date and time
    const scheduledDateTime = new Date(scheduledDate);
    const [hours, minutes] = scheduledTime.split(':');
    scheduledDateTime.setHours(parseInt(hours), parseInt(minutes));
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Determine which persons to create agreements for
      let personsToSchedule: Array<{
        name: string;
        clientId?: string;
        staffId?: string;
      }> = [];
      
      if (schedulingWith === "client") {
        personsToSchedule = selectedClients.map(clientId => {
          const client = clients?.find(c => c.id === clientId);
          return {
            name: client ? `${client.first_name} ${client.last_name}` : "",
            clientId: clientId
          };
        });
      } else if (schedulingWith === "staff") {
        personsToSchedule = selectedStaff.map(staffId => {
          const staffMember = staff?.find(s => s.id === staffId);
          return {
            name: staffMember ? `${staffMember.first_name} ${staffMember.last_name}` : "",
            staffId: staffId
          };
        });
      } else if (schedulingWith === "other") {
        personsToSchedule = [{
          name: otherPersonName
        }];
      }
      
      // Create multiple scheduled agreements (one per person)
      const createPromises = personsToSchedule.map(person => 
        createScheduledAgreementMutation.mutateAsync({
          title,
          scheduled_for: scheduledDateTime.toISOString(),
          scheduled_with_name: person.name,
          scheduled_with_client_id: person.clientId || null,
          scheduled_with_staff_id: person.staffId || null,
          type_id: selectedType || null,
          template_id: selectedTemplate || null,
          status: "Upcoming",
          notes: notes || null,
          attachment_file_id: null,
          branch_id: isOrganizationLevel ? null : branchId || null,
          created_by: user?.id || null,
        })
      );
      
      // Execute all creates in parallel with error handling
      const results = await Promise.allSettled(createPromises);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      if (failed === 0) {
        toast.success(
          `Successfully scheduled ${successful} agreement${successful > 1 ? 's' : ''}`,
          {
            description: `${successful} scheduled agreement${successful > 1 ? 's have' : ' has'} been created`
          }
        );
      } else if (successful > 0) {
        toast.warning(
          `Partially successful: ${successful} scheduled, ${failed} failed`,
          { description: 'Some agreements could not be created. Please try again for failed ones.' }
        );
      } else {
        toast.error('Failed to schedule agreements. Please try again.');
      }
      
      if (successful > 0) {
        resetForm();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error scheduling agreements:', error);
      toast.error('An unexpected error occurred');
    }
  };
  
  const resetForm = () => {
    setTitle("");
    setSelectedType("");
    setSelectedTemplate("");
    setSelectedClients([]);
    setSelectedStaff([]);
    setSchedulingWith("client");
    setOtherPersonName("");
    setScheduledDate(prefilledDate);
    setScheduledTime(prefilledTime || "");
    setNotes("");
  };

  const isLoading = typesLoading || templatesLoading || clientsLoading || staffLoading;

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) resetForm();
      onOpenChange(value);
    }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Agreement Signing</DialogTitle>
          <DialogDescription>
            Schedule a date and time for agreement signing. You can select multiple clients or staff members to create bulk agreements.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Agreement Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                placeholder="Enter agreement title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Agreement Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select agreement type" />
                </SelectTrigger>
                <SelectContent>
                  {agreementTypes?.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Template (Optional)</label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select template (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {templates?.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Scheduling With</label>
              <Select value={schedulingWith} onValueChange={(value: "client" | "staff" | "other") => setSchedulingWith(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="other">Other Person</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {schedulingWith === "client" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Clients <span className="text-red-500">*</span>
                </label>
                <MultiSelect
                  options={clients?.map(client => ({
                    label: `${client.first_name} ${client.last_name}`,
                    value: client.id
                  })) || []}
                  selected={selectedClients}
                  onSelectionChange={setSelectedClients}
                  placeholder="Select clients..."
                  searchPlaceholder="Search clients..."
                  emptyText="No clients found"
                  maxDisplay={3}
                  showSelectAll={true}
                />
                <p className="text-xs text-muted-foreground">
                  {selectedClients.length} client{selectedClients.length !== 1 ? 's' : ''} selected. Separate agreement will be created for each.
                </p>
              </div>
            )}

            {schedulingWith === "staff" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Staff Members <span className="text-red-500">*</span>
                </label>
                <MultiSelect
                  options={staff?.map(member => ({
                    label: `${member.first_name} ${member.last_name}`,
                    value: member.id
                  })) || []}
                  selected={selectedStaff}
                  onSelectionChange={setSelectedStaff}
                  placeholder="Select staff members..."
                  searchPlaceholder="Search staff..."
                  emptyText="No staff members found"
                  maxDisplay={3}
                  showSelectAll={true}
                />
                <p className="text-xs text-muted-foreground">
                  {selectedStaff.length} staff member{selectedStaff.length !== 1 ? 's' : ''} selected. Separate agreement will be created for each.
                </p>
              </div>
            )}

            {schedulingWith === "other" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Person Name</label>
                <Input
                  placeholder="Enter name of person"
                  value={otherPersonName}
                  onChange={(e) => setOtherPersonName(e.target.value)}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Date <span className="text-red-500">*</span>
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !scheduledDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduledDate ? format(scheduledDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={setScheduledDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Time <span className="text-red-500">*</span>
                </label>
                <Select value={scheduledTime} onValueChange={setScheduledTime}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                placeholder="Enter any additional notes about the agreement"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleScheduleAgreement} 
            disabled={
              createScheduledAgreementMutation.isPending || 
              !title || 
              !scheduledDate || 
              !scheduledTime ||
              (schedulingWith === "client" && selectedClients.length === 0) ||
              (schedulingWith === "staff" && selectedStaff.length === 0) ||
              (schedulingWith === "other" && !otherPersonName.trim())
            }
          >
            {createScheduledAgreementMutation.isPending 
              ? "Processing..." 
              : `Schedule Agreement${(schedulingWith === 'client' && selectedClients.length > 1) || (schedulingWith === 'staff' && selectedStaff.length > 1) ? 's' : ''}`
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
