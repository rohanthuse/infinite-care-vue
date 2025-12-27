import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { TrainingCategory, TrainingStatus, StaffMember } from "@/types/training";
import { 
  Search, Plus, Users, CheckCircle2, Clock, XCircle, CircleDashed, UserPlus, Trash2, MoreVertical
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TrainingStatusCell from "@/components/training/TrainingStatusCell";
import TrainingFilter from "@/components/training/TrainingFilter";
import TrainingSort, { SortOption } from "@/components/training/TrainingSort";
import TrainingExport from "@/components/training/TrainingExport";
import AddTrainingDialog from "@/components/training/AddTrainingDialog";
import { AssignTrainingDialog } from "@/components/training/AssignTrainingDialog";
import TrainingRecordDetailsDialog from "@/components/training/TrainingRecordDetailsDialog";
import { useTrainingCourses } from "@/hooks/useTrainingCourses";
import { useStaffTrainingRecords } from "@/hooks/useStaffTrainingRecords";
import { useBranchStaffAndClients } from "@/hooks/useBranchStaffAndClients";
import { useTrainingManagement } from "@/hooks/useTrainingManagement";
import { TrainingMetricsEmailButton } from "@/components/training/TrainingMetricsEmailButton";
import { useDialogManager } from "@/hooks/useDialogManager";

export interface TrainingMatrixProps {
  branchId?: string;
  branchName?: string;
}

const TrainingMatrix: React.FC<TrainingMatrixProps> = (props) => {
  const params = useParams<{id: string, branchName: string}>();
  const branchId = props.branchId || params.id;
  const branchName = props.branchName || params.branchName;

  if (!branchId) {
    return <div>Branch ID is required</div>;
  }

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<TrainingCategory | 'all'>('all');
  const [addTrainingOpen, setAddTrainingOpen] = useState(false);
  const [assignTrainingOpen, setAssignTrainingOpen] = useState(false);
  const [trainingDetailsOpen, setTrainingDetailsOpen] = useState(false);
  const [selectedTrainingRecord, setSelectedTrainingRecord] = useState<{
    record: any;
    staffName: string;
    trainingTitle: string;
  } | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>({ field: "name", direction: "asc" });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [trainingToDelete, setTrainingToDelete] = useState<string | null>(null);
  const [newlyAssignedCells, setNewlyAssignedCells] = useState<Set<string>>(new Set());
  
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

  // Fetch data from Supabase
  const { data: trainingCourses = [], isLoading: isLoadingCourses } = useTrainingCourses(branchId);
  const { records: trainingRecords = [], isLoading: isLoadingRecords } = useStaffTrainingRecords(branchId);
  const { staff = [], isLoading: isLoadingStaff } = useBranchStaffAndClients(branchId);
  const { createCourse, assignTraining, deleteCourse, isCreating, isAssigning, isDeleting } = useTrainingManagement(branchId);
  const { closeAllDropdowns } = useDialogManager();

  const isLoading = isLoadingCourses || isLoadingRecords || isLoadingStaff;

  // Transform data to match the UI format
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
  const [filteredTrainings, setFilteredTrainings] = useState<any[]>([]);

  // Create training matrix data structure
  const matrixData = React.useMemo(() => {
    const data: Record<string, Record<string, any>> = {};
    
    // Initialize EMPTY data structure (no pre-population)
    staff.forEach(staffMember => {
      data[staffMember.id] = {};
    });

    // Populate ONLY with actual training records from database
    trainingRecords.forEach(record => {
      if (!data[record.staff_id]) {
        data[record.staff_id] = {};
      }
      
      // Dynamically determine if training is expired based on expiry_date
      let effectiveStatus = record.status as TrainingStatus;
      if (record.status === 'completed' && record.expiry_date) {
        const expiryDate = new Date(record.expiry_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        expiryDate.setHours(0, 0, 0, 0);
        
        if (expiryDate < today) {
          effectiveStatus = 'expired';
        }
      }
      
      data[record.staff_id][record.training_course_id] = {
        status: effectiveStatus,
        completionDate: record.completion_date,
        expiryDate: record.expiry_date,
        score: record.score,
        maxScore: record.training_course.max_score
      };
    });

    return data;
  }, [staff, trainingCourses, trainingRecords]);

  // Calculate category counts
  const categories = React.useMemo(() => {
    const counts = trainingCourses.reduce((acc, course) => {
      acc[course.category] = (acc[course.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { category: 'core' as TrainingCategory, count: counts.core || 0 },
      { category: 'mandatory' as TrainingCategory, count: counts.mandatory || 0 },
      { category: 'specialized' as TrainingCategory, count: counts.specialized || 0 },
      { category: 'optional' as TrainingCategory, count: counts.optional || 0 },
    ];
  }, [trainingCourses]);
  
  // Apply all filters and sorting to the data
  useEffect(() => {
    let staffMatches = staff.filter(staffMember => 
      staffMember.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staffMember.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staffMember.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    let trainingsMatches = trainingCourses.filter(course => 
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Apply advanced category filters if any are selected
    if (advancedFilters.categories.length > 0) {
      trainingsMatches = trainingsMatches.filter(course => 
        advancedFilters.categories.includes(course.category as TrainingCategory)
      );
    } 
    // Otherwise apply the tab filter
    else if (categoryFilter !== 'all') {
      trainingsMatches = trainingsMatches.filter(course => 
        course.category === categoryFilter
      );
    }
    
    // Apply status filters if any are selected
    if (advancedFilters.statuses.length > 0) {
      staffMatches = staffMatches.filter(staffMember => {
        return trainingsMatches.some(course => {
          const cell = matrixData[staffMember.id]?.[course.id];
          return cell && advancedFilters.statuses.includes(cell.status);
        });
      });
    }
    
    // Apply expiry range filter
    if (advancedFilters.expiryRange !== "all") {
      const today = new Date();
      
      if (advancedFilters.expiryRange === "expired") {
        staffMatches = staffMatches.filter(staffMember => {
          return trainingsMatches.some(course => {
            const cell = matrixData[staffMember.id]?.[course.id];
            return cell && cell.expiryDate && new Date(cell.expiryDate) < today;
          });
        });
      } else {
        const days = parseInt(advancedFilters.expiryRange.replace("days", ""));
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + days);
        
        staffMatches = staffMatches.filter(staffMember => {
          return trainingsMatches.some(course => {
            const cell = matrixData[staffMember.id]?.[course.id];
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
        const nameA = `${a.first_name} ${a.last_name}`;
        const nameB = `${b.first_name} ${b.last_name}`;
        return sortOption.direction === "asc" 
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      } else if (sortOption.field === "completion") {
        const completionA = calculateCompletionPercentage(a.id);
        const completionB = calculateCompletionPercentage(b.id);
        return sortOption.direction === "asc" 
          ? completionA - completionB
          : completionB - completionA;
      }
      return 0;
    });
    
    setFilteredStaff(sortedStaff.map(s => ({
      id: s.id,
      name: `${s.first_name} ${s.last_name}`,
      role: s.specialization || 'Care Assistant',
      department: 'Care Services',
      avatar: "/placeholder.svg",
      trainingCompleted: 0, // Will be calculated
      trainingTotal: trainingsMatches.length
    })));
    
    setFilteredTrainings(trainingsMatches.map(c => ({
      id: c.id,
      title: c.title,
      category: c.category as TrainingCategory,
      description: c.description || '',
      status: 'not-started' as TrainingStatus,
      maxScore: c.max_score
    })));
  }, [searchTerm, categoryFilter, trainingCourses, staff, advancedFilters, sortOption, matrixData]);
  
  const handleCellClick = (staffId: string, trainingId: string) => {
    const staff = filteredStaff.find(s => s.id === staffId);
    const training = filteredTrainings.find(t => t.id === trainingId);
    const record = trainingRecords.find(r => r.staff_id === staffId && r.training_course_id === trainingId);
    
    if (record && staff && training) {
      setSelectedTrainingRecord({
        record,
        staffName: staff.name,
        trainingTitle: training.title
      });
      setTrainingDetailsOpen(true);
    }
  };
  
  const handleAddTraining = (trainingData: any) => {
    // Transform the data to match the database schema
    const courseData = {
      title: trainingData.title,
      description: trainingData.description || null,
      category: trainingData.category as 'core' | 'mandatory' | 'specialized' | 'optional',
      valid_for_months: trainingData.validFor || 12,
      required_score: 70,
      max_score: 100,
      is_mandatory: trainingData.category === 'core' || trainingData.category === 'mandatory',
      certificate_template: null,
      status: 'active' as 'active' | 'inactive' | 'archived',
      branch_id: branchId
    };

    createCourse(courseData);
    setAddTrainingOpen(false);
  };

  const handleAssignTraining = (courseIds: string[], staffIds: string[]) => {
    // Track which cells are newly assigned for animation
    const newCells = new Set<string>();
    
    // For each course-staff combination
    courseIds.forEach(courseId => {
      staffIds.forEach(staffId => {
        newCells.add(`${staffId}-${courseId}`);
      });
      
      // Assign the training course to all selected staff
      assignTraining({ staffIds, courseId });
    });
    
    setNewlyAssignedCells(newCells);
    
    // Clear the animation after 3 seconds
    setTimeout(() => {
      setNewlyAssignedCells(new Set());
    }, 3000);
    
    setAssignTrainingOpen(false);
  };

  const handleDeleteClick = (training: any) => {
    // Step 1: Set which training to delete
    setTrainingToDelete(training.id);
    
    // Step 2: Close all dropdowns first (critical!)
    closeAllDropdowns();
    
    // Step 3: Wait for dropdown to fully close, then open dialog
    setTimeout(() => {
      setDeleteDialogOpen(true);
    }, 150);
  };

  const handleDeleteTraining = () => {
    if (trainingToDelete) {
      // Close dialog immediately
      setDeleteDialogOpen(false);
      
      // Execute delete after small delay to allow dialog to close
      setTimeout(() => {
        deleteCourse(trainingToDelete);
        setTrainingToDelete(null);
      }, 150);
    }
  };
  
  const handleApplyFilters = (filters: {
    categories: TrainingCategory[];
    statuses: TrainingStatus[];
    expiryRange: string;
  }) => {
    setAdvancedFilters(filters);
  };
  
  const calculateCompletionPercentage = (staffId: string): number => {
    const staffTrainings = filteredTrainings.map(training => 
      matrixData[staffId]?.[training.id]?.status === 'completed' ? 1 : 0
    );
    
    const completed = staffTrainings.reduce((sum, val) => sum + val, 0);
    const total = staffTrainings.length;
    
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-sm p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading training data...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-6">
      {isDeleting && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-4 shadow-lg border">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <span className="text-sm font-medium">Deleting training...</span>
            </div>
          </div>
        </div>
      )}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Training Program</h1>
        <p className="text-muted-foreground mt-2">Track and manage staff training requirements and completion status</p>
      </div>
      
      <div className="bg-card rounded-lg border border-border shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search staff or trainings..."
              className="pl-10 pr-4"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-3 flex-wrap">
            <Tabs value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as (TrainingCategory | 'all'))} className="w-auto">
              <TabsList className="bg-muted">
                <TabsTrigger value="all" className="data-[state=active]:bg-background">
                  All
                </TabsTrigger>
                <TabsTrigger value="mandatory" className="data-[state=active]:bg-background">
                  Mandatory ({categories.find(c => c.category === 'mandatory')?.count || 0})
                </TabsTrigger>
                <TabsTrigger value="core" className="data-[state=active]:bg-background">
                  Core ({categories.find(c => c.category === 'core')?.count || 0})
                </TabsTrigger>
                <TabsTrigger value="specialized" className="data-[state=active]:bg-background">
                  Specialized ({categories.find(c => c.category === 'specialized')?.count || 0})
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <TrainingFilter onApplyFilters={handleApplyFilters} />
            
            <TrainingSort 
              onSort={setSortOption} 
              currentSort={sortOption}
            />
            
            <TrainingExport matrixData={{ staffMembers: filteredStaff, trainings: filteredTrainings, data: matrixData }} />
            
            <TrainingMetricsEmailButton 
              branchId={branchId} 
              branchName={branchName || 'Branch'}
              variant="outline"
              size="default"
            />
            
            
            <Button 
              variant="outline" 
              className="gap-2 whitespace-nowrap"
              onClick={() => setAssignTrainingOpen(true)}
              disabled={isAssigning}
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">{isAssigning ? 'Assigning...' : 'Assign Training'}</span>
            </Button>
            
            <Button 
              variant="default" 
              className="gap-2 whitespace-nowrap bg-blue-600 hover:bg-blue-700"
              onClick={() => setAddTrainingOpen(true)}
              disabled={isCreating}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{isCreating ? 'Adding...' : 'Add Training'}</span>
            </Button>
            
            <AddTrainingDialog 
              open={addTrainingOpen} 
              onOpenChange={setAddTrainingOpen}
              onAddTraining={handleAddTraining} 
            />
            
            <AssignTrainingDialog
              open={assignTrainingOpen}
              onOpenChange={setAssignTrainingOpen}
              onAssign={handleAssignTraining}
              isAssigning={isAssigning}
              trainingCourses={trainingCourses}
              staff={staff}
              existingRecords={trainingRecords}
            />
            
            <TrainingRecordDetailsDialog
              open={trainingDetailsOpen}
              onOpenChange={setTrainingDetailsOpen}
              record={selectedTrainingRecord?.record || null}
              staffName={selectedTrainingRecord?.staffName || ''}
              trainingTitle={selectedTrainingRecord?.trainingTitle || ''}
              staffId={selectedTrainingRecord?.record?.staff_id || ''}
            />
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex flex-wrap gap-4 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm text-foreground">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 flex items-center justify-center">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm text-foreground">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border-2 border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center">
              <CircleDashed className="h-3 w-3 text-cyan-700 dark:text-cyan-300" />
            </div>
            <span className="text-sm text-foreground font-medium">Assigned (Not Started)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-sm text-foreground">Expired</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 flex items-center justify-center opacity-40">
              <CircleDashed className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-sm text-muted-foreground">Not Assigned</span>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px] w-[200px]">Staff Member</TableHead>
              <TableHead className="text-center w-[120px]">Completion</TableHead>
              {filteredTrainings.map((training) => (
                <TableHead 
                  key={training.id} 
                  className="text-center min-w-[100px] p-1"
                >
                  <div className="flex flex-col items-center p-1 relative">
                    {/* Three-dot menu - NO AlertDialog wrapping */}
                    <div className="absolute top-0 right-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 opacity-50 hover:opacity-100"
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="text-red-600 focus:text-red-700 cursor-pointer"
                            onSelect={(e) => {
                              e.preventDefault();
                              handleDeleteClick(training);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Training
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Training title and badge */}
                    <span className="text-xs font-medium truncate max-w-[100px]" title={training.title}>
                      {training.title}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={`text-[10px] mt-1 ${
                        training.category === 'core' 
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700' 
                          : training.category === 'mandatory' 
                            ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700'
                            : training.category === 'specialized'
                              ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700'
                              : 'bg-muted text-muted-foreground border-border'
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
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Users className="h-8 w-8 mb-2" />
                    <p className="text-sm">No staff members found.</p>
                    <p className="text-xs mt-1">Try adjusting your search criteria.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredStaff.map((staffMember) => (
                <TableRow key={staffMember.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={staffMember.avatar || "/placeholder.svg"} alt={staffMember.name} />
                        <AvatarFallback>{staffMember.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{staffMember.name}</div>
                        <div className="text-xs text-muted-foreground">{staffMember.role}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-center gap-1">
                      <Progress value={calculateCompletionPercentage(staffMember.id)} className="h-2 w-full" />
                      <span className="text-xs text-muted-foreground">
                        {calculateCompletionPercentage(staffMember.id)}%
                      </span>
                    </div>
                  </TableCell>
                  {filteredTrainings.map((training) => (
                    <TableCell key={`${staffMember.id}-${training.id}`} className="p-1 text-center">
                      {matrixData[staffMember.id]?.[training.id] ? (
                        <TrainingStatusCell 
                          data={matrixData[staffMember.id][training.id]} 
                          title={training.title}
                          onClick={() => handleCellClick(staffMember.id, training.id)}
                          isNewlyAssigned={newlyAssignedCells.has(`${staffMember.id}-${training.id}`)}
                        />
                      ) : (
                        <div 
                          className="p-2 border border-dashed rounded-md bg-muted flex flex-col items-center justify-center min-h-[70px] min-w-[70px] opacity-40 hover:opacity-60 transition-opacity"
                          title="Not assigned"
                        >
                          <CircleDashed className="h-4 w-4 text-muted-foreground" />
                          <div className="text-xs font-medium text-muted-foreground mt-1">
                            Not Assigned
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

      {/* Single Delete Confirmation Dialog - Outside all loops */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This will permanently delete{' '}
                <strong>
                  {trainingToDelete 
                    ? filteredTrainings.find(t => t.id === trainingToDelete)?.title 
                    : 'this training'}
                </strong>{' '}
                and all associated training records for staff members.
              </p>
              <p className="text-red-600 font-medium">This action cannot be undone!</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTrainingToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTraining}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Yes, Delete Training"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TrainingMatrix;
