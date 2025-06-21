
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
import { useBranchStaffAndClients } from "@/hooks/useBranchStaffAndClients";
import { useCreateAttendanceRecord, useBulkCreateAttendance, CreateAttendanceData } from "@/hooks/useAttendanceRecords";

interface AttendanceFormProps {
  branchId: string;
}

interface BulkAttendanceEntry {
  personId: string;
  personName: string;
  personRole: string;
  status: string;
}

export function AttendanceForm({ branchId }: AttendanceFormProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [attendanceType, setAttendanceType] = useState("staff");
  const [bulkMode, setBulkMode] = useState(false);
  const [notes, setNotes] = useState("");
  const [timeIn, setTimeIn] = useState("");
  const [timeOut, setTimeOut] = useState("");
  const [selectedPerson, setSelectedPerson] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("present");
  const [bulkEntries, setBulkEntries] = useState<BulkAttendanceEntry[]>([]);
  const [bulkTimeIn, setBulkTimeIn] = useState("");
  const [bulkTimeOut, setBulkTimeOut] = useState("");

  const { staff, clients, isLoading } = useBranchStaffAndClients(branchId);
  const createAttendance = useCreateAttendanceRecord();
  const createBulkAttendance = useBulkCreateAttendance();

  const currentList = attendanceType === "staff" ? staff : clients;

  // Helper function to get person role safely
  const getPersonRole = (person: any, type: string) => {
    if (type === "staff") {
      return person.specialization || "Staff";
    } else {
      return "Client";
    }
  };

  // Helper function to get person display text
  const getPersonDisplayText = (person: any, type: string) => {
    const role = getPersonRole(person, type);
    return `${person.first_name} ${person.last_name} - ${role}`;
  };

  const calculateHours = (checkIn: string, checkOut: string): number => {
    if (!checkIn || !checkOut) return 0;
    
    const inTime = new Date(`2000-01-01 ${checkIn}`);
    const outTime = new Date(`2000-01-01 ${checkOut}`);
    
    if (outTime <= inTime) return 0;
    
    const diffMs = outTime.getTime() - inTime.getTime();
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date) {
      toast.error("Please select a date");
      return;
    }

    const dateString = format(date, 'yyyy-MM-dd');

    if (bulkMode) {
      if (bulkEntries.length === 0) {
        toast.error("Please select at least one person for bulk entry");
        return;
      }

      const attendanceRecords: CreateAttendanceData[] = bulkEntries.map(entry => ({
        person_id: entry.personId,
        person_type: attendanceType as 'staff' | 'client',
        branch_id: branchId,
        attendance_date: dateString,
        status: entry.status as 'present' | 'absent' | 'late' | 'excused' | 'half_day',
        check_in_time: entry.status === 'present' || entry.status === 'late' ? bulkTimeIn || undefined : undefined,
        check_out_time: entry.status === 'present' || entry.status === 'late' ? bulkTimeOut || undefined : undefined,
        hours_worked: entry.status === 'present' || entry.status === 'late' 
          ? calculateHours(bulkTimeIn, bulkTimeOut) 
          : 0,
        notes: notes || undefined,
      }));

      createBulkAttendance.mutate(attendanceRecords, {
        onSuccess: () => {
          setBulkEntries([]);
          setNotes("");
          setBulkTimeIn("");
          setBulkTimeOut("");
        }
      });
    } else {
      if (!selectedPerson) {
        toast.error(`Please select a ${attendanceType === "staff" ? "staff member" : "client"}`);
        return;
      }

      const attendanceData: CreateAttendanceData = {
        person_id: selectedPerson,
        person_type: attendanceType as 'staff' | 'client',
        branch_id: branchId,
        attendance_date: dateString,
        status: selectedStatus as 'present' | 'absent' | 'late' | 'excused' | 'half_day',
        check_in_time: selectedStatus === 'present' || selectedStatus === 'late' ? timeIn || undefined : undefined,
        check_out_time: selectedStatus === 'present' || selectedStatus === 'late' ? timeOut || undefined : undefined,
        hours_worked: selectedStatus === 'present' || selectedStatus === 'late' 
          ? calculateHours(timeIn, timeOut) 
          : 0,
        notes: notes || undefined,
      };

      createAttendance.mutate(attendanceData, {
        onSuccess: () => {
          setSelectedPerson("");
          setSelectedStatus("present");
          setTimeIn("");
          setTimeOut("");
          setNotes("");
        }
      });
    }
  };

  const handleBulkPersonToggle = (person: any, checked: boolean) => {
    if (checked) {
      setBulkEntries(prev => [...prev, {
        personId: person.id,
        personName: `${person.first_name} ${person.last_name}`,
        personRole: getPersonRole(person, attendanceType),
        status: "present"
      }]);
    } else {
      setBulkEntries(prev => prev.filter(entry => entry.personId !== person.id));
    }
  };

  const handleBulkStatusChange = (personId: string, status: string) => {
    setBulkEntries(prev => prev.map(entry => 
      entry.personId === personId ? { ...entry, status } : entry
    ));
  };

  const handleSelectAll = () => {
    if (bulkEntries.length === currentList.length) {
      setBulkEntries([]);
    } else {
      setBulkEntries(currentList.map(person => ({
        personId: person.id,
        personName: `${person.first_name} ${person.last_name}`,
        personRole: getPersonRole(person, attendanceType),
        status: "present"
      })));
    }
  };

  if (isLoading) {
    return (
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
                      onValueChange={(value) => {
                        setAttendanceType(value);
                        setSelectedPerson("");
                        setBulkEntries([]);
                      }}
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
                        <Select value={selectedPerson} onValueChange={setSelectedPerson}>
                          <SelectTrigger id="person" className="mt-1">
                            <SelectValue placeholder={`Select ${attendanceType === "staff" ? "staff member" : "client"}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {currentList.map(person => (
                              <SelectItem key={person.id} value={person.id}>
                                {getPersonDisplayText(person, attendanceType)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
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
                      
                      {(selectedStatus === 'present' || selectedStatus === 'late') && (
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
                      )}
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
                          onClick={handleSelectAll}
                        >
                          {attendanceType === "staff" ? (
                            <UserPlus className="mr-1 h-3.5 w-3.5" />
                          ) : (
                            <Users className="mr-1 h-3.5 w-3.5" />
                          )}
                          <span>{bulkEntries.length === currentList.length ? "Deselect All" : "Select All"}</span>
                        </Button>
                      </div>
                      
                      <div className="max-h-64 overflow-y-auto border rounded-md p-2">
                        {currentList.map(person => {
                          const isSelected = bulkEntries.some(entry => entry.personId === person.id);
                          const entry = bulkEntries.find(entry => entry.personId === person.id);
                          
                          return (
                            <div key={person.id} className="flex items-center space-x-2 py-2 border-b last:border-0">
                              <Checkbox 
                                id={`${attendanceType}-${person.id}`}
                                checked={isSelected}
                                onCheckedChange={(checked) => handleBulkPersonToggle(person, checked === true)}
                              />
                              <Label htmlFor={`${attendanceType}-${person.id}`} className="flex-1 cursor-pointer">
                                {person.first_name} {person.last_name} <span className="text-gray-500 text-sm">({getPersonRole(person, attendanceType)})</span>
                              </Label>
                              <Select 
                                value={entry?.status || "present"}
                                onValueChange={(value) => handleBulkStatusChange(person.id, value)}
                                disabled={!isSelected}
                              >
                                <SelectTrigger className="h-8 w-28">
                                  <SelectValue placeholder="Status" />
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
                          );
                        })}
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
                              value={bulkTimeIn}
                              onChange={(e) => setBulkTimeIn(e.target.value)}
                            />
                          </div>
                          <div className="relative flex-1">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="bulk-time-out"
                              type="time"
                              placeholder="Check-out"
                              className="pl-10"
                              value={bulkTimeOut}
                              onChange={(e) => setBulkTimeOut(e.target.value)}
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
              <Button 
                type="submit" 
                disabled={createAttendance.isPending || createBulkAttendance.isPending}
              >
                {createAttendance.isPending || createBulkAttendance.isPending ? "Saving..." : "Record Attendance"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
