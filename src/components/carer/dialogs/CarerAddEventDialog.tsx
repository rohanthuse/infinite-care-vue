
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface CarerAddEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  client: {
    id: string;
    name: string;
  };
}

export const CarerAddEventDialog: React.FC<CarerAddEventDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  client
}) => {
  const [eventData, setEventData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm'),
    eventType: '',
    description: '',
    severity: 'low',
    actionTaken: '',
  });

  const eventTypes = [
    "Fall",
    "Medication Issue",
    "Change in Condition",
    "Behavioral Change",
    "Missed Appointment",
    "Communication Issue",
    "Equipment Problem",
    "Other"
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEventData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setEventData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const carerName = localStorage.getItem("carerName") || "Carer";
    
    onSubmit({
      ...eventData,
      clientId: client.id,
      clientName: client.name,
      reportedBy: carerName,
      timestamp: new Date().toISOString()
    });
    
    // Reset form after submission
    setEventData({
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm'),
      eventType: '',
      description: '',
      severity: 'low',
      actionTaken: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <span>Record Event</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="date"
                  name="date"
                  type="date"
                  className="pl-9"
                  value={eventData.date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                name="time"
                type="time"
                value={eventData.time}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="eventType">Event Type</Label>
            <Select 
              name="eventType" 
              value={eventData.eventType}
              onValueChange={(value) => handleSelectChange("eventType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe what happened"
              rows={3}
              value={eventData.description}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="severity">Severity</Label>
            <Select 
              name="severity" 
              value={eventData.severity}
              onValueChange={(value) => handleSelectChange("severity", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="actionTaken">Action Taken</Label>
            <Textarea
              id="actionTaken"
              name="actionTaken"
              placeholder="Describe actions taken in response"
              rows={2}
              value={eventData.actionTaken}
              onChange={handleChange}
            />
          </div>
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Submit Event</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
