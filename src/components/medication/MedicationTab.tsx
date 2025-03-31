import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddMedicationDialog } from "./AddMedicationDialog";
import { PatientMedicationDetail } from "./PatientMedicationDetail";
import { MedChartData } from "./MedChartData";

export interface MedicationTabProps {
  branchId?: string;
  branchName?: string;
}

export const MedicationTab: React.FC<MedicationTabProps> = ({ branchId, branchName }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [addMedicationDialogOpen, setAddMedicationDialogOpen] = useState(false);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<null | string>(null);
  const [administrationDate, setAdministrationDate] = useState<string>(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [administrationNotes, setAdministrationNotes] = useState<string>("");
  const { toast } = useToast();
  const itemsPerPage = 5;

  const filteredMedications = mockMedications.filter(med => {
    const matchesSearch = 
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.patientId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || med.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  const totalPages = Math.ceil(filteredMedications.length / itemsPerPage);
  const paginatedMedications = filteredMedications.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Active":
        return "text-green-600 bg-green-50 border-green-200";
      case "Completed":
        return "text-purple-600 bg-purple-50 border-purple-200";
      case "On Hold":
        return "text-amber-600 bg-amber-50 border-amber-200";
      case "Discontinued":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getAdminStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Administered":
        return "text-green-600 bg-green-50 border-green-200";
      case "Due Soon":
        return "text-amber-600 bg-amber-50 border-amber-200";
      case "Scheduled":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "Missed":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const handleRecordAdministration = (medicationId: string) => {
    setSelectedMedication(medicationId);
    setRecordDialogOpen(true);
  };

  const handleSubmitAdministration = () => {
    console.log("Recording administration for:", selectedMedication);
    console.log("Date/Time:", administrationDate);
    console.log("Notes:", administrationNotes);
    
    toast({
      title: "Administration Recorded",
      description: "The medication administration has been successfully recorded.",
    });
    
    setRecordDialogOpen(false);
    setSelectedMedication(null);
    setAdministrationNotes("");
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-4">Medication Management</h2>
      <p className="text-gray-500 mb-6">Track and manage medications for clients.</p>
      
      <Tabs defaultValue="medications" className="w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <TabsList className="grid grid-cols-3 w-full md:w-auto">
            <TabsTrigger value="medications" className="flex items-center">
              <Pill className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Medications</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Schedule</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center">
              <Clock4 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search medications..."
                className="pl-10 pr-4 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <AddMedicationDialog 
              open={addMedicationDialogOpen} 
              onOpenChange={setAddMedicationDialogOpen} 
            />
            
            <Button onClick={() => setAddMedicationDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Medication
            </Button>
          </div>
        </div>
        
        <TabsContent value="medications" className="space-y-4">
          <div className="flex mb-4 items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Discontinued">Discontinued</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead className="w-[200px]">Medication</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead className="hidden md:table-cell">Prescribed By</TableHead>
                  <TableHead className="hidden md:table-cell">Dosage & Frequency</TableHead>
                  <TableHead className="hidden md:table-cell">Start Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next Due</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMedications.length > 0 ? (
                  paginatedMedications.map((medication) => (
                    <TableRow key={medication.id}>
                      <TableCell className="font-medium">{medication.id}</TableCell>
                      <TableCell className="font-medium">{medication.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {medication.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">{medication.patientName}</div>
                            <div className="text-xs text-gray-500">{medication.patientId}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {medication.prescribedBy}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="font-medium text-sm">{medication.dosage}</div>
                        <div className="text-xs text-gray-500">{medication.frequency}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {format(medication.startDate, 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={getStatusBadgeClass(medication.status)}
                        >
                          {medication.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {medication.nextDue ? (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-blue-500" />
                            <span className="text-sm">{format(medication.nextDue, 'MMM dd, HH:mm')}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => handleRecordAdministration(medication.id)}
                                  disabled={medication.status !== "Active"}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Record Administration</p>
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
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {medication.status === "Active" && (
                                <DropdownMenuItem>
                                  <AlertCircle className="mr-2 h-4 w-4" /> Put On Hold
                                </DropdownMenuItem>
                              )}
                              {medication.status === "On Hold" && (
                                <DropdownMenuItem>
                                  <RefreshCw className="mr-2 h-4 w-4" /> Resume
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="text-red-600 focus:text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      No medications found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {filteredMedications.length > 0 && (
            <div className="flex items-center justify-between px-2">
              <div className="text-sm text-gray-500">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredMedications.length)} of {filteredMedications.length} medications
              </div>
              
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                      className={cn(currentPage === 1 && "pointer-events-none opacity-50")}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        onClick={() => setCurrentPage(i + 1)}
                        isActive={currentPage === i + 1}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                      className={cn(currentPage === totalPages && "pointer-events-none opacity-50")}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="schedule" className="space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Upcoming Administrations</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                View Calendar
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Medication</TableHead>
                  <TableHead>Dosage</TableHead>
                  <TableHead>Scheduled Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingAdministrations.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{admin.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {admin.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{admin.patientName}</div>
                          <div className="text-xs text-gray-500">{admin.patientId}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{admin.medicationName}</TableCell>
                    <TableCell>{admin.dosage}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span>{format(admin.scheduledTime, 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{format(admin.scheduledTime, 'HH:mm')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={getAdminStatusBadgeClass(admin.status)}
                      >
                        {admin.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => handleRecordAdministration(admin.medicationId)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Record Administration</p>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Today's Overview</CardTitle>
                <CardDescription>Medication administration for today</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">Administered</div>
                      <div className="text-sm text-gray-500">Completed today</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">8</div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <div className="font-medium">Due Soon</div>
                      <div className="text-sm text-gray-500">Due in next 2 hours</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">3</div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">Scheduled</div>
                      <div className="text-sm text-gray-500">Later today</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">5</div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <div className="font-medium">Missed</div>
                      <div className="text-sm text-gray-500">Not administered</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">1</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Upcoming This Week</CardTitle>
                <CardDescription>Medication schedule summary</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="font-medium">{day}</div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-green-100 text-green-600 hover:bg-green-200">
                          {10 + index} AM
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-600 hover:bg-blue-200">
                          {4 + Math.floor(index/2)} PM
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Medication Compliance</CardTitle>
                <CardDescription>Last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center my-2">
                  <div className="h-24 w-24 rounded-full border-8 border-green-500 flex items-center justify-center">
                    <span className="text-2xl font-bold">94%</span>
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Administered on time</span>
                    <span className="font-medium">94%</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Administered late</span>
                    <span className="font-medium">4%</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Missed</span>
                    <span className="font-medium">2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Recent Administrations</h3>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export History
            </Button>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Medication</TableHead>
                  <TableHead>Administered</TableHead>
                  <TableHead className="hidden md:table-cell">Administered By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAdministrations.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{admin.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {admin.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{admin.patientName}</div>
                          <div className="text-xs text-gray-500">{admin.patientId}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{admin.medicationName}</div>
                      <div className="text-xs text-gray-500">{admin.dosage}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span>{format(admin.administeredTime, 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{format(admin.administeredTime, 'HH:mm')}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{admin.administeredBy}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className="text-green-600 bg-green-50 border-green-200"
                      >
                        {admin.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                      {admin.notes}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
      
      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Medication Administration</DialogTitle>
            <DialogDescription>
              Record when a medication was administered to a patient.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedMedication && (
              <div className="flex items-center gap-3 p-3 rounded-md bg-blue-50 border border-blue-100">
                <Pill className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium">
                    {mockMedications.find(m => m.id === selectedMedication)?.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {mockMedications.find(m => m.id === selectedMedication)?.dosage} - 
                    {mockMedications.find(m => m.id === selectedMedication)?.patientName}
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="admin-date" className="text-right text-sm font-medium">
                Date & Time
              </label>
              <div className="col-span-3">
                <Input
                  id="admin-date"
                  type="datetime-local"
                  value={administrationDate}
                  onChange={(e) => setAdministrationDate(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <label htmlFor="admin-notes" className="text-right text-sm font-medium">
                Notes
              </label>
              <div className="col-span-3">
                <textarea
                  id="admin-notes"
                  rows={3}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm"
                  placeholder="Add any relevant notes about the administration"
                  value={administrationNotes}
                  onChange={(e) => setAdministrationNotes(e.target.value)}
                ></textarea>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={handleSubmitAdministration}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Record Administration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
