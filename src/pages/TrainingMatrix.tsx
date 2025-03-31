
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getTrainingMatrix, getTrainingCategories, filterTrainingsByCategory } from "@/data/mockTrainingData";
import { Training, TrainingMatrix as TrainingMatrixType, TrainingCategory, StaffMember } from "@/types/training";
import { 
  Search, Filter, Download, Plus, Users, 
  GraduationCap, SlidersHorizontal, CheckCircle2, 
  Clock, XCircle, CircleDashed
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import TrainingStatusCell from "@/components/training/TrainingStatusCell";

const TrainingMatrix: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<TrainingCategory | 'all'>('all');
  const [matrixData, setMatrixData] = useState<TrainingMatrixType>(getTrainingMatrix());
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>(matrixData.staffMembers);
  const [filteredTrainings, setFilteredTrainings] = useState<Training[]>(matrixData.trainings);
  const categories = getTrainingCategories();
  
  // Filter staff and trainings based on search term and category
  useEffect(() => {
    const staffMatches = matrixData.staffMembers.filter(staff => 
      staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredStaff(staffMatches);
    
    const trainingsMatches = filterTrainingsByCategory(
      matrixData.trainings.filter(training => 
        training.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        training.description.toLowerCase().includes(searchTerm.toLowerCase())
      ),
      categoryFilter
    );
    
    setFilteredTrainings(trainingsMatches);
  }, [searchTerm, categoryFilter, matrixData]);
  
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
  
  const handleAddTraining = () => {
    toast({
      title: "Add Training",
      description: "This feature will be implemented soon.",
    });
  };
  
  const calculateCompletionPercentage = (staffId: string): number => {
    const staffTrainings = matrixData.trainings.map(training => 
      matrixData.data[staffId]?.[training.id]?.status === 'completed' ? 1 : 0
    );
    
    const completed = staffTrainings.reduce((sum, val) => sum + val, 0);
    const total = staffTrainings.length;
    
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };
  
  return (
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
            
            <Button variant="outline" className="gap-2 whitespace-nowrap">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
            
            <Button variant="outline" className="gap-2 whitespace-nowrap">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Sort</span>
            </Button>
            
            <Button variant="outline" className="gap-2 whitespace-nowrap">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            
            <Button 
              variant="default" 
              className="gap-2 whitespace-nowrap bg-blue-600 hover:bg-blue-700"
              onClick={handleAddTraining}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Training</span>
            </Button>
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
};

export default TrainingMatrix;
