
import React, { useState } from "react";
import { Calendar, Check, Clock, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format, isToday } from "date-fns";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

// Mock attendance data
const mockAttendanceHistory = [
  {
    date: "2025-04-29",
    checkIn: "08:45 AM",
    checkOut: "05:15 PM",
    hours: "8.5",
    location: "Med-Infinite Office"
  },
  {
    date: "2025-04-28",
    checkIn: "08:55 AM",
    checkOut: "05:05 PM",
    hours: "8.17",
    location: "Med-Infinite Office"
  },
  {
    date: "2025-04-25",
    checkIn: "09:00 AM",
    checkOut: "04:45 PM",
    hours: "7.75",
    location: "Remote"
  },
  {
    date: "2025-04-24",
    checkIn: "08:30 AM",
    checkOut: "05:30 PM",
    hours: "9",
    location: "Med-Infinite Office"
  },
  {
    date: "2025-04-23",
    checkIn: "09:15 AM",
    checkOut: "05:00 PM",
    hours: "7.75",
    location: "Remote"
  }
];

const CarerAttendance: React.FC = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkedOut, setCheckedOut] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
  
  const handleCheckIn = () => {
    const now = new Date();
    setCheckInTime(format(now, "hh:mm a"));
    setCheckedIn(true);
  };
  
  const handleCheckOut = () => {
    const now = new Date();
    setCheckOutTime(format(now, "hh:mm a"));
    setCheckedOut(true);
  };
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Attendance</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>Today's Attendance</CardTitle>
            <CardDescription>
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(!checkedIn && !checkedOut) ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium mb-2">Start your day</h3>
                <p className="text-gray-500 mb-6">You haven't checked in yet.</p>
                <Button className="gap-2" onClick={handleCheckIn}>
                  <Clock className="h-4 w-4" />
                  <span>Check In Now</span>
                </Button>
              </div>
            ) : checkedIn && !checkedOut ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium mb-2">You're checked in</h3>
                <p className="text-gray-500 mb-2">Check-in time: <span className="font-medium">{checkInTime}</span></p>
                <div className="flex justify-center mt-6">
                  <Button className="gap-2" onClick={handleCheckOut}>
                    <Clock className="h-4 w-4" />
                    <span>Check Out</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium mb-2">Day completed</h3>
                <div className="space-y-1 mb-4">
                  <p className="text-gray-500">Check-in time: <span className="font-medium">{checkInTime}</span></p>
                  <p className="text-gray-500">Check-out time: <span className="font-medium">{checkOutTime}</span></p>
                </div>
                <div className="px-4 py-2 bg-gray-50 rounded-lg inline-block">
                  <p className="text-sm">Thanks for your work today!</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Calendar</CardTitle>
            <CardDescription>Select a date to view details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-2 border rounded-md">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md"
              />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Attendance History</CardTitle>
              <CardDescription>Your recent attendance records</CardDescription>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Filter by Date</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end">
                <CalendarComponent
                  mode="range"
                  className="rounded-md"
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockAttendanceHistory.map((record, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {format(new Date(record.date), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>{record.checkIn}</TableCell>
                  <TableCell>{record.checkOut}</TableCell>
                  <TableCell>{record.hours}</TableCell>
                  <TableCell>{record.location}</TableCell>
                  <TableCell className="text-right">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Completed
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CarerAttendance;
