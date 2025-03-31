import React, { useState, useEffect } from "react";
import { getFormMatrix, getFormCategories } from "@/data/mockFormData";
import { Form, FormMatrix as FormMatrixType, FormCategory, FormStatus, StaffMember } from "@/types/form";
import { 
  Search, Plus, Users, CheckCircle2, Clock, XCircle, CircleDashed, CheckCircle
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
import FormStatusCell from "@/components/forms/FormStatusCell";
import FormFilter from "@/components/forms/FormFilter";
import FormSort, { SortOption } from "@/components/forms/FormSort";
import FormExport from "@/components/forms/FormExport";
import AddFormDialog from "@/components/forms/AddFormDialog";

interface FormMatrixProps {
  branchId?: string;
}

const FormMatrix: React.FC<FormMatrixProps> = ({ branchId }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<FormCategory | 'all'>('all');
  const [matrixData, setMatrixData] = useState<FormMatrixType>(getFormMatrix());
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>(matrixData.staffMembers);
  const [filteredForms, setFilteredForms] = useState<Form[]>(matrixData.forms);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>({ field: "name", direction: "asc" });
  const categories = getFormCategories();
  
  const [advancedFilters, setAdvancedFilters] = useState<{
    categories: FormCategory[];
    statuses: FormStatus[];
    expiryRange: string;
  }>({
    categories: [],
    statuses: [],
    expiryRange: "all"
  });
  
  useEffect(() => {
    let staffMatches = matrixData.staffMembers.filter(staff => 
      staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    let formsMatches = matrixData.forms.filter(form => 
      form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (advancedFilters.categories.length > 0) {
      formsMatches = formsMatches.filter(form => 
        advancedFilters.categories.includes(form.category)
      );
    } 
    else if (categoryFilter !== 'all') {
      formsMatches = formsMatches.filter(form => 
        form.category === categoryFilter
      );
    }
    
    if (advancedFilters.statuses.length > 0) {
      staffMatches = staffMatches.filter(staff => {
        return formsMatches.some(form => {
          const cell = matrixData.data[staff.id]?.[form.id];
          return cell && advancedFilters.statuses.includes(cell.status);
        });
      });
    }
    
    if (advancedFilters.expiryRange !== "all") {
      const today = new Date();
      
      if (advancedFilters.expiryRange === "expired") {
        staffMatches = staffMatches.filter(staff => {
          return formsMatches.some(form => {
            const cell = matrixData.data[staff.id]?.[form.id];
            return cell && cell.expiryDate && new Date(cell.expiryDate) < today;
          });
        });
      } 
      else {
        const days = parseInt(advancedFilters.expiryRange.replace("days", ""));
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + days);
        
        staffMatches = staffMatches.filter(staff => {
          return formsMatches.some(form => {
            const cell = matrixData.data[staff.id]?.[form.id];
            if (cell && cell.expiryDate) {
              const expiryDate = new Date(cell.expiryDate);
              return expiryDate >= today && expiryDate <= futureDate;
            }
            return false;
          });
        });
      }
    }
    
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
    setFilteredForms(formsMatches);
  }, [searchTerm, categoryFilter, matrixData, advancedFilters, sortOption]);
  
  const handleCellClick = (staffId: string, formId: string) => {
    toast({
      title: "Form Details",
      description: `Viewing details for ${
        matrixData.forms.find(t => t.id === formId)?.title
      } for ${
        matrixData.staffMembers.find(s => s.id === staffId)?.name
      }`,
    });
  };
  
  const handleAddForm = (formData: any) => {
    const updatedForms = [...matrixData.forms, formData];
    
    const updatedMatrixData = {
      ...matrixData,
      forms: updatedForms,
      data: {
        ...matrixData.data,
        ...Object.fromEntries(
          matrixData.staffMembers.map(staff => [
            staff.id,
            {
              ...matrixData.data[staff.id],
              [formData.id]: {
                status: "not-started" as const
              }
            }
          ])
        )
      }
    };
    
    setMatrixData(updatedMatrixData);
    
    toast({
      title: "Form Added",
      description: `${formData.title} has been added successfully.`,
    });
  };
  
  const handleApplyFilters = (filters: {
    categories: FormCategory[];
    statuses: FormStatus[];
    expiryRange: string;
  }) => {
    setAdvancedFilters(filters);
  };
  
  const calculateCompletionPercentage = (staffId: string): number => {
    const staffForms = matrixData.forms.map(form => 
      matrixData.data[staffId]?.[form.id]?.status === 'completed' || 
      matrixData.data[staffId]?.[form.id]?.status === 'approved' ? 1 : 0
    );
    
    const completed = staffForms.reduce((sum, val) => sum + val, 0);
    const total = staffForms.length;
    
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">Form Matrix</h1>
        <p className="text-gray-500 mt-2">Track and manage staff form requirements and completion status</p>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search staff or forms..."
              className="pl-10 pr-4"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-3 flex-wrap">
            <Tabs value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as (FormCategory | 'all'))} className="w-auto">
              <TabsList className="bg-gray-100">
                <TabsTrigger value="all" className="data-[state=active]:bg-white">
                  All
                </TabsTrigger>
                <TabsTrigger value="onboarding" className="data-[state=active]:bg-white">
                  Onboarding ({categories.find(c => c.category === 'onboarding')?.count || 0})
                </TabsTrigger>
                <TabsTrigger value="assessment" className="data-[state=active]:bg-white">
                  Assessment ({categories.find(c => c.category === 'assessment')?.count || 0})
                </TabsTrigger>
                <TabsTrigger value="compliance" className="data-[state=active]:bg-white">
                  Compliance ({categories.find(c => c.category === 'compliance')?.count || 0})
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <FormFilter onApplyFilters={handleApplyFilters} />
            
            <FormSort 
              onSort={setSortOption} 
              currentSort={sortOption}
            />
            
            <FormExport matrixData={matrixData} />
            
            <Button 
              variant="default" 
              className="gap-2 whitespace-nowrap bg-blue-600 hover:bg-blue-700"
              onClick={() => setAddFormOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Form</span>
            </Button>
            
            <AddFormDialog 
              open={addFormOpen} 
              onOpenChange={setAddFormOpen}
              onAddForm={handleAddForm} 
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
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-sm text-gray-700">Approved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <span className="text-sm text-gray-700">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
            <span className="text-sm text-gray-700">Rejected</span>
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
              {filteredForms.map((form) => (
                <TableHead 
                  key={form.id} 
                  className="text-center min-w-[100px] p-1"
                >
                  <div className="flex flex-col items-center p-1">
                    <span className="text-xs font-medium truncate max-w-[100px]" title={form.title}>
                      {form.title}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={`text-[10px] mt-1 ${
                        form.category === 'onboarding' 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : form.category === 'assessment' 
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : form.category === 'feedback'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : form.category === 'medical'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}
                    >
                      {form.category}
                    </Badge>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStaff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={filteredForms.length + 2} className="text-center py-8">
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
                  {filteredForms.map((form) => (
                    <TableCell key={`${staff.id}-${form.id}`} className="p-1 text-center">
                      {matrixData.data[staff.id]?.[form.id] ? (
                        <FormStatusCell 
                          data={matrixData.data[staff.id][form.id]} 
                          title={form.title}
                          onClick={() => handleCellClick(staff.id, form.id)}
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

export default FormMatrix;
