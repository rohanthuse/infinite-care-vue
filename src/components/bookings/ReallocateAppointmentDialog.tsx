
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar, Clock, MapPin, Search, AlertCircle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface ReallocateAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: any;
  onReallocate: (appointmentId: string, newCarerId: string) => void;
}

// Mock data for available carers
const availableCarers = [
  {
    id: "c1",
    name: "Jennifer Adams",
    qualifications: ["Home Care", "Medication Administration"],
    distance: "2.3 miles",
    rating: 4.8,
    completedVisits: 245,
    available: true
  },
  {
    id: "c2",
    name: "David Reynolds",
    qualifications: ["Home Care", "Physical Therapy", "Elderly Care"],
    distance: "3.1 miles",
    rating: 4.6,
    completedVisits: 189,
    available: true
  },
  {
    id: "c3",
    name: "Patricia Wilson",
    qualifications: ["Home Care", "Medication Administration", "Dementia Care"],
    distance: "1.5 miles",
    rating: 4.9,
    completedVisits: 310,
    available: true
  },
  {
    id: "c4",
    name: "Thomas Garcia",
    qualifications: ["Home Care", "Elderly Care"],
    distance: "4.2 miles",
    rating: 4.5,
    completedVisits: 152,
    available: false
  }
];

const ReallocateAppointmentDialog: React.FC<ReallocateAppointmentDialogProps> = ({
  open,
  onOpenChange,
  appointment,
  onReallocate,
}) => {
  const [selectedCarer, setSelectedCarer] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReallocate = () => {
    if (!selectedCarer) return;
    
    setIsSubmitting(true);
    try {
      onReallocate(appointment.id, selectedCarer);
      resetForm();
      setIsSubmitting(false);
    } catch (error) {
      console.error("Error reallocating appointment:", error);
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedCarer("");
    setSearchQuery("");
    setAdminNotes("");
  };

  const filteredCarers = availableCarers.filter(carer => 
    carer.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    carer.available
  );

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetForm();
      onOpenChange(newOpen);
    }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reallocate Appointment</DialogTitle>
          <DialogDescription>
            Select a new carer for this appointment.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="flex flex-col space-y-2 border rounded-lg p-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium text-sm">
                  {appointment.clientName?.split(" ").map((name: string) => name[0]).join("")}
                </div>
                <p className="text-sm font-medium">{appointment.clientName}</p>
              </div>
              <Badge className="bg-indigo-100 text-indigo-800">
                Needs Reallocation
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="flex items-center text-xs text-gray-600">
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                <span>{format(appointment.date, "EEE, MMM d, yyyy")}</span>
              </div>
              <div className="flex items-center text-xs text-gray-600">
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                <span>{appointment.time}</span>
              </div>
              <div className="flex items-center text-xs text-gray-600">
                <MapPin className="h-3.5 w-3.5 mr-1.5" />
                <span>{appointment.location}</span>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Previous Carer: {appointment.carerName}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Available Carers</Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input 
                className="pl-8"
                placeholder="Search carers by name" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {filteredCarers.length > 0 ? (
              <RadioGroup value={selectedCarer} onValueChange={setSelectedCarer} className="mt-3">
                {filteredCarers.map(carer => (
                  <div 
                    key={carer.id}
                    className={`flex items-center space-x-2 border p-3 rounded-md ${
                      selectedCarer === carer.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                    } mb-2`}
                  >
                    <RadioGroupItem value={carer.id} id={`carer-${carer.id}`} />
                    <Label htmlFor={`carer-${carer.id}`} className="flex flex-1 cursor-pointer">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{carer.name}</span>
                          <span className="text-xs">{carer.distance} away</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {carer.qualifications.map((qual, idx) => (
                            <span key={idx} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                              {qual}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center text-xs">
                          <div className="flex items-center text-amber-500">
                            {Array(5).fill(0).map((_, i) => (
                              <span key={i} className="text-xs">★</span>
                            ))}
                          </div>
                          <span className="ml-1">{carer.rating}/5.0</span>
                          <span className="mx-1.5">·</span>
                          <span>{carer.completedVisits} visits</span>
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="py-8 text-center border rounded-md">
                <p className="text-gray-500">No available carers match your search criteria</p>
              </div>
            )}
            
            {selectedCarer && (
              <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg mt-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-xs text-green-700">
                  This carer is available for the specified time slot.
                </p>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="adminNotes">Notes for New Carer (Optional)</Label>
            <Textarea
              id="adminNotes"
              placeholder="Add any special instructions or notes for the new carer"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="h-20"
            />
          </div>
          
          <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <p className="text-xs text-blue-700">
              The previous carer will be notified that they've been released from this appointment.
              The new carer will receive a notification about the appointment assignment.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleReallocate}
            disabled={!selectedCarer || isSubmitting}
          >
            Confirm Reallocation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReallocateAppointmentDialog;
