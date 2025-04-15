
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Download, FileDown, Filter, RefreshCw, Search } from "lucide-react";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

interface AttendanceListProps {
  branchId: string;
}

interface AttendanceRecord {
  id: string;
  name: string;
  role: string;
  date: string;
  status: string;
  checkIn: string;
  checkOut: string;
  hours: number;
  notes?: string;
}

// Mock data for attendance records
const mockAttendanceData: AttendanceRecord[] = [
  {
    id: "1",
    name: "Jane Smith",
    role: "Nurse",
    date: "2025-04-01",
    status: "present",
    checkIn: "08:00",
    checkOut: "17:00",
    hours: 8,
    notes: "Regular shift"
  },
  {
    id: "2",
    name: "John Doe",
    role: "Caregiver",
    date: "2025-04-01",
    status: "late",
    checkIn: "09:15",
    checkOut: "17:30",
    hours: 8.25,
    notes: "Traffic delay"
  },
  {
    id: "3",
    name: "Emily Johnson",
    role: "Administrator",
    date: "2025-04-01",
    status: "present",
    checkIn: "08:30",
    checkOut: "16:30",
    hours: 8,
  },
  {
    id: "4",
    name: "Michael Brown",
    role: "Physiotherapist",
    date: "2025-04-01",
    status: "half_day",
    checkIn: "08:00",
    checkOut: "12:00",
    hours: 4,
    notes: "Doctor appointment in afternoon"
  },
  {
    id: "5",
    name: "Sarah Lee",
    role: "Nurse",
    date: "2025-04-01",
    status: "absent",
    checkIn: "",
    checkOut: "",
    hours: 0,
    notes: "Sick leave"
  },
  {
    id: "6",
    name: "Jane Smith",
    role: "Nurse",
    date: "2025-04-02",
    status: "present",
    checkIn: "08:05",
    checkOut: "17:10",
    hours: 9.08,
  },
  {
    id: "7",
    name: "John Doe",
    role: "Caregiver",
    date: "2025-04-02",
    status: "present",
    checkIn: "08:00",
    checkOut: "17:00",
    hours: 8,
  },
  {
    id: "8",
    name: "Emily Johnson",
    role: "Administrator",
    date: "2025-04-02",
    status: "excused",
    checkIn: "",
    checkOut: "",
    hours: 0,
    notes: "Pre-approved leave"
  },
];

export function AttendanceList({ branchId }: AttendanceListProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [status, setStatus] = useState("all");
  const [attendanceType, setAttendanceType] = useState("staff");

  // Filter attendance records based on search query, type, and status
  const filteredRecords = mockAttendanceData.filter(record => {
    // Filter by date range
    const recordDate = parseISO(record.date);
    const isInDateRange = dateRange.from <= recordDate && recordDate <= dateRange.to;
    
    // Filter by search query
    const matchesSearch = record.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          record.role.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by status
    const matchesStatus = status === "all" || record.status === status;
    
    return isInDateRange && matchesSearch && matchesStatus;
  });

  // Render status badge with appropriate color
  const renderStatusBadge = (status: string) => {
    switch(status) {
      case "present":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Present</Badge>;
      case "absent":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Absent</Badge>;
      case "late":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Late</Badge>;
      case "excused":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Excused</Badge>;
      case "half_day":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Half Day</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h3 className="text-lg font-semibold">Attendance Records</h3>
              
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="h-9">
                  <Filter className="h-4 w-4 mr-1" />
                  Advanced Filter
                </Button>
                <Button variant="outline" size="sm" className="h-9">
                  <FileDown className="h-4 w-4 mr-1" />
                  Export
                </Button>
                <Button variant="outline" size="sm" className="h-9">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or role..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div>
                <Select value={attendanceType} onValueChange={setAttendanceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff Attendance</SelectItem>
                    <SelectItem value="client">Client Attendance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="excused">Excused</SelectItem>
                    <SelectItem value="half_day">Half Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label className="mb-2 block">Date Range</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? format(dateRange.from, "PPP") : <span>From date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => date && setDateRange({...dateRange, from: date})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !dateRange.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.to ? format(dateRange.to, "PPP") : <span>To date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => date && setDateRange({...dateRange, to: date})}
                      initialFocus
                      fromDate={dateRange.from}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          
          <div className="border rounded-md">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.name}</TableCell>
                        <TableCell>{record.role}</TableCell>
                        <TableCell>{format(parseISO(record.date), "dd MMM yyyy")}</TableCell>
                        <TableCell>{renderStatusBadge(record.status)}</TableCell>
                        <TableCell>{record.checkIn || "-"}</TableCell>
                        <TableCell>{record.checkOut || "-"}</TableCell>
                        <TableCell>{record.hours > 0 ? record.hours : "-"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{record.notes || "-"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        No attendance records found for the selected criteria
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-gray-500">
                Showing {filteredRecords.length} of {mockAttendanceData.length} records
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" disabled>Previous</Button>
                <Button variant="outline" size="sm" disabled>Next</Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
