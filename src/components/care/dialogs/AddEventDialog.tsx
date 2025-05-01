
import React, { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BodyMapSelector } from "@/components/events-logs/BodyMapSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AddEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (event: any) => void;
  carePlanId: string;
  patientName: string;
  patientId: string;
}

export function AddEventDialog({
  open,
  onOpenChange,
  onSave,
  carePlanId,
  patientName,
  patientId,
}: AddEventDialogProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState(format(new Date(), "HH:mm"));
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [injuryOccurred, setInjuryOccurred] = useState("no");
  const [bodyMapPoints, setBodyMapPoints] = useState<Array<{ id: string; x: number; y: number; type: string; description: string }>>([]);

  const resetForm = () => {
    setTitle("");
    setCategory("");
    setLocation("");
    setDate(new Date());
    setTime(format(new Date(), "HH:mm"));
    setDetails("");
    setInjuryOccurred("no");
    setBodyMapPoints([]);
    setActiveTab("details");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newEvent = {
        title,
        category,
        location,
        date: format(date, "yyyy-MM-dd"),
        time,
        details,
        carePlanId,
        patientName,
        patientId,
        eventType: "client",
        status: "Draft",
        injuryOccurred,
        bodyMapPoints: injuryOccurred === "yes" ? bodyMapPoints : [],
      };

      onSave(newEvent);
      resetForm();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Event or Log</DialogTitle>
          <DialogDescription>
            Create a new event or log entry for this care plan
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="details">Event Details</TabsTrigger>
            <TabsTrigger value="injury">Body Map/Injury</TabsTrigger>
          </TabsList>
          
          <form onSubmit={handleSubmit}>
            <TabsContent value="details" className="space-y-4 mt-2">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter event title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={category}
                    onValueChange={setCategory}
                    required
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="accident">Accident</SelectItem>
                      <SelectItem value="incident">Incident</SelectItem>
                      <SelectItem value="medication_error">Medication Error</SelectItem>
                      <SelectItem value="safeguarding">Safeguarding</SelectItem>
                      <SelectItem value="complaint">Complaint</SelectItem>
                      <SelectItem value="compliment">Compliment</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="location"
                      className="pl-10"
                      placeholder="Enter location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="date"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={(date) => date && setDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="details">Event Details</Label>
                  <Textarea
                    id="details"
                    placeholder="Provide details about the event"
                    className="min-h-[80px]"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Did an injury occur?</Label>
                  <RadioGroup 
                    value={injuryOccurred} 
                    onValueChange={(value) => {
                      setInjuryOccurred(value);
                      if (value === "yes") {
                        setActiveTab("injury");
                      }
                    }}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="injury-yes" />
                      <Label htmlFor="injury-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="injury-no" />
                      <Label htmlFor="injury-no">No</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid gap-2">
                  <Label>Care Plan Information</Label>
                  <div className="bg-gray-50 p-3 rounded-md text-sm">
                    <div className="grid grid-cols-2 gap-1">
                      <span className="text-gray-500">Care Plan ID:</span>
                      <span>{carePlanId}</span>
                      <span className="text-gray-500">Patient:</span>
                      <span>{patientName}</span>
                      <span className="text-gray-500">Patient ID:</span>
                      <span>{patientId}</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="injury" className="mt-2">
              <div className="space-y-4">
                {injuryOccurred === "yes" ? (
                  <>
                    <div className="bg-amber-50 p-3 rounded-md border border-amber-200 text-amber-800 mb-4">
                      <p className="text-sm font-medium">You've indicated an injury occurred. Please document it using the body map below.</p>
                    </div>
                    
                    <BodyMapSelector 
                      bodyMapPoints={bodyMapPoints} 
                      setBodyMapPoints={setBodyMapPoints} 
                    />
                  </>
                ) : (
                  <div className="p-8 text-center bg-gray-50 rounded-lg">
                    <p className="text-gray-500">
                      You indicated no injury occurred. If this is incorrect, please go back to the Details tab and change your selection.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Event"}
              </Button>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
