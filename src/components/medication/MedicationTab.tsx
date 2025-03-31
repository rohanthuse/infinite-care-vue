
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import {
  Pill, Calendar, Clock, Search, Plus, Download, Filter, 
  CheckCircle, Clock4, Eye, Edit, AlertCircle, RefreshCw, Trash2, 
  MoreHorizontal, FileText, AlertTriangle
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

export interface MedicationTabProps {
  branchId: string;
  branchName: string;
}

export const MedicationTab: React.FC<MedicationTabProps> = ({ branchId, branchName }) => {
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [medicationModalOpen, setMedicationModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [administrationDate, setAdministrationDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [adminTime, setAdminTime] = useState('08:00');
  const { toast } = useToast();
  
  // Sample medication data
  const mockMedications = [
    {
      id: "MED-001",
      name: "Lisinopril",
      patient: { name: "John Smith", initials: "JS" },
      dosage: "10mg",
      frequency: "Once daily",
      startDate: "2023-04-12",
      endDate: "2023-10-12",
      status: "Active",
      nextDue: "08:00 AM",
      instructions: "Take with water in the morning",
      recentAdministrations: [
        { date: "2023-04-12", time: "08:00", status: "Administered" },
        { date: "2023-04-13", time: "08:00", status: "Administered" },
        { date: "2023-04-14", time: "08:00", status: "Administered" }
      ]
    },
    {
      id: "MED-002",
      name: "Metformin",
      patient: { name: "Emma Johnson", initials: "EJ" },
      dosage: "500mg",
      frequency: "Twice daily",
      startDate: "2023-03-28",
      endDate: "2023-09-28",
      status: "Active", 
      nextDue: "08:00 AM",
      instructions: "Take with meals",
      recentAdministrations: [
        { date: "2023-04-12", time: "08:00", status: "Administered" },
        { date: "2023-04-12", time: "20:00", status: "Administered" },
        { date: "2023-04-13", time: "08:00", status: "Administered" }
      ]
    },
    {
      id: "MED-003",
      name: "Simvastatin",
      patient: { name: "Robert Davis", initials: "RD" },
      dosage: "20mg",
      frequency: "Once daily",
      startDate: "2023-02-15",
      endDate: "2023-08-15",
      status: "Pending Review",
      nextDue: "20:00 PM",
      instructions: "Take in the evening",
      recentAdministrations: [
        { date: "2023-04-11", time: "20:00", status: "Administered" },
        { date: "2023-04-12", time: "20:00", status: "Administered" },
        { date: "2023-04-13", time: "20:00", status: "Missed" }
      ]
    },
    {
      id: "MED-004",
      name: "Levothyroxine",
      patient: { name: "Patricia Wilson", initials: "PW" },
      dosage: "75mcg",
      frequency: "Once daily",
      startDate: "2023-01-10",
      endDate: "2023-07-10",
      status: "Active",
      nextDue: "07:00 AM",
      instructions: "Take on an empty stomach",
      recentAdministrations: [
        { date: "2023-04-12", time: "07:00", status: "Administered" },
        { date: "2023-04-13", time: "07:00", status: "Administered" },
        { date: "2023-04-14", time: "07:00", status: "Administered" }
      ]
    },
    {
      id: "MED-005",
      name: "Amlodipine",
      patient: { name: "Michael Brown", initials: "MB" },
      dosage: "5mg",
      frequency: "Once daily",
      startDate: "2023-03-05",
      endDate: "2023-09-05",
      status: "Discontinued",
      nextDue: "N/A",
      instructions: "Take at the same time each day",
      recentAdministrations: [
        { date: "2023-03-30", time: "09:00", status: "Administered" },
        { date: "2023-03-31", time: "09:00", status: "Administered" },
        { date: "2023-04-01", time: "09:00", status: "Discontinued" }
      ]
    }
  ];

  // Sample upcoming administration data
  const upcomingAdministrations = [
    {
      id: "ADM-001",
      medication: "Lisinopril",
      patient: { name: "John Smith", initials: "JS" },
      dosage: "10mg",
      date: "2023-04-15",
      time: "08:00",
      status: "Scheduled"
    },
    {
      id: "ADM-002",
      medication: "Metformin",
      patient: { name: "Emma Johnson", initials: "EJ" },
      dosage: "500mg",
      date: "2023-04-15",
      time: "08:00",
      status: "Scheduled"
    },
    {
      id: "ADM-003",
      medication: "Metformin",
      patient: { name: "Emma Johnson", initials: "EJ" },
      dosage: "500mg",
      date: "2023-04-15",
      time: "20:00",
      status: "Scheduled"
    },
    {
      id: "ADM-004",
      medication: "Simvastatin",
      patient: { name: "Robert Davis", initials: "RD" },
      dosage: "20mg",
      date: "2023-04-15",
      time: "20:00",
      status: "Scheduled"
    },
    {
      id: "ADM-005",
      medication: "Levothyroxine",
      patient: { name: "Patricia Wilson", initials: "PW" },
      dosage: "75mcg",
      date: "2023-04-15",
      time: "07:00",
      status: "Scheduled"
    }
  ];

  // Sample recent administration data
  const recentAdministrations = [
    {
      id: "RADM-001",
      medication: "Lisinopril",
      patient: { name: "John Smith", initials: "JS" },
      dosage: "10mg",
      date: "2023-04-14",
      time: "08:00",
      status: "Administered",
      administeredBy: "Sarah Johnson"
    },
    {
      id: "RADM-002",
      medication: "Metformin",
      patient: { name: "Emma Johnson", initials: "EJ" },
      dosage: "500mg",
      date: "2023-04-14",
      time: "08:00",
      status: "Administered",
      administeredBy: "David Taylor"
    },
    {
      id: "RADM-003",
      medication: "Metformin",
      patient: { name: "Emma Johnson", initials: "EJ" },
      dosage: "500mg",
      date: "2023-04-13",
      time: "20:00",
      status: "Administered",
      administeredBy: "Michael Brown"
    },
    {
      id: "RADM-004",
      medication: "Simvastatin",
      patient: { name: "Robert Davis", initials: "RD" },
      dosage: "20mg",
      date: "2023-04-13",
      time: "20:00",
      status: "Administered",
      administeredBy: "Sarah Johnson"
    },
    {
      id: "RADM-005",
      medication: "Levothyroxine",
      patient: { name: "Patricia Wilson", initials: "PW" },
      dosage: "75mcg",
      date: "2023-04-14",
      time: "07:00",
      status: "Missed",
      administeredBy: "N/A"
    }
  ];

  const handleAddMedication = () => {
    setMedicationModalOpen(true);
  };

  const handleAdministerMedication = (medicationId: string) => {
    toast({
      title: "Medication Administered",
      description: `Medication ${medicationId} has been marked as administered.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Medication Management for {branchName}</h2>
        <div className="flex space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search medications..."
              className="w-64 pl-8"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
          <Button size="sm" onClick={handleAddMedication}>
            <Plus className="h-4 w-4 mr-2" />
            Add Medication
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Active Medications</CardTitle>
            <CardDescription>Currently prescribed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-full bg-blue-100">
                <Pill className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">24</div>
                <div className="text-sm text-gray-500">across 8 patients</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Today's Administrations</CardTitle>
            <CardDescription>To be given</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-full bg-green-100">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">12</div>
                <div className="text-sm text-gray-500">remaining today</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Upcoming Refills</CardTitle>
            <CardDescription>Next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-full bg-amber-100">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">5</div>
                <div className="text-sm text-gray-500">prescriptions to refill</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Medication Alerts</CardTitle>
            <CardDescription>Require attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">3</div>
                <div className="text-sm text-gray-500">missed or late</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Medication Status</CardTitle>
          <CardDescription>Current medication status for Branch ID: {branchId}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-4">
            <Badge className="px-3 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200">All (24)</Badge>
            <Badge className="px-3 py-1 bg-green-100 text-green-800 hover:bg-green-200">Active (18)</Badge>
            <Badge className="px-3 py-1 bg-amber-100 text-amber-800 hover:bg-amber-200">Pending Review (3)</Badge>
            <Badge className="px-3 py-1 bg-red-100 text-red-800 hover:bg-red-200">Discontinued (3)</Badge>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Medication Administration Chart</CardTitle>
          <CardDescription>View and manage medications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 border rounded-lg bg-gray-50 text-center">
              <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <div className="text-lg font-bold">36</div>
              <div className="text-xs text-gray-500">Administered</div>
              <div className="text-xs text-gray-500">Last 7 days</div>
            </div>
            
            <div className="p-4 border rounded-lg bg-gray-50 text-center">
              <Clock className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <div className="text-lg font-bold">12</div>
              <div className="text-xs text-gray-500">Scheduled</div>
              <div className="text-xs text-gray-500">Today</div>
            </div>
            
            <div className="p-4 border rounded-lg bg-gray-50 text-center">
              <Calendar className="h-6 w-6 text-purple-500 mx-auto mb-2" />
              <div className="text-lg font-bold">84</div>
              <div className="text-xs text-gray-500">Scheduled</div>
              <div className="text-xs text-gray-500">Next 7 days</div>
            </div>
            
            <div className="p-4 border rounded-lg bg-gray-50 text-center">
              <AlertTriangle className="h-6 w-6 text-red-500 mx-auto mb-2" />
              <div className="text-lg font-bold">3</div>
              <div className="text-xs text-gray-500">Missed</div>
              <div className="text-xs text-gray-500">Last 7 days</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Active Medications</CardTitle>
          <CardDescription>All current medications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medication</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Dosage</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next Due</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockMedications.map((med) => (
                  <TableRow key={med.id}>
                    <TableCell className="font-medium">{med.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {med.patient.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{med.patient.name}</div>
                          <div className="text-xs text-gray-500">{med.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{med.dosage}</TableCell>
                    <TableCell>{med.frequency}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-3.5 w-3.5 text-gray-500 mr-1" />
                        <span>{med.startDate}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-3.5 w-3.5 text-gray-500 mr-1" />
                        <span>{med.endDate}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        med.status === "Active" ? "bg-green-100 text-green-800" :
                        med.status === "Pending Review" ? "bg-amber-100 text-amber-800" :
                        "bg-red-100 text-red-800"
                      }>
                        {med.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-3.5 w-3.5 text-gray-500 mr-1" />
                        <span>{med.status === "Discontinued" ? "N/A" : format(new Date(), 'dd MMM hh:mm a')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => handleAdministerMedication(med.id)}
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Mark as administered</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Medication
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem>
                              <AlertCircle className="h-4 w-4 mr-2" />
                              Mark as Missed
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Set Reminder
                            </DropdownMenuItem>
                          
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Discontinue
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                
                {mockMedications.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-4 text-gray-500">
                      No medications found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-4 flex justify-end">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    className={cn(
                      currentPage === 1 ? "pointer-events-none opacity-50" : ""
                    )}
                  />
                </PaginationItem>
                
                <PaginationItem>
                  <PaginationLink href="#" isActive={currentPage === 1}>
                    1
                  </PaginationLink>
                </PaginationItem>
                
                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    className={cn(
                      currentPage === 3 ? "pointer-events-none opacity-50" : ""
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Administrations</CardTitle>
            <CardDescription>Scheduled for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end space-x-2 mb-4">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                View Schedule
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Print MAR
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medication</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Dosage</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingAdministrations.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">{admin.medication}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {admin.patient.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">{admin.patient.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{admin.dosage}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-3.5 w-3.5 text-gray-500 mr-1" />
                          <span>{format(new Date(admin.date), 'dd MMM yyyy')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Clock className="h-3.5 w-3.5 text-gray-500 mr-1" />
                          <span>{format(new Date(`2023-01-01T${admin.time}`), 'hh:mm a')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          admin.status === "Administered" ? "bg-green-100 text-green-800" :
                          admin.status === "Scheduled" ? "bg-blue-100 text-blue-800" :
                          "bg-red-100 text-red-800"
                        }>
                          {admin.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() => handleAdministerMedication(admin.id)}
                                >
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Mark as administered</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Dialog open={medicationModalOpen} onOpenChange={setMedicationModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Medication for {branchName}</DialogTitle>
            <DialogDescription>
              Add a new medication for a patient in this branch.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Pill className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium">Medication Details</h4>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label htmlFor="medicationName" className="text-sm font-medium">Medication Name</label>
                <Input id="medicationName" placeholder="Enter medication name" />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="patientName" className="text-sm font-medium">Patient</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="john">John Smith</SelectItem>
                    <SelectItem value="emma">Emma Johnson</SelectItem>
                    <SelectItem value="robert">Robert Davis</SelectItem>
                    <SelectItem value="patricia">Patricia Wilson</SelectItem>
                    <SelectItem value="michael">Michael Brown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">
              <CheckCircle className="mr-2 h-4 w-4" />
              Add Medication
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
