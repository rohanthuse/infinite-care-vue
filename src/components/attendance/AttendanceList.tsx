
import React, { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Download, FileDown, Filter, RefreshCw, Search, Clock, UserCheck, Users, X } from "lucide-react";
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval, isToday, subDays, subWeeks, subMonths } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

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
  {
    id: "9",
    name: "David Wilson",
    role: "Driver",
    date: "2025-04-03",
    status: "present",
    checkIn: "08:00",
    checkOut: "16:00",
    hours: 8,
    notes: "Transport duties"
  },
  {
    id: "10",
    name: "Sarah Lee",
    role: "Nurse",
    date: "2025-04-03",
    status: "present",
    checkIn: "09:00",
    checkOut: "17:00",
    hours: 8,
    notes: "Patient rounds"
  }
];

export function AttendanceList({ branchId }: AttendanceListProps) {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [status, setStatus] = useState("all");
  const [attendanceType, setAttendanceType] = useState("staff");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const recordsPerPage = 5;

  // Extract unique roles from data for filtering
  React.useEffect(() => {
    const uniqueRoles = Array.from(new Set(mockAttendanceData.map(record => record.role)));
    setRoles(uniqueRoles);
  }, []);

  const applyFilter = (filter: string) => {
    // Set date range based on selected filter
    const today = new Date();
    switch (filter) {
      case "today":
        setDateRange({ from: today, to: today });
        break;
      case "yesterday":
        const yesterday = subDays(today, 1);
        setDateRange({ from: yesterday, to: yesterday });
        break;
      case "this_week":
        setDateRange({ from: subDays(today, today.getDay()), to: today });
        break;
      case "last_week":
        const lastWeekStart = subDays(today, today.getDay() + 7);
        const lastWeekEnd = subDays(today, today.getDay() + 1);
        setDateRange({ from: lastWeekStart, to: lastWeekEnd });
        break;
      case "this_month":
        setDateRange({ from: startOfMonth(today), to: today });
        break;
      case "last_month":
        const lastMonth = subMonths(today, 1);
        setDateRange({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
        break;
      default:
        break;
    }
  };

  const resetFilters = () => {
    setDateRange({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    });
    setSearchQuery("");
    setStatus("all");
    setAttendanceType("staff");
    setSelectedRoles([]);
    setCurrentPage(1);
    setFilterType("all");
    toast.success("Filters reset successfully");
  };

  const handleRefresh = () => {
    // In a real application, this would fetch fresh data from the API
    toast.success("Data refreshed");
  };

  const filteredRecords = mockAttendanceData.filter(record => {
    const recordDate = parseISO(record.date);
    const isInDateRange = isWithinInterval(recordDate, { 
      start: dateRange.from, 
      end: dateRange.to 
    });
    
    const matchesSearch = record.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          record.role.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = status === "all" || record.status === status;
    
    const matchesRoles = selectedRoles.length === 0 || selectedRoles.includes(record.role);
    
    return isInDateRange && matchesSearch && matchesStatus && matchesRoles;
  });

  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

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

  const handleExport = () => {
    const csvContent = [
      ["Name", "Role", "Date", "Status", "Check In", "Check Out", "Hours", "Notes"],
      ...filteredRecords.map(record => [
        record.name,
        record.role,
        format(parseISO(record.date), "dd/MM/yyyy"),
        record.status,
        record.checkIn || "",
        record.checkOut || "",
        record.hours.toString(),
        record.notes || ""
      ])
    ].map(e => e.join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_report_${format(new Date(), "yyyyMMdd")}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Export successful");
  };

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Attendance Records</h3>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Dialog open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9">
                      <Filter className="h-4 w-4 mr-1" />
                      Advanced Filter
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Advanced Filters</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="quick-filter">Quick Date Filter</Label>
                        <Select onValueChange={applyFilter} defaultValue="none">
                          <SelectTrigger id="quick-filter">
                            <SelectValue placeholder="Select date range" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="yesterday">Yesterday</SelectItem>
                            <SelectItem value="this_week">This Week</SelectItem>
                            <SelectItem value="last_week">Last Week</SelectItem>
                            <SelectItem value="this_month">This Month</SelectItem>
                            <SelectItem value="last_month">Last Month</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="role-filter">Filter by Role</Label>
                        <div className="flex flex-wrap gap-2 border p-2 rounded-md max-h-40 overflow-y-auto">
                          {roles.map(role => (
                            <div key={role} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`role-${role}`}
                                checked={selectedRoles.includes(role)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedRoles(prev => [...prev, role]);
                                  } else {
                                    setSelectedRoles(prev => prev.filter(r => r !== role));
                                  }
                                }}
                                className="h-4 w-4"
                              />
                              <Label htmlFor={`role-${role}`} className="text-sm">{role}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setShowAdvancedFilters(false)}>
                        Close
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" size="sm" className="h-9" onClick={handleExport}>
                  <FileDown className="h-4 w-4 mr-1" />
                  Export CSV
                </Button>
                <Button variant="outline" size="sm" className="h-9" onClick={handleRefresh}>
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
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1); // Reset to first page when searching
                  }}
                />
                {searchQuery && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div>
                <Select value={attendanceType} onValueChange={(value) => {
                  setAttendanceType(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
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
                <Select 
                  value={status} 
                  onValueChange={(value) => {
                    setStatus(value);
                    setCurrentPage(1);
                  }}
                >
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
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
              <div className="w-full sm:w-auto">
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
                    <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(date) => {
                          if (date) {
                            setDateRange({...dateRange, from: date});
                            setCurrentPage(1);
                          }
                        }}
                        initialFocus
                        className="pointer-events-auto"
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
                    <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(date) => {
                          if (date) {
                            setDateRange({...dateRange, to: date});
                            setCurrentPage(1);
                          }
                        }}
                        initialFocus
                        fromDate={dateRange.from}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetFilters}
                className="flex items-center gap-1"
              >
                <X className="h-3.5 w-3.5" />
                <span>Reset Filters</span>
              </Button>
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
                    <TableHead>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Check In</span>
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Check Out</span>
                      </div>
                    </TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentRecords.length > 0 ? (
                    currentRecords.map((record) => (
                      <TableRow key={record.id} className="hover:bg-gray-50">
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
                Showing {filteredRecords.length > 0 ? indexOfFirstRecord + 1 : 0}-{Math.min(indexOfLastRecord, filteredRecords.length)} of {filteredRecords.length} records
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
