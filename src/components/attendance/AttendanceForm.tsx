
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, UserPlus, Users } from "lucide-react";
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

  // Mock staff list - would come from an API in a real application
  const staffList = [
    { id: "1", name: "Jane Smith", role: "Nurse" },
    { id: "2", name: "John Doe", role: "Caregiver" },
    { id: "3", name: "Emily Johnson", role: "Administrator" },
    { id: "4", name: "Michael Brown", role: "Physiotherapist" },
  ];

  const clientsList = [
    { id: "1", name: "Alice Williams", service: "Daily Care" },
    { id: "2", name: "Robert Davis", service: "Physical Therapy" },
    { id: "3", name: "Susan Miller", service: "Medication Management" },
    { id: "4", name: "Thomas Wilson", service: "Transport" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success("Attendance recorded successfully!");
    }, 1000);
  };

  return (
    <Card>
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
                  <Label htmlFor="bulkMode">Bulk Entry Mode</Label>
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
                      <SelectTrigger id="attendanceType">
                        <SelectValue placeholder="Select attendance type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">Staff Attendance</SelectItem>
                        <SelectItem value="client">Client Attendance</SelectItem>
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
                          <SelectTrigger id="person">
                            <SelectValue placeholder={`Select ${attendanceType === "staff" ? "staff member" : "client"}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {attendanceType === "staff" ? (
                              staffList.map(staff => (
                                <SelectItem key={staff.id} value={staff.id}>
                                  {staff.name} - {staff.role}
                                </SelectItem>
                              ))
                            ) : (
                              clientsList.map(client => (
                                <SelectItem key={client.id} value={client.id}>
                                  {client.name} - {client.service}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select>
                          <SelectTrigger id="status">
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
                        <div className="flex space-x-2">
                          <Input
                            id="time-in"
                            type="time"
                            placeholder="Check-in"
                          />
                          <Input
                            id="time-out"
                            type="time"
                            placeholder="Check-out"
                          />
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
                        {attendanceType === "staff" ? (
                          staffList.map(staff => (
                            <div key={staff.id} className="flex items-center space-x-2 py-2 border-b last:border-0">
                              <Checkbox id={`staff-${staff.id}`} />
                              <Label htmlFor={`staff-${staff.id}`} className="flex-1 cursor-pointer">
                                {staff.name} <span className="text-gray-500 text-sm">({staff.role})</span>
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
                          ))
                        ) : (
                          clientsList.map(client => (
                            <div key={client.id} className="flex items-center space-x-2 py-2 border-b last:border-0">
                              <Checkbox id={`client-${client.id}`} />
                              <Label htmlFor={`client-${client.id}`} className="flex-1 cursor-pointer">
                                {client.name} <span className="text-gray-500 text-sm">({client.service})</span>
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
                          ))
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="bulk-time">Default Time</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="bulk-time-in"
                            type="time"
                            placeholder="Check-in"
                          />
                          <Input
                            id="bulk-time-out"
                            type="time"
                            placeholder="Check-out"
                          />
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
                  className="h-24"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
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
