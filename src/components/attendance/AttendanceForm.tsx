
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, UserPlus, Users, Clock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { toast } from "sonner";

interface AttendanceFormProps {
  branchId: string;
}

export function AttendanceForm({ branchId }: AttendanceFormProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [attendanceType, setAttendanceType] = useState("staff");
  const [bulkMode, setBulkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [timeIn, setTimeIn] = useState("");
  const [timeOut, setTimeOut] = useState("");

  // Mock staff list - would come from an API in a real application
  const staffList = [
    { id: "1", name: "Jane Smith", role: "Nurse" },
    { id: "2", name: "John Doe", role: "Caregiver" },
    { id: "3", name: "Emily Johnson", role: "Administrator" },
    { id: "4", name: "Michael Brown", role: "Physiotherapist" },
    { id: "5", name: "Sarah Lee", role: "Support Worker" },
    { id: "6", name: "David Wilson", role: "Driver" },
  ];

  const clientsList = [
    { id: "1", name: "Alice Williams", service: "Daily Care" },
    { id: "2", name: "Robert Davis", service: "Physical Therapy" },
    { id: "3", name: "Susan Miller", service: "Medication Management" },
    { id: "4", name: "Thomas Wilson", service: "Transport" },
    { id: "5", name: "Margaret Jones", service: "Home Visits" },
    { id: "6", name: "James Taylor", service: "Social Care" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date) {
      toast.error("Please select a date");
      return;
    }
    
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success("Attendance recorded successfully!");
      // Reset form fields if needed
      if (!bulkMode) {
        setTimeIn("");
        setTimeOut("");
        setNotes("");
      }
    }, 1000);
  };

  const currentList = attendanceType === "staff" ? staffList : clientsList;

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Record Attendance</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="bulkMode"
                    checked={bulkMode}
                    onCheckedChange={(checked) => setBulkMode(checked === true)}
                  />
                  <Label htmlFor="bulkMode" className="cursor-pointer">Bulk Entry Mode</Label>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="attendanceType">Attendance Type</Label>
                    <Select 
                      value={attendanceType} 
                      onValueChange={setAttendanceType}
                    >
                      <SelectTrigger id="attendanceType" className="mt-1">
                        <SelectValue placeholder="Select attendance type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>Staff Attendance</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="client">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>Client Attendance</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal mt-1",
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
                          onSelect={setDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {!bulkMode ? (
                    <>
                      <div>
                        <Label htmlFor="person">{attendanceType === "staff" ? "Staff Member" : "Client"}</Label>
                        <Select>
                          <SelectTrigger id="person" className="mt-1">
                            <SelectValue placeholder={`Select ${attendanceType === "staff" ? "staff member" : "client"}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {currentList.map(item => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.name} - {attendanceType === "staff" ? item.role : item.service}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select>
                          <SelectTrigger id="status" className="mt-1">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="present">Present</SelectItem>
                            <SelectItem value="absent">Absent</SelectItem>
                            <SelectItem value="late">Late</SelectItem>
                            <SelectItem value="excused">Excused</SelectItem>
                            <SelectItem value="half_day">Half Day</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="time">Time</Label>
                        <div className="flex space-x-2 mt-1">
                          <div className="relative flex-1">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="time-in"
                              type="time"
                              placeholder="Check-in"
                              className="pl-10"
                              value={timeIn}
                              onChange={(e) => setTimeIn(e.target.value)}
                            />
                          </div>
                          <div className="relative flex-1">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="time-out"
                              type="time"
                              placeholder="Check-out"
                              className="pl-10"
                              value={timeOut}
                              onChange={(e) => setTimeOut(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>{attendanceType === "staff" ? "Staff Members" : "Clients"}</Label>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          className="h-8"
                        >
                          {attendanceType === "staff" ? (
                            <UserPlus className="mr-1 h-3.5 w-3.5" />
                          ) : (
                            <Users className="mr-1 h-3.5 w-3.5" />
                          )}
                          <span>Select All</span>
                        </Button>
                      </div>
                      
                      <div className="max-h-64 overflow-y-auto border rounded-md p-2">
                        {currentList.map(item => (
                          <div key={item.id} className="flex items-center space-x-2 py-2 border-b last:border-0">
                            <Checkbox id={`${attendanceType}-${item.id}`} />
                            <Label htmlFor={`${attendanceType}-${item.id}`} className="flex-1 cursor-pointer">
                              {item.name} <span className="text-gray-500 text-sm">({attendanceType === "staff" ? item.role : item.service})</span>
                            </Label>
                            <Select defaultValue="present">
                              <SelectTrigger className="h-8 w-28">
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="present">Present</SelectItem>
                                <SelectItem value="absent">Absent</SelectItem>
                                <SelectItem value="late">Late</SelectItem>
                                <SelectItem value="excused">Excused</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                      
                      <div>
                        <Label htmlFor="bulk-time">Default Time</Label>
                        <div className="flex space-x-2 mt-1">
                          <div className="relative flex-1">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="bulk-time-in"
                              type="time"
                              placeholder="Check-in"
                              className="pl-10"
                            />
                          </div>
                          <div className="relative flex-1">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="bulk-time-out"
                              type="time"
                              placeholder="Check-out"
                              className="pl-10"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes or comments..."
                  className="h-24 mt-1"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-2">
              <Button variant="outline" type="button">
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Record Attendance"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
