
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
import { useAgreementTypes, useAgreementTemplates, useClients, useStaff, useCreateScheduledAgreement } from "@/data/hooks/agreements";

// Time slots
const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
];

interface ScheduleAgreementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
}

export function ScheduleAgreementDialog({
  open,
  onOpenChange,
  branchId
}: ScheduleAgreementDialogProps) {
  const [title, setTitle] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("");
  const [schedulingWith, setSchedulingWith] = useState<"client" | "staff" | "other">("client");
  const [otherPersonName, setOtherPersonName] = useState("");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState("");
  const [notes, setNotes] = useState("");
  
  // Fetch data
  const { data: agreementTypes, isLoading: typesLoading } = useAgreementTypes();
  const { data: templates, isLoading: templatesLoading } = useAgreementTemplates({
    searchQuery: "",
    typeFilter: selectedType || "all",
    branchId
  });
  const { data: clients, isLoading: clientsLoading } = useClients(branchId);
  const { data: staff, isLoading: staffLoading } = useStaff(branchId);
  
  const createScheduledAgreementMutation = useCreateScheduledAgreement();
  
  const handleScheduleAgreement = async () => {
    if (!title || !scheduledDate || !scheduledTime) {
      return;
    }
    
    // Combine date and time
    const scheduledDateTime = new Date(scheduledDate);
    const [hours, minutes] = scheduledTime.split(':');
    scheduledDateTime.setHours(parseInt(hours), parseInt(minutes));
    
    // Determine scheduled with name
    let scheduledWithName = "";
    if (schedulingWith === "client" && selectedClient) {
      const client = clients?.find(c => c.id === selectedClient);
      scheduledWithName = client ? `${client.first_name} ${client.last_name}` : "";
    } else if (schedulingWith === "staff" && selectedStaff) {
      const staffMember = staff?.find(s => s.id === selectedStaff);
      scheduledWithName = staffMember ? `${staffMember.first_name} ${staffMember.last_name}` : "";
    } else if (schedulingWith === "other") {
      scheduledWithName = otherPersonName;
    }
    
    try {
      await createScheduledAgreementMutation.mutateAsync({
        title,
        scheduled_for: scheduledDateTime.toISOString(),
        scheduled_with_name: scheduledWithName,
        scheduled_with_client_id: schedulingWith === "client" ? selectedClient || null : null,
        scheduled_with_staff_id: schedulingWith === "staff" ? selectedStaff || null : null,
        type_id: selectedType || null,
        template_id: selectedTemplate || null,
        status: "Upcoming",
        notes: notes || null,
        branch_id: branchId !== "global" ? branchId : null,
        created_by: null, // Will be set by auth context when available
      });
      
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error scheduling agreement:', error);
    }
  };
  
  const resetForm = () => {
    setTitle("");
    setSelectedType("");
    setSelectedTemplate("");
    setSelectedClient("");
    setSelectedStaff("");
    setSchedulingWith("client");
    setOtherPersonName("");
    setScheduledDate(undefined);
    setScheduledTime("");
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
            Schedule a date and time for agreement signing
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
                <label className="text-sm font-medium">Client</label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.first_name} {client.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {schedulingWith === "staff" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Staff Member</label>
                <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff?.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.first_name} {member.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            disabled={createScheduledAgreementMutation.isPending || !title || !scheduledDate || !scheduledTime}
          >
            {createScheduledAgreementMutation.isPending ? "Processing..." : "Schedule Agreement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
