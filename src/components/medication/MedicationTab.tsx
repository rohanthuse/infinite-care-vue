import React, { useState } from "react";
import { 
  Search, Filter, Plus, Download, Pill, Clock, Calendar, ChevronLeft, ChevronRight, 
  Edit, Eye, Trash, ArrowLeft, User, FileText, ClipboardList, Stethoscope,
  Clock7, AlertCircle, CheckCircle2, ExternalLink
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { AddMedicationDialog } from "./AddMedicationDialog";
import { MedicationAdministrationDialog } from "./MedicationAdministrationDialog";
import { format } from "date-fns";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PatientMedicationDetail from "./PatientMedicationDetail";
import MedChartData from "./MedChartData";
import { usePatientsWithMedications, useMedicationStats } from "@/hooks/useMedicationPatients";
import { usePendingMedications, useRealTimeMedicationUpdates } from "@/hooks/useMedicationAdministration";
import { useMedicationNavigation } from "@/hooks/useMedicationNavigation";

interface MedicationTabProps {
  branchId: string | undefined;
  branchName: string | undefined;
}

export const MedicationTab = ({ branchId, branchName }: MedicationTabProps) => {
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [addMedicationDialogOpen, setAddMedicationDialogOpen] = useState(false);
  const [administrationDialogOpen, setAdministrationDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [selectedMedicationForAdmin, setSelectedMedicationForAdmin] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"patients" | "pending" | "mar">("patients");
  
  const itemsPerPage = 5;
  const navigation = useMedicationNavigation();

  // Use the enhanced hooks with real-time updates
  const { data: patients = [], isLoading: patientsLoading } = usePatientsWithMedications(branchId);
  const { data: medicationStats } = useMedicationStats(branchId);
  const { data: pendingMedications = [] } = usePendingMedications(branchId);
  
  // Set up real-time updates
  useRealTimeMedicationUpdates(branchId);
  
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = 
      patient.first_name.toLowerCase().includes(searchValue.toLowerCase()) || 
      patient.last_name.toLowerCase().includes(searchValue.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchValue.toLowerCase()) ||
      patient.email?.toLowerCase().includes(searchValue.toLowerCase());
    
    return matchesSearch;
  });
  
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );
  
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const handleAddMedication = () => {
    setAddMedicationDialogOpen(true);
  };
  
  const handlePatientSelect = (patientId: string) => {
    setSelectedPatient(patientId);
  };
  
  const handleBackToPatients = () => {
    setSelectedPatient(null);
  };

  const handleAdministerMedication = (medication: any) => {
    setSelectedMedicationForAdmin(medication);
    setAdministrationDialogOpen(true);
  };

  const getSelectedPatient = () => {
    return patients.find(patient => patient.id === selectedPatient);
  };

  // If a patient is selected, show their medication details
  if (selectedPatient) {
    const patient = getSelectedPatient();
    
    return (
      <>
        <div className="bg-card rounded-lg border border-border shadow-sm p-6">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={handleBackToPatients} 
              className="mb-4 hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Patients
            </Button>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl font-medium">
                  {patient?.avatar_initials || "??"}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{patient ? `${patient.first_name} ${patient.last_name}` : "Unknown Patient"}</h2>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span>ID: {patient?.id.slice(-8)}</span>
                    <span>DOB: {patient?.date_of_birth ? format(new Date(patient.date_of_birth), 'dd/MM/yyyy') : 'N/A'}</span>
                    <span>Gender: {patient?.gender || 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigation.navigateToClientProfile(selectedPatient)}>
                  <User className="h-4 w-4 mr-2" />
                  Patient Profile
                </Button>
                <Button onClick={handleAddMedication}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Medication
                </Button>
              </div>
            </div>
          </div>
          
          <PatientMedicationDetail patientId={selectedPatient} />
        </div>
        
        <AddMedicationDialog 
          open={addMedicationDialogOpen} 
          onOpenChange={setAddMedicationDialogOpen} 
        />
      </>
    );
  }
  
  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">Medication Management</h2>
        
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              className="pl-10 pr-4 w-full md:w-[260px]"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" size="icon" onClick={() => navigation.navigateToReports()}>
              <Download className="h-4 w-4" />
            </Button>
            
            <Button onClick={handleAddMedication}>
              <Plus className="mr-2 h-4 w-4" />
              Add Medication
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Medications</p>
                <h3 className="text-2xl font-bold mt-1">{medicationStats?.totalMedications || 0}</h3>
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Pill className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Due Today</p>
                <h3 className="text-2xl font-bold mt-1">{medicationStats?.dueToday || 0}</h3>
              </div>
              <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Administered Today</p>
                <h3 className="text-2xl font-bold mt-1">{medicationStats?.administeredToday || 0}</h3>
              </div>
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Missed Doses</p>
                <h3 className="text-2xl font-bold mt-1">{medicationStats?.missedDoses || 0}</h3>
              </div>
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="patients" className="mb-6">
        <TabsList className="bg-muted p-1 rounded-lg">
          <TabsTrigger 
            value="patients" 
            className="data-[state=active]:bg-green-500 data-[state=active]:text-white rounded-md px-4 py-2"
            onClick={() => setViewMode("patients")}
          >
            Patients ({patients.length})
          </TabsTrigger>
          <TabsTrigger 
            value="pending" 
            className="data-[state=active]:bg-green-500 data-[state=active]:text-white rounded-md px-4 py-2"
            onClick={() => setViewMode("pending")}
          >
            Pending ({pendingMedications.length})
          </TabsTrigger>
          <TabsTrigger 
            value="mar" 
            className="data-[state=active]:bg-green-500 data-[state=active]:text-white rounded-md px-4 py-2"
            onClick={() => setViewMode("mar")}
          >
            MAR Overview
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      {viewMode === "patients" && (
        <div className="bg-card overflow-hidden rounded-xl border border-border shadow-sm">
          {patientsLoading ? (
            <div className="py-8 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Pill className="h-6 w-6 text-muted-foreground animate-pulse" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">Loading patients...</h3>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead className="hidden md:table-cell">DOB</TableHead>
                  <TableHead className="hidden lg:table-cell">Contact</TableHead>
                  <TableHead className="text-center">Medications</TableHead>
                  <TableHead className="hidden md:table-cell">Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPatients.map((patient) => (
                  <TableRow key={patient.id} className="cursor-pointer hover:bg-muted" onClick={() => handlePatientSelect(patient.id)}>
                    <TableCell className="font-medium">{patient.id.slice(-4)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-medium">
                          {patient.avatar_initials}
                        </div>
                        <div>
                          <div className="font-medium">{patient.first_name} {patient.last_name}</div>
                          <div className="text-xs text-muted-foreground">{patient.gender}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {patient.date_of_birth ? format(new Date(patient.date_of_birth), 'dd/MM/yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="text-sm">{patient.phone || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">{patient.email || 'N/A'}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                        {patient.medication_count} medications
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {patient.last_updated}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePatientSelect(patient.id);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigation.navigateToBookings(patient.id);
                          }}
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigation.navigateToClientProfile(patient.id);
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {filteredPatients.length > 0 ? (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredPatients.length)} of {filteredPatients.length} patients
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePreviousPage} 
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleNextPage} 
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">No patients found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria or add medications to patients.</p>
            </div>
          )}
        </div>
      )}
      
      {viewMode === "pending" && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-semibold">Pending Medications</h3>
              <Button variant="outline" size="sm" onClick={() => navigation.navigateToReports()}>
                <Clock className="h-4 w-4 mr-2" />
                View All
              </Button>
            </div>
            
            <div className="bg-card overflow-hidden rounded-xl border border-border shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Medication</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingMedications.slice(0, 10).map((medication) => (
                    <TableRow key={medication.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-medium">
                            {medication.client_care_plans?.clients?.first_name?.[0]}{medication.client_care_plans?.clients?.last_name?.[0]}
                          </div>
                          <div>
                            <div className="font-medium">
                              {medication.client_care_plans?.clients?.first_name} {medication.client_care_plans?.clients?.last_name}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="p-0 h-auto text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              onClick={() => handlePatientSelect(medication.client_care_plans?.client_id || '')}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{medication.name}</div>
                        <div className="text-xs text-muted-foreground">{medication.dosage}</div>
                      </TableCell>
                      <TableCell>{medication.frequency}</TableCell>
                      <TableCell>
                        <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700">
                          Due
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => handleAdministerMedication(medication)}>
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Administer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {pendingMedications.length === 0 && (
                <div className="py-8 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-1">No pending medications</h3>
                  <p className="text-muted-foreground">All medications have been administered for today.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {viewMode === "mar" && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-semibold">MAR Statistics</h3>
              <div className="flex gap-2">
                <Select defaultValue="today">
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="this-week">This Week</SelectItem>
                    <SelectItem value="this-month">This Month</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => navigation.navigateToReports()}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6 pb-4">
                  <div className="text-center">
                    <div className="mx-auto w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2">
                      <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h4 className="text-lg font-semibold">{medicationStats?.totalMedications}</h4>
                    <p className="text-sm text-muted-foreground">Total MAR Records</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6 pb-4">
                  <div className="text-center">
                    <div className="mx-auto w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <h4 className="text-lg font-semibold">{medicationStats?.administeredToday}</h4>
                    <p className="text-sm text-muted-foreground">Administered</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6 pb-4">
                  <div className="text-center">
                    <div className="mx-auto w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-2">
                      <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h4 className="text-lg font-semibold">{medicationStats?.dueToday}</h4>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6 pb-4">
                  <div className="text-center">
                    <div className="mx-auto w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-2">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <h4 className="text-lg font-semibold">{medicationStats?.missedDoses}</h4>
                    <p className="text-sm text-muted-foreground">Missed</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <MedChartData viewType="overview" branchId={branchId} />
            
            <div className="mt-4 flex justify-end">
              <Button onClick={() => navigation.navigateToReports()}>
                View Detailed Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <AddMedicationDialog 
        open={addMedicationDialogOpen} 
        onOpenChange={setAddMedicationDialogOpen} 
      />
      
      <MedicationAdministrationDialog
        open={administrationDialogOpen}
        onOpenChange={setAdministrationDialogOpen}
        medication={selectedMedicationForAdmin}
      />
    </div>
  );
};
