
import React, { useState } from "react";
import { Plus, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Attendee {
  id: string;
  name: string;
  relationship: string;
  timeIn?: string;
  timeOut?: string;
}

interface OtherAttendeesProps {
  value: Array<Attendee>;
  onChange: (attendees: Array<Attendee>) => void;
}

export function OtherAttendees({ value = [], onChange }: OtherAttendeesProps) {
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");

  const handleAddAttendee = () => {
    if (!name || !relationship) return;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const newAttendee: Attendee = {
      id: crypto.randomUUID(),
      name,
      relationship,
      timeIn: currentTime
    };
    
    onChange([...value, newAttendee]);
    setName("");
    setRelationship("");
  };

  const handleRemoveAttendee = (id: string) => {
    onChange(value.filter(attendee => attendee.id !== id));
  };

  const handleTimeChange = (id: string, field: "timeIn" | "timeOut", time: string) => {
    onChange(value.map(attendee => {
      if (attendee.id === id) {
        return { ...attendee, [field]: time };
      }
      return attendee;
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2 items-end">
          <div className="md:col-span-3">
            <Label htmlFor="attendee-name" className="text-xs mb-1">Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                id="attendee-name"
                placeholder="Person's name" 
                className="pl-10" 
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          </div>
          
          <div className="md:col-span-3">
            <Label htmlFor="relationship" className="text-xs mb-1">Relationship</Label>
            <Select value={relationship} onValueChange={setRelationship}>
              <SelectTrigger id="relationship">
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="family">Family Member</SelectItem>
                <SelectItem value="friend">Friend</SelectItem>
                <SelectItem value="professional">Healthcare Professional</SelectItem>
                <SelectItem value="social_worker">Social Worker</SelectItem>
                <SelectItem value="caregiver">Caregiver</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            type="button" 
            onClick={handleAddAttendee}
            disabled={!name || !relationship}
            className="md:col-span-1 h-10"
          >
            <Plus className="h-4 w-4" />
            <span className="sr-only">Add Person</span>
          </Button>
        </div>
      </div>
      
      {value.length > 0 ? (
        <div className="space-y-2">
          {value.map(attendee => (
            <Card key={attendee.id}>
              <CardContent className="p-4">
                <div className="flex flex-col space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{attendee.name}</h4>
                      <p className="text-sm text-gray-500">
                        {attendee.relationship === "family" && "Family Member"}
                        {attendee.relationship === "friend" && "Friend"}
                        {attendee.relationship === "professional" && "Healthcare Professional"}
                        {attendee.relationship === "social_worker" && "Social Worker"}
                        {attendee.relationship === "caregiver" && "Caregiver"}
                        {attendee.relationship === "other" && "Other"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRemoveAttendee(attendee.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor={`time-in-${attendee.id}`} className="text-xs mb-1">
                        Time In
                      </Label>
                      <Input
                        id={`time-in-${attendee.id}`}
                        type="time"
                        value={attendee.timeIn || ""}
                        onChange={e => handleTimeChange(attendee.id, "timeIn", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`time-out-${attendee.id}`} className="text-xs mb-1">
                        Time Out
                      </Label>
                      <Input
                        id={`time-out-${attendee.id}`}
                        type="time"
                        value={attendee.timeOut || ""}
                        onChange={e => handleTimeChange(attendee.id, "timeOut", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 border border-dashed border-gray-300 rounded-md">
          <p className="text-gray-500">No other attendees added yet</p>
        </div>
      )}
    </div>
  );
}
