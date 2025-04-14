
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
import { toast } from "sonner";
import { Calendar as CalendarIcon, Clock, Users, Tag } from "lucide-react";
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

// Mock clients list
const mockClients = [
  { id: "CL001", name: "Aderinsola Thomas" },
  { id: "CL002", name: "James Wilson" },
  { id: "CL003", name: "Sophia Martinez" },
  { id: "CL004", name: "Michael Johnson" },
  { id: "CL005", name: "Emma Williams" },
  { id: "CL006", name: "Daniel Smith" },
  { id: "CL007", name: "Olivia Brown" },
  { id: "CL008", name: "Noah Davis" }
];

// Mock templates list
const mockTemplates = [
  { id: 1, title: "Standard Employment Contract", type: "Employment Agreement" },
  { id: 2, title: "Non-Disclosure Agreement", type: "NDA" },
  { id: 3, title: "Service Level Agreement", type: "Service Agreement" },
  { id: 4, title: "Data Processing Agreement", type: "Data Agreement" },
  { id: 5, title: "Caretaker Contract", type: "Employment Agreement" }
];

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
  const [selectedClient, setSelectedClient] = useState("");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  
  const handleScheduleAgreement = async () => {
    if (!title || !selectedClient || !scheduledDate || !scheduledTime) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setLoading(true);
    
    try {
      // In a real app, we would make an API call here
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Agreement scheduled successfully");
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to schedule agreement");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const resetForm = () => {
    setTitle("");
    setSelectedClient("");
    setScheduledDate(undefined);
    setScheduledTime("");
    setSelectedTemplate("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) resetForm();
      onOpenChange(value);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Agreement Signing</DialogTitle>
          <DialogDescription>
            Schedule a date and time for agreement signing
          </DialogDescription>
        </DialogHeader>
        
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
            <label className="text-sm font-medium">
              Client <span className="text-red-500">*</span>
            </label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {mockClients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Agreement Template
            </label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select template (optional)" />
              </SelectTrigger>
              <SelectContent>
                {mockTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id.toString()}>
                    {template.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Type <span className="text-red-500">*</span>
            </label>
            <Select defaultValue="Employment Agreement">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select agreement type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Employment Agreement">Employment Agreement</SelectItem>
                <SelectItem value="Service Agreement">Service Agreement</SelectItem>
                <SelectItem value="NDA">Non-Disclosure Agreement</SelectItem>
                <SelectItem value="Data Agreement">Data Agreement</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleScheduleAgreement} 
            disabled={loading || !title || !selectedClient || !scheduledDate || !scheduledTime}
          >
            {loading ? "Processing..." : "Schedule Agreement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
