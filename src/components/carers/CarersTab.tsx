import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  SearchIcon, Filter, UserCheck, Download, RefreshCw, 
  Edit, EyeIcon, HelpCircle, CheckCircle, 
  ChevronLeft, ChevronRight, Trash2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CarerFilters } from "./CarerFilters";
import { AddCarerDialog } from "./AddCarerDialog";
import { EditCarerDialog } from "./EditCarerDialog";
import RecruitmentSection from "./RecruitmentSection";
import { useToast } from "@/hooks/use-toast";
import { useBranchCarers, useDeleteCarer, CarerDB } from "@/data/hooks/useBranchCarers";

export interface CarersTabProps {
  branchId?: string;
  branchName?: string;
}

export const CarersTab = ({ branchId, branchName }: CarersTabProps) => {
  const { id, branchName: paramBranchName } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [specializationFilter, setSpecializationFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeView, setActiveView] = useState("carers");
  const itemsPerPage = 5;

  // Use the actual branch ID from params or props
  const currentBranchId = branchId || id;
  
  // Fetch carers data from Supabase
  const { data: carers = [], isLoading, error, refetch } = useBranchCarers(currentBranchId);
  const deleteCarerMutation = useDeleteCarer();

  console.log('[CarersTab] Branch ID:', currentBranchId);
  console.log('[CarersTab] Carers data:', carers);

  useEffect(() => {
    if (error) {
      console.error('[CarersTab] Error loading carers:', error);
      toast({
        title: "Error loading carers",
        description: "Failed to load carers data. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const filteredCarers = carers.filter((carer: CarerDB) => {
    const fullName = `${carer.first_name} ${carer.last_name}`.toLowerCase();
    const matchesSearch = 
      fullName.includes(searchValue.toLowerCase()) ||
      (carer.email && carer.email.toLowerCase().includes(searchValue.toLowerCase())) ||
      carer.id.toLowerCase().includes(searchValue.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || carer.status === statusFilter;
    const matchesSpecialization = specializationFilter === "all" || carer.specialization === specializationFilter;
    const matchesAvailability = availabilityFilter === "all" || carer.availability === availabilityFilter;
    
    return matchesSearch && matchesStatus && matchesSpecialization && matchesAvailability;
  });

  const totalPages = Math.ceil(filteredCarers.length / itemsPerPage);
  const paginatedCarers = filteredCarers.slice(
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

  const handleViewCarer = (carerId: string) => {
    // Fixed navigation URL to include /carers/ segment
    navigate(`/branch-dashboard/${id}/${branchName}/carers/${carerId}`);
  };

  const handleDeleteCarer = async (carerId: string, carerName: string) => {
    if (window.confirm(`Are you sure you want to delete ${carerName}? This action cannot be undone.`)) {
      try {
        await deleteCarerMutation.mutateAsync(carerId);
      } catch (error) {
        console.error('[CarersTab] Delete error:', error);
      }
    }
  };

  const handleRefresh = () => {
    console.log('[CarersTab] Refreshing carers data');
    refetch();
  };

  const getAvatarInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, specializationFilter, availabilityFilter, searchValue]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading carers...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Carers</h2>
            <p className="text-gray-500 text-sm mt-1">
              Manage carers and care staff, view their details, and track assignments
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <AddCarerDialog branchId={currentBranchId} />
          </div>
        </div>
        
        <Tabs defaultValue="carers" value={activeView} onValueChange={setActiveView}>
          <TabsList className="mb-4">
            <TabsTrigger value="carers">Active Carers ({carers.length})</TabsTrigger>
            <TabsTrigger value="recruitment">Recruitment</TabsTrigger>
          </TabsList>
          
          <TabsContent value="carers" className="mt-0">
            <CarerFilters 
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              specializationFilter={specializationFilter}
              setSpecializationFilter={setSpecializationFilter}
              availabilityFilter={availabilityFilter}
              setAvailabilityFilter={setAvailabilityFilter}
            />
          </TabsContent>
          
          <TabsContent value="recruitment" className="mt-0">
            {/* Recruitment section is empty - RecruitmentSection component handles its own filtering */}
          </TabsContent>
        </Tabs>
      </div>
      
      {activeView === "carers" ? (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-white hover:bg-gray-50/90">
                  <TableHead className="text-gray-600 font-medium w-[100px]">Carer ID</TableHead>
                  <TableHead className="text-gray-600 font-medium">Carer Name</TableHead>
                  <TableHead className="text-gray-600 font-medium">Email Address</TableHead>
                  <TableHead className="text-gray-600 font-medium">Specialization</TableHead>
                  <TableHead className="text-gray-600 font-medium">Experience</TableHead>
                  <TableHead className="text-gray-600 font-medium">Availability</TableHead>
                  <TableHead className="text-gray-600 font-medium">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCarers.length > 0 ? (
                  paginatedCarers.map((carer) => (
                    <TableRow key={carer.id} className="hover:bg-gray-50 border-t border-gray-100">
                      <TableCell className="font-medium">{carer.id.slice(0, 8)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
                            {getAvatarInitials(carer.first_name, carer.last_name)}
                          </div>
                          <span>{carer.last_name}, {carer.first_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{carer.email || 'Not provided'}</TableCell>
                      <TableCell>{carer.specialization || 'General Care'}</TableCell>
                      <TableCell>{carer.experience || 'Not specified'}</TableCell>
                      <TableCell>{carer.availability}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`
                            ${carer.status === "Active" ? "bg-green-50 text-green-700 border-0" : ""}
                            ${carer.status === "Inactive" ? "bg-red-50 text-red-700 border-0" : ""}
                            ${carer.status === "On Leave" ? "bg-amber-50 text-amber-700 border-0" : ""}
                            ${carer.status === "Training" ? "bg-purple-50 text-purple-700 border-0" : ""}
                            px-4 py-1 rounded-full
                          `}
                        >
                          {carer.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleViewCarer(carer.id)}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          <EditCarerDialog carer={carer} />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteCarer(carer.id, `${carer.first_name} ${carer.last_name}`)}
                            disabled={deleteCarerMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                      {isLoading ? "Loading carers..." : "No carers found matching your search criteria."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {paginatedCarers.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-100">
              <div className="text-sm text-gray-500">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredCarers.length)} of {filteredCarers.length} carers
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="h-8"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="h-8"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="p-6">
          <RecruitmentSection />
        </div>
      )}
    </div>
  );
};
