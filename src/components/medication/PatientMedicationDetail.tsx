
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, Pill, FileText, MoreHorizontal, AlertCircle, CheckCircle, AlertTriangle, ExternalLink, User, UserCheck, CalendarDays, Download } from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import MedChartData from "./MedChartData";
import { useMedicationsByClient, useUpdateMedication } from "@/hooks/useMedications";
import { useMARByClient, useRecordMedicationAdministration, useRealTimeMedicationUpdates, MedicationAdministrationRecord } from "@/hooks/useMedicationAdministration";
import { useMedicationNavigation } from "@/hooks/useMedicationNavigation";
import { useClientProfile } from "@/hooks/useClientData";
import { useBranchDashboardNavigation } from "@/hooks/useBranchDashboardNavigation";
import { generateMedicationReportPDF } from "@/utils/medicationReportGenerator";

interface PatientMedicationDetailProps {
  patientId: string;
}

const PatientMedicationDetail: React.FC<PatientMedicationDetailProps> = ({ patientId }) => {
  const [activeTab, setActiveTab] = useState("medications");
  
  // Use real data hooks with enhanced functionality
  const { data: medications = [], isLoading: medicationsLoading } = useMedicationsByClient(patientId);
  const { data: marRecords = [], isLoading: marLoading } = useMARByClient(patientId, {
    start: subDays(new Date(), 6).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const recordAdministration = useRecordMedicationAdministration();
  const updateMedication = useUpdateMedication();
  const navigation = useMedicationNavigation();
  
  // Client profile and branch data for report generation
  const { data: clientProfile } = useClientProfile(patientId);
  const { branchName } = useBranchDashboardNavigation();
  
  // Set up real-time updates
  useRealTimeMedicationUpdates();
  
  const handleActionClick = (action: string, medicationId: string, medication?: any) => {
    switch (action) {
      case "Record":
        recordAdministration.mutate({
          medication_id: medicationId,
          administered_at: new Date().toISOString(),
          status: "given",
          notes: ""
        });
        break;
      case "View":
        if (medication?.client_care_plans?.id) {
          navigation.navigateToCarePlan(medication.client_care_plans.id);
        }
        break;
      case "EditCarePlan":
        if (medication?.client_care_plans?.id) {
          navigation.navigateToCarePlan(medication.client_care_plans.id);
        }
        break;
      case "ViewBookings":
        navigation.navigateToBookings(patientId);
        break;
      case "ViewStaff":
        if (medication?.administered_by_staff?.id) {
          navigation.navigateToStaffProfile(medication.administered_by_staff.id);
        }
        break;
      case "Discontinue":
        updateMedication.mutate(
          { id: medicationId, status: "discontinued" },
          {
            onSuccess: () => {
              toast.success("Medication discontinued successfully");
            },
            onError: () => {
              toast.error("Failed to discontinue medication");
            }
          }
        );
        break;
      case "Reactivate":
        updateMedication.mutate(
          { id: medicationId, status: "active" },
          {
            onSuccess: () => {
              toast.success("Medication reactivated successfully");
            },
            onError: () => {
              toast.error("Failed to reactivate medication");
            }
          }
        );
        break;
      case "History":
        setActiveTab("records");
        toast.info("Showing administration history");
        break;
      default:
        toast.success(`${action} action for medication`, {
          description: "This feature will be implemented soon",
        });
    }
  };
  
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-800/40">Active</Badge>;
      case "discontinued":
        return <Badge className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-800/40">Discontinued</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700 hover:bg-yellow-200 dark:hover:bg-yellow-800/40">Pending</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground">{status}</Badge>;
    }
  };
  
  const renderMarStatus = (status: string) => {
    switch (status) {
      case "given":
        return <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" /></div>;
      case "refused":
        return <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"><AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" /></div>;
      case "not_applicable":
        return <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center"><MoreHorizontal className="w-4 h-4 text-muted-foreground" /></div>;
      default:
        return <div className="w-6 h-6 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" /></div>;
    }
  };

  const formatUserRole = (role: string) => {
    const roleMap: Record<string, string> = {
      'super_admin': 'Super Admin',
      'branch_admin': 'Branch Admin',
      'carer': 'Carer',
      'client': 'Client'
    };
    return roleMap[role] || role;
  };

  // Helper function to get display name with fallbacks
  const getCreatorDisplayName = (profile: { first_name: string | null; last_name: string | null; email?: string | null } | null | undefined) => {
    if (!profile) return null;
    
    const firstName = profile.first_name?.trim();
    const lastName = profile.last_name?.trim();
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    } else if (profile.email) {
      // Use email username as fallback
      return profile.email.split('@')[0];
    }
    return null;
  };

  // Generate medication report PDF directly
  const handleGenerateMedicationReport = () => {
    if (!clientProfile) {
      toast.error("Client information not available. Please try again.");
      return;
    }
    
    const clientName = `${clientProfile.first_name || ''} ${clientProfile.last_name || ''}`.trim() || 'Unknown Client';
    
    const reportData = {
      clientName,
      clientEmail: clientProfile.email,
      clientPhone: clientProfile.phone,
      clientDateOfBirth: clientProfile.date_of_birth,
      clientGender: clientProfile.gender,
      clientAddress: clientProfile.address,
      branchName: branchName || undefined,
      medications: medications.map(med => ({
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        start_date: med.start_date,
        end_date: med.end_date,
        status: med.status,
        notes: med.notes,
        givenBy: getCreatorDisplayName(med.created_by_profile),
        givenByRole: med.created_by_role?.role ? formatUserRole(med.created_by_role.role) : undefined,
      })),
    };
    
    try {
      generateMedicationReportPDF(reportData);
      toast.success("Medication report downloaded successfully");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report. Please try again.");
    }
  };

  if (medicationsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Pill className="h-12 w-12 mx-auto text-gray-400 mb-3 animate-pulse" />
          <h3 className="text-lg font-medium text-gray-900">Loading medications...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => navigation.navigateToBookings(patientId)}>
              <CalendarDays className="h-4 w-4 mr-2" />
              View Appointments
            </Button>
            <Button variant="outline" onClick={() => navigation.navigateToClientProfile(patientId)}>
              <User className="h-4 w-4 mr-2" />
              Client Profile
            </Button>
            <Button variant="outline" onClick={handleGenerateMedicationReport}>
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="medications" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 bg-card border border-border rounded-xl shadow-sm p-1">
          <TabsTrigger value="medications" className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-800 dark:data-[state=active]:text-blue-300 rounded-lg px-4 py-2">
            Medications
          </TabsTrigger>
          <TabsTrigger value="mar" className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-800 dark:data-[state=active]:text-blue-300 rounded-lg px-4 py-2">
            MAR Chart
          </TabsTrigger>
          <TabsTrigger value="records" className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-800 dark:data-[state=active]:text-blue-300 rounded-lg px-4 py-2">
            Records
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="medications" className="mt-0">
          <div className="bg-card rounded-xl overflow-hidden border border-border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Medication</TableHead>
                  <TableHead>Dosage</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Given By</TableHead>
                  <TableHead>Care Plan</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medications.map((medication) => (
                  <TableRow key={medication.id}>
                    <TableCell className="font-medium">{medication.id.slice(-4)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{medication.name}</div>
                      <div className="text-xs text-gray-500">ID: {medication.id.slice(-8)}</div>
                    </TableCell>
                    <TableCell>{medication.dosage}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center text-sm">
                          <Calendar className="h-3.5 w-3.5 mr-1 text-gray-500" />
                          <span>{medication.frequency}</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <span>{format(new Date(medication.start_date), "MMM d, yyyy")}</span>
                          {medication.end_date && (
                            <span> - {format(new Date(medication.end_date), "MMM d, yyyy")}</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{renderStatusBadge(medication.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">
                            {getCreatorDisplayName(medication.created_by_profile) || 
                              (medication.created_by ? 'Unknown User' : '—')
                            }
                          </div>
                          {medication.created_by_role?.role && (
                            <div className="text-xs text-muted-foreground">
                              ({formatUserRole(medication.created_by_role.role)})
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-0 h-auto font-normal text-blue-600 hover:text-blue-800"
                        onClick={() => handleActionClick("View", medication.id, medication)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        {medication.client_care_plans?.title || 'View Plan'}
                      </Button>
                    </TableCell>
                     <TableCell className="text-right">
                       <div className="flex items-center gap-2 justify-end">
                         {/* Check if this medication is already in today's visits */}
                         {(() => {
                           const today = new Date().toISOString().split('T')[0];
                           const todayRecord = marRecords.find(record => 
                             record.medication_id === medication.id &&
                             format(new Date(record.administered_at), 'yyyy-MM-dd') === today
                           );
                           
                           if (todayRecord) {
                             return (
                               <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                                 <CheckCircle className="h-3 w-3 mr-1" />
                                 In today's visit
                               </Badge>
                             );
                           }
                           return null;
                         })()}
                         
                         <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                             <Button variant="ghost" size="icon" className="h-8 w-8">
                               <MoreHorizontal className="h-4 w-4" />
                             </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end">
                             <DropdownMenuLabel>Actions</DropdownMenuLabel>
                             <DropdownMenuSeparator />
                             <DropdownMenuItem onClick={() => handleActionClick("Record", medication.id)}>
                               <CheckCircle className="h-4 w-4 mr-2" />
                               Record Administration
                             </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleActionClick("View", medication.id, medication)}>
                               <ExternalLink className="h-4 w-4 mr-2" />
                               View Care Plan
                             </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleActionClick("History", medication.id)}>
                               <FileText className="h-4 w-4 mr-2" />
                               View History
                             </DropdownMenuItem>
                             <DropdownMenuSeparator />
                             {medication.status === "active" ? (
                               <DropdownMenuItem onClick={() => handleActionClick("Discontinue", medication.id)} className="text-red-600">
                                 Discontinue
                               </DropdownMenuItem>
                             ) : (
                               <DropdownMenuItem onClick={() => handleActionClick("Reactivate", medication.id)} className="text-green-600">
                                 Reactivate
                               </DropdownMenuItem>
                             )}
                           </DropdownMenuContent>
                         </DropdownMenu>
                       </div>
                     </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {medications.length === 0 && (
              <div className="py-8 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <Pill className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No medications found</h3>
                <p className="text-gray-500 max-w-md mx-auto mt-2">
                  This patient doesn't have any medications recorded yet.
                </p>
                <div className="mt-4 space-x-2">
                  <Button variant="outline" onClick={() => navigation.navigateToCarePlan('')}>
                    Create Care Plan
                  </Button>
                  <Button variant="outline" onClick={() => navigation.navigateToBookings(patientId)}>
                    Schedule Appointment
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="mar" className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Medication Administration Record</CardTitle>
                  <CardDescription>Last 7 days</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Print MAR Chart
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <MedChartData patientId={patientId} viewType="patient" />
              
              {marLoading ? (
                <div className="py-8 text-center">
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3 animate-pulse" />
                    <h3 className="text-lg font-medium text-gray-900">Loading MAR records...</h3>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto mt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[180px]">Medication</TableHead>
                        {Array.from({ length: 7 }, (_, i) => {
                          const date = subDays(new Date(), 6 - i);
                          return (
                            <TableHead key={i} className="text-center min-w-[100px]">
                              {format(date, "E")}
                              <div className="text-xs font-normal text-gray-500">
                                {format(date, "MMM d")}
                              </div>
                            </TableHead>
                          );
                        })}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {medications.map((medication) => {
                        const medicationRecords = marRecords.filter(record => 
                          record.medication_id === medication.id
                        );
                        
                        return (
                          <TableRow key={medication.id}>
                            <TableCell>
                              <div className="font-medium">{medication.name}</div>
                              <div className="text-xs text-gray-500">{medication.dosage}</div>
                            </TableCell>
                            {Array.from({ length: 7 }, (_, i) => {
                              const date = subDays(new Date(), 6 - i);
                              const dayRecord = medicationRecords.find(record => 
                                format(new Date(record.administered_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                              );
                              
                              return (
                                <TableCell key={i} className="text-center">
                                  <div className="flex flex-col items-center justify-center">
                                    {dayRecord ? renderMarStatus(dayRecord.status) : renderMarStatus('not_given')}
                                    {dayRecord?.status === 'given' && (
                                      <div className="mt-1 text-xs text-gray-500">
                                        {format(new Date(dayRecord.administered_at), 'HH:mm')}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              <div className="mt-6 flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-sm">Given</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="w-3 h-3 text-red-600" />
                  </div>
                  <span className="text-sm">Refused</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-yellow-100 flex items-center justify-center">
                    <AlertTriangle className="w-3 h-3 text-yellow-600" />
                  </div>
                  <span className="text-sm">Not Given</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                    <MoreHorizontal className="w-3 h-3 text-gray-600" />
                  </div>
                  <span className="text-sm">Not Applicable</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="records" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Medication Administration Records</CardTitle>
              <CardDescription>Historical records of medication administration</CardDescription>
            </CardHeader>
            <CardContent>
              {marRecords.length === 0 ? (
                <div className="text-center py-10">
                  <Pill className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <h3 className="text-lg font-medium text-gray-900">No Records Available</h3>
                  <p className="text-gray-500 max-w-md mx-auto mt-2">
                    There are no medication administration records available at this time. Records will appear here once medications have been administered.
                  </p>
                  <Button variant="outline" className="mt-4" onClick={() => setActiveTab("medications")}>
                    Record Administration
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Medication</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Administered By</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {marRecords.slice(0, 10).map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="font-medium">{record.client_medications?.name}</div>
                          <div className="text-xs text-gray-500">{record.client_medications?.dosage}</div>
                        </TableCell>
                        <TableCell>{renderStatusBadge(record.status)}</TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {record.administered_by_profile?.first_name || record.administered_by_profile?.last_name
                              ? `${record.administered_by_profile.first_name || ''} ${record.administered_by_profile.last_name || ''}`.trim()
                              : record.administered_by?.includes('@') 
                                ? record.administered_by.split('@')[0] 
                                : record.administered_by || 'Unknown'
                            }
                          </div>
                          {record.administered_by_role && (
                            <div className="text-xs text-muted-foreground">
                              {record.administered_by_role.split('_').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                              ).join(' ')}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{format(new Date(record.administered_at), 'MMM d, yyyy HH:mm')}</TableCell>
                        <TableCell>{record.notes || '-'}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientMedicationDetail;
