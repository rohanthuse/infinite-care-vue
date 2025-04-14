
import React, { useState } from "react";
import { Calendar, Clock, Filter, Download, ChevronDown, Users, Check, X } from "lucide-react";
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock staff data
const staffMembers = [
  { id: "1", name: "John Smith", role: "Care Worker", status: "present" },
  { id: "2", name: "Emma Johnson", role: "Senior Care Worker", status: "absent" },
  { id: "3", name: "Michael Brown", role: "Care Assistant", status: "present" },
  { id: "4", name: "Sarah Wilson", role: "Nurse", status: "late" },
  { id: "5", name: "David Taylor", role: "Care Worker", status: "present" },
  { id: "6", name: "Lisa Anderson", role: "Healthcare Assistant", status: "absent" },
  { id: "7", name: "James Thomas", role: "Care Worker", status: "present" },
  { id: "8", name: "Jessica White", role: "Senior Care Worker", status: "late" }
];

type StaffAttendanceStatus = "present" | "absent" | "late" | "on-leave";

interface StaffAttendanceRecord {
  id: string;
  name: string;
  role: string;
  status: StaffAttendanceStatus;
  timeIn?: string;
  timeOut?: string;
  date: string;
  notes?: string;
}

// Mock attendance records
const generateAttendanceRecords = (date: Date): StaffAttendanceRecord[] => {
  const dateStr = format(date, "yyyy-MM-dd");
  return staffMembers.map(staff => ({
    id: staff.id,
    name: staff.name,
    role: staff.role,
    status: staff.status as StaffAttendanceStatus,
    timeIn: staff.status === "present" ? "08:00" : staff.status === "late" ? "09:15" : undefined,
    timeOut: staff.status === "present" ? "17:00" : staff.status === "late" ? "18:00" : undefined,
    date: dateStr,
    notes: staff.status === "absent" ? "Called in sick" : staff.status === "late" ? "Traffic delay" : ""
  }));
};

interface AttendanceTabProps {
  branchId: string;
  branchName: string;
}

const AttendanceTab: React.FC<AttendanceTabProps> = ({ branchId, branchName }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "monthly">("daily");
  
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const handlePrevDay = () => {
    setSelectedDate(prev => subDays(prev, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  const handlePrevWeek = () => {
    setSelectedDate(prev => subDays(prev, 7));
  };

  const handleNextWeek = () => {
    setSelectedDate(prev => addDays(prev, 7));
  };

  const getStatusColor = (status: StaffAttendanceStatus) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-700";
      case "absent":
        return "bg-red-100 text-red-700";
      case "late":
        return "bg-amber-100 text-amber-700";
      case "on-leave":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: StaffAttendanceStatus) => {
    switch (status) {
      case "present":
        return <Check className="h-4 w-4 text-green-600" />;
      case "absent":
        return <X className="h-4 w-4 text-red-600" />;
      case "late":
        return <Clock className="h-4 w-4 text-amber-600" />;
      case "on-leave":
        return <Calendar className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const attendanceRecords = generateAttendanceRecords(selectedDate);
  
  const attendanceSummary = {
    total: staffMembers.length,
    present: staffMembers.filter(s => s.status === "present").length,
    absent: staffMembers.filter(s => s.status === "absent").length,
    late: staffMembers.filter(s => s.status === "late").length,
    onLeave: 0
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Staff Attendance</h2>
          <p className="text-sm text-gray-500">Track and manage staff attendance records</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Clock className="h-4 w-4 mr-2" />
            Record Attendance
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Total Staff</span>
                <span className="text-2xl font-bold">{attendanceSummary.total}</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Present</span>
                <span className="text-2xl font-bold">{attendanceSummary.present}</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Absent</span>
                <span className="text-2xl font-bold">{attendanceSummary.absent}</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <X className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Late</span>
                <span className="text-2xl font-bold">{attendanceSummary.late}</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="daily" value={viewMode} onValueChange={(v) => setViewMode(v as "daily" | "weekly" | "monthly")}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="daily">Daily View</TabsTrigger>
            <TabsTrigger value="weekly">Weekly View</TabsTrigger>
            <TabsTrigger value="monthly">Monthly View</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={viewMode === 'daily' ? handlePrevDay : handlePrevWeek}
            >
              Previous
            </Button>
            <div className="font-medium">
              {viewMode === 'daily' ? (
                format(selectedDate, 'PPPP')
              ) : viewMode === 'weekly' ? (
                `${format(weekStart, 'PP')} - ${format(weekEnd, 'PP')}`
              ) : (
                format(selectedDate, 'MMMM yyyy')
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={viewMode === 'daily' ? handleNextDay : handleNextWeek}
            >
              Next
            </Button>
          </div>
        </div>

        <TabsContent value="daily" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Daily Attendance - {format(selectedDate, 'PP')}</CardTitle>
              <CardDescription>Staff attendance records for the day</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time In</TableHead>
                    <TableHead>Time Out</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.name}</TableCell>
                      <TableCell>{record.role}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(record.status)}
                          <Badge className={getStatusColor(record.status)}>
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{record.timeIn || "-"}</TableCell>
                      <TableCell>{record.timeOut || "-"}</TableCell>
                      <TableCell>{record.notes || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="weekly" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Weekly Attendance</CardTitle>
              <CardDescription>{format(weekStart, 'PP')} - {format(weekEnd, 'PP')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Member</TableHead>
                      <TableHead>Role</TableHead>
                      {daysInWeek.map((day) => (
                        <TableHead key={day.toString()} className="text-center">
                          {format(day, 'EEE')}<br/>
                          <span className="text-xs">{format(day, 'd')}</span>
                        </TableHead>
                      ))}
                      <TableHead>Summary</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffMembers.map((staff) => (
                      <TableRow key={staff.id}>
                        <TableCell className="font-medium">{staff.name}</TableCell>
                        <TableCell>{staff.role}</TableCell>
                        {daysInWeek.map((day) => (
                          <TableCell key={day.toString()} className="text-center">
                            {getStatusIcon(Math.random() > 0.5 ? "present" : Math.random() > 0.5 ? "absent" : "late")}
                          </TableCell>
                        ))}
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="text-green-600 font-medium">5</span>/
                            <span className="text-red-600 font-medium">1</span>/
                            <span className="text-amber-600 font-medium">1</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="text-sm text-gray-500 flex justify-between">
              <div>Legend: <span className="text-green-600">Present</span> / <span className="text-red-600">Absent</span> / <span className="text-amber-600">Late</span></div>
              <div>Total records: {staffMembers.length}</div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="monthly" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Monthly Attendance Summary</CardTitle>
              <CardDescription>{format(selectedDate, 'MMMM yyyy')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Present Days</TableHead>
                    <TableHead>Absent Days</TableHead>
                    <TableHead>Late Days</TableHead>
                    <TableHead>On Leave</TableHead>
                    <TableHead>Attendance Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffMembers.map((staff) => (
                    <TableRow key={staff.id}>
                      <TableCell className="font-medium">{staff.name}</TableCell>
                      <TableCell>{Math.floor(Math.random() * 18) + 10}</TableCell>
                      <TableCell>{Math.floor(Math.random() * 5)}</TableCell>
                      <TableCell>{Math.floor(Math.random() * 4)}</TableCell>
                      <TableCell>{Math.floor(Math.random() * 3)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-full bg-green-500 rounded-full" 
                              style={{ width: `${75 + Math.floor(Math.random() * 25)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm">{75 + Math.floor(Math.random() * 25)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { AttendanceTab };
export default AttendanceTab;
