
import React, { useState, useEffect } from "react";
import { getTrainingMatrix, getTrainingCategories } from "@/data/mockTrainingData";
import { Training, TrainingMatrix as TrainingMatrixType, TrainingCategory, TrainingStatus, StaffMember } from "@/types/training";
import { 
  Search, Plus, Users, CheckCircle2, Clock, XCircle, CircleDashed
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import TrainingStatusCell from "@/components/training/TrainingStatusCell";
import TrainingFilter from "@/components/training/TrainingFilter";
import TrainingSort, { SortOption } from "@/components/training/TrainingSort";
import TrainingExport from "@/components/training/TrainingExport";
import AddTrainingDialog from "@/components/training/AddTrainingDialog";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BranchInfoHeader } from "@/components/BranchInfoHeader";
import { TabNavigation } from "@/components/TabNavigation";
import { useNavigate } from "react-router-dom";

interface TrainingMatrixProps {
  branchId?: string;
  branchName?: string;
}

const TrainingMatrix: React.FC<TrainingMatrixProps> = ({ branchId, branchName }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<TrainingCategory | 'all'>('all');
  const [matrixData, setMatrixData] = useState<TrainingMatrixType>(getTrainingMatrix());
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>(matrixData.staffMembers);
  const [filteredTrainings, setFilteredTrainings] = useState<Training[]>(matrixData.trainings);
  const [addTrainingOpen, setAddTrainingOpen] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>({ field: "name", direction: "asc" });
  const categories = getTrainingCategories();
  const [activeTab, setActiveTab] = useState("training-matrix");
  
  // Advanced filter state
  const [advancedFilters, setAdvancedFilters] = useState<{
    categories: TrainingCategory[];
    statuses: TrainingStatus[];
    expiryRange: string;
  }>({
    categories: [],
    statuses: [],
    expiryRange: "all"
  });
  
  // Apply all filters and sorting to the data
  useEffect(() => {
    let staffMatches = matrixData.staffMembers.filter(staff => 
      staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    let trainingsMatches = matrixData.trainings.filter(training => 
      training.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      training.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Apply advanced category filters if any are selected
    if (advancedFilters.categories.length > 0) {
      trainingsMatches = trainingsMatches.filter(training => 
        advancedFilters.categories.includes(training.category)
      );
    } 
    // Otherwise apply the tab filter
    else if (categoryFilter !== 'all') {
      trainingsMatches = trainingsMatches.filter(training => 
        training.category === categoryFilter
      );
    }
    
    // Apply status filters if any are selected
    if (advancedFilters.statuses.length > 0) {
      // This is more complex as we need to check the status for each staff member
      // We'll keep staff members who have at least one training with the selected status
      staffMatches = staffMatches.filter(staff => {
        return trainingsMatches.some(training => {
          const cell = matrixData.data[staff.id]?.[training.id];
          return cell && advancedFilters.statuses.includes(cell.status);
        });
      });
    }
    
    // Apply expiry range filter
    if (advancedFilters.expiryRange !== "all") {
      const today = new Date();
      
      // If filtering for expired trainings
      if (advancedFilters.expiryRange === "expired") {
        staffMatches = staffMatches.filter(staff => {
          return trainingsMatches.some(training => {
            const cell = matrixData.data[staff.id]?.[training.id];
            return cell && cell.expiryDate && new Date(cell.expiryDate) < today;
          });
        });
      } 
      // If filtering for trainings expiring in X days
      else {
        const days = parseInt(advancedFilters.expiryRange.replace("days", ""));
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + days);
        
        staffMatches = staffMatches.filter(staff => {
          return trainingsMatches.some(training => {
            const cell = matrixData.data[staff.id]?.[training.id];
            if (cell && cell.expiryDate) {
              const expiryDate = new Date(cell.expiryDate);
              return expiryDate >= today && expiryDate <= futureDate;
            }
            return false;
          });
        });
      }
    }
    
    // Apply sorting
    const sortedStaff = [...staffMatches].sort((a, b) => {
      if (sortOption.field === "name") {
        return sortOption.direction === "asc" 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortOption.field === "completion") {
        const completionA = calculateCompletionPercentage(a.id);
        const completionB = calculateCompletionPercentage(b.id);
        return sortOption.direction === "asc" 
          ? completionA - completionB
          : completionB - completionA;
      }
      return 0;
    });
    
    setFilteredStaff(sortedStaff);
    setFilteredTrainings(trainingsMatches);
  }, [searchTerm, categoryFilter, matrixData, advancedFilters, sortOption]);
  
  const handleCellClick = (staffId: string, trainingId: string) => {
    toast({
      title: "Training Details",
      description: `Viewing details for ${
        matrixData.trainings.find(t => t.id === trainingId)?.title
      } for ${
        matrixData.staffMembers.find(s => s.id === staffId)?.name
      }`,
    });
  };
  
  const handleAddTraining = (trainingData: any) => {
    // Add the new training to the mock data
    const updatedTrainings = [...matrixData.trainings, trainingData];
    
    // Update the matrix data with the new training
    const updatedMatrixData = {
      ...matrixData,
      trainings: updatedTrainings,
      // Initialize the new training with "not-started" status for all staff
      data: {
        ...matrixData.data,
        ...Object.fromEntries(
          matrixData.staffMembers.map(staff => [
            staff.id,
            {
              ...matrixData.data[staff.id],
              [trainingData.id]: {
                status: "not-started" as const
              }
            }
          ])
        )
      }
    };
    
    setMatrixData(updatedMatrixData);
    
    toast({
      title: "Training Added",
      description: `${trainingData.title} has been added successfully.`,
    });
  };
  
  const handleApplyFilters = (filters: {
    categories: TrainingCategory[];
    statuses: TrainingStatus[];
    expiryRange: string;
  }) => {
    setAdvancedFilters(filters);
  };
  
  const calculateCompletionPercentage = (staffId: string): number => {
    const staffTrainings = matrixData.trainings.map(training => 
      matrixData.data[staffId]?.[training.id]?.status === 'completed' ? 1 : 0
    );
    
    const completed = staffTrainings.reduce((sum, val) => sum + val, 0);
    const total = staffTrainings.length;
    
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    if (branchId && branchName) {
      if (tab === "overview") {
        navigate(`/branch-dashboard/${branchId}/${encodeURIComponent(branchName)}`);
      } else {
        navigate(`/branch-dashboard/${branchId}/${encodeURIComponent(branchName)}/${tab}`);
      }
    } else {
      navigate(`/${tab}`);
    }
  };

  const handleNewBooking = () => {
    if (branchId && branchName) {
      navigate(`/branch-dashboard/${branchId}/${encodeURIComponent(branchName)}/bookings`);
    } else {
      navigate('/bookings');
    }
  };
  
  const trainingMatrixContent = (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">Training Matrix</h1>
        <p className="text-gray-500 mt-2">Track and manage staff training requirements and completion status</p>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search staff or trainings..."
              className="pl-10 pr-4"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-3 flex-wrap">
            <Tabs value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as (TrainingCategory | 'all'))} className="w-auto">
              <TabsList className="bg-gray-100">
                <TabsTrigger value="all" className="data-[state=active]:bg-white">
                  All
                </TabsTrigger>
                <TabsTrigger value="core" className="data-[state=active]:bg-white">
                  Core ({categories.find(c => c.category === 'core')?.count || 0})
                </TabsTrigger>
                <TabsTrigger value="mandatory" className="data-[state=active]:bg-white">
                  Mandatory ({categories.find(c => c.category === 'mandatory')?.count || 0})
                </TabsTrigger>
                <TabsTrigger value="specialized" className="data-[state=active]:bg-white">
                  Specialized ({categories.find(c => c.category === 'specialized')?.count || 0})
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <TrainingFilter onApplyFilters={handleApplyFilters} />
            
            <TrainingSort 
              onSort={setSortOption} 
              currentSort={sortOption}
            />
            
            <TrainingExport matrixData={matrixData} />
            
            <Button 
              variant="default" 
              className="gap-2 whitespace-nowrap bg-blue-600 hover:bg-blue-700"
              onClick={() => setAddTrainingOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Training</span>
            </Button>
            
            <AddTrainingDialog 
              open={addTrainingOpen} 
              onOpenChange={setAddTrainingOpen}
              onAddTraining={handleAddTraining} 
            />
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex flex-wrap gap-4 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <span className="text-sm text-gray-700">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 flex items-center justify-center">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-sm text-gray-700">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
            <span className="text-sm text-gray-700">Expired</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 flex items-center justify-center">
              <CircleDashed className="h-4 w-4 text-gray-600" />
            </div>
            <span className="text-sm text-gray-700">Not Started</span>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="min-w-[200px] w-[200px]">Staff Member</TableHead>
              <TableHead className="text-center w-[120px]">Completion</TableHead>
              {filteredTrainings.map((training) => (
                <TableHead 
                  key={training.id} 
                  className="text-center min-w-[100px] p-1"
                >
                  <div className="flex flex-col items-center p-1">
                    <span className="text-xs font-medium truncate max-w-[100px]" title={training.title}>
                      {training.title}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={`text-[10px] mt-1 ${
                        training.category === 'core' 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : training.category === 'mandatory' 
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : training.category === 'specialized'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      {training.category}
                    </Badge>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStaff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={filteredTrainings.length + 2} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <Users className="h-8 w-8 mb-2" />
                    <p className="text-sm">No staff members found.</p>
                    <p className="text-xs mt-1">Try adjusting your search criteria.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredStaff.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={staff.avatar || "/placeholder.svg"} alt={staff.name} />
                        <AvatarFallback>{staff.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{staff.name}</div>
                        <div className="text-xs text-gray-500">{staff.role}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-center gap-1">
                      <Progress value={calculateCompletionPercentage(staff.id)} className="h-2 w-full" />
                      <span className="text-xs text-gray-500">
                        {calculateCompletionPercentage(staff.id)}%
                      </span>
                    </div>
                  </TableCell>
                  {filteredTrainings.map((training) => (
                    <TableCell key={`${staff.id}-${training.id}`} className="p-1 text-center">
                      {matrixData.data[staff.id]?.[training.id] ? (
                        <TrainingStatusCell 
                          data={matrixData.data[staff.id][training.id]} 
                          title={training.title}
                          onClick={() => handleCellClick(staff.id, training.id)}
                        />
                      ) : (
                        <div className="p-2 border rounded-md bg-gray-100 flex flex-col items-center justify-center min-h-[70px] min-w-[70px]">
                          <CircleDashed className="h-4 w-4 text-gray-400" />
                          <div className="text-xs font-medium text-gray-400 mt-1">
                            N/A
                          </div>
                        </div>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
  
  // If we're not in a branch dashboard, just show the matrix
  if (!branchId && !branchName) {
    return trainingMatrixContent;
  }
  
  // Otherwise, render with branch header and navigation
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      
      <main className="flex-1 px-4 md:px-8 pt-4 pb-20 md:py-6 w-full">
        <BranchInfoHeader 
          branchName={branchName || "Med-Infinite Branch"} 
          branchId={branchId || ""}
          onNewBooking={handleNewBooking}
        />
        
        <div className="mb-6">
          <TabNavigation 
            activeTab={activeTab} 
            onChange={handleTabChange}
          />
        </div>
        
        {trainingMatrixContent}
      </main>
    </div>
  );
};

export default TrainingMatrix;
