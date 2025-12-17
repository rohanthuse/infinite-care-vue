import React, { useState } from "react";
import { ChevronRight, FileText, Calendar, Car, MessageSquare, PoundSterling, Folder, ListChecks, Plus, Search, Briefcase, Edit, Trash, Loader2, Stethoscope, Building2 } from "lucide-react";
import { 
  Tabs, TabsList, TabsTrigger, TabsContent 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ServicesTable } from "@/components/ServicesTable";
import { AddServiceDialog } from "@/components/AddServiceDialog";
import { ParameterForm } from "./ParameterForm";
import {
  useReportTypes,
  useFileCategories,
  useBankHolidays,
  useTravelRates,
  useCommunicationTypes,
  useExpenseTypes,
  type ReportType,
  type FileCategory,
  type BankHoliday,
  type TravelRate,
  type CommunicationType,
  type ExpenseType,
} from "@/hooks/useKeyParameters";
import { useDiagnosis, type Diagnosis } from "@/hooks/useDiagnosis";
import AuthoritiesTab from "@/components/workflow/AuthoritiesTab";

interface KeyParametersContentProps {
  branchId?: string;
  branchName?: string;
}

interface ColumnDef {
  header: string;
  accessorKey: string;
  cell?: (value: any, item?: any) => React.ReactNode;
}

const KeyParametersContent = ({ branchId, branchName }: KeyParametersContentProps) => {
  const [activeSectionTab, setActiveSectionTab] = useState("report-types");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddServiceDialogOpen, setIsAddServiceDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  // Hooks for different parameter types
  const reportTypes = useReportTypes();
  const fileCategories = useFileCategories();
  const bankHolidays = useBankHolidays();
  const travelRates = useTravelRates();
  const communicationTypes = useCommunicationTypes();
  const expenseTypes = useExpenseTypes();
  const diagnosis = useDiagnosis();

  const getParameterTypeTitle = (parameterType: string): string => {
    switch (parameterType) {
      case "report-types":
        return "Report Type";
      case "file-categories":
        return "File Category";
      case "bank-holidays":
        return "Bank Holiday";
      case "travel-rates":
        return "Rate Management";
      case "communication-types":
        return "Communication Type";
      case "expense-types":
        return "Expense Type";
      case "services":
        return "Service";
      case "diagnosis":
        return "Diagnosis";
      default:
        return "Parameter";
    }
  };

  const getParameterTypeIcon = (parameterType: string) => {
    switch (parameterType) {
      case "report-types":
        return <FileText className="h-5 w-5 text-muted-foreground" />;
      case "file-categories":
        return <Folder className="h-5 w-5 text-muted-foreground" />;
      case "bank-holidays":
        return <Calendar className="h-5 w-5 text-muted-foreground" />;
      case "travel-rates":
        return <Car className="h-5 w-5 text-muted-foreground" />;
      case "communication-types":
        return <MessageSquare className="h-5 w-5 text-muted-foreground" />;
      case "expense-types":
        return <PoundSterling className="h-5 w-5 text-muted-foreground" />;
      case "services":
        return <Briefcase className="h-5 w-5 text-muted-foreground" />;
      case "diagnosis":
        return <Stethoscope className="h-5 w-5 text-muted-foreground" />;
      default:
        return <ListChecks className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getParameterData = (parameterType: string) => {
    switch (parameterType) {
      case "report-types":
        return reportTypes.data;
      case "file-categories":
        return fileCategories.data;
      case "bank-holidays":
        return bankHolidays.data;
      case "travel-rates":
        return travelRates.data;
      case "communication-types":
        return communicationTypes.data;
      case "expense-types":
        return expenseTypes.data;
      case "diagnosis":
        return diagnosis.data;
      default:
        return [];
    }
  };

  const getParameterColumns = (parameterType: string): ColumnDef[] => {
    const statusCell = (value: string) => (
      <Badge variant={value === "Active" ? "default" : "secondary"}>
        {value}
      </Badge>
    );

    switch (parameterType) {
      case "report-types":
      case "file-categories":
      case "communication-types":
      case "diagnosis":
        return [
          { header: "Title", accessorKey: "title" },
          { header: "Status", accessorKey: "status", cell: statusCell },
        ];
      case "bank-holidays":
        return [
          { header: "Title", accessorKey: "title" },
          { header: "Registered By", accessorKey: "registered_by" },
          { header: "Registered On", accessorKey: "registered_on", cell: (value) => new Date(value).toLocaleDateString('en-GB') },
          { header: "Status", accessorKey: "status", cell: statusCell },
        ];
      case "travel-rates":
        return [
          { header: "Title", accessorKey: "title" },
          { header: "From Date", accessorKey: "from_date", cell: (value) => new Date(value).toLocaleDateString('en-GB') },
          { header: "Rate per Mile", accessorKey: "rate_per_mile", cell: (value) => `£${value.toFixed(2)}` },
          { header: "Rate per Hour", accessorKey: "rate_per_hour", cell: (value) => `£${value.toFixed(2)}` },
          { header: "User Type", accessorKey: "user_type" },
          { header: "Status", accessorKey: "status", cell: statusCell },
        ];
      case "expense-types":
        return [
          { header: "Title", accessorKey: "title" },
          { header: "Type", accessorKey: "type" },
          { header: "Amount", accessorKey: "amount", cell: (value) => `£${value.toFixed(2)}` },
          { header: "Tax", accessorKey: "tax", cell: (value) => `${(value * 100).toFixed(1)}%` },
          { header: "Status", accessorKey: "status", cell: statusCell },
        ];
      default:
        return [];
    }
  };

  const getParameterHook = (parameterType: string) => {
    switch (parameterType) {
      case "report-types":
        return reportTypes;
      case "file-categories":
        return fileCategories;
      case "bank-holidays":
        return bankHolidays;
      case "travel-rates":
        return travelRates;
      case "communication-types":
        return communicationTypes;
      case "expense-types":
        return expenseTypes;
      case "diagnosis":
        return diagnosis;
      default:
        return null;
    }
  };

  const isLoading = (parameterType: string) => {
    const hook = getParameterHook(parameterType);
    return hook?.isLoading || false;
  };

  const handleAddNew = (parameterType: string) => {
    if (parameterType === 'services') {
      setIsAddServiceDialogOpen(true);
      return;
    }
    setIsDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (item: any) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      // Close dialog immediately
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      
      // Then trigger delete
      const hook = getParameterHook(activeSectionTab);
      hook?.delete(itemToDelete.id);
    }
  };

  const handleFormSubmit = (data: any) => {
    const hook = getParameterHook(activeSectionTab);
    if (editingItem) {
      // Close dialog immediately
      setIsEditDialogOpen(false);
      setEditingItem(null);
      
      // Then trigger update
      hook?.update({ id: editingItem.id, updates: data });
    } else {
      // Close dialog immediately
      setIsDialogOpen(false);
      
      // Then trigger create
      hook?.create(data);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredData = (data: any[]) => {
    if (!searchQuery) return data;
    return data.filter(item => 
      item.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <>
      <Card className="mb-8 border-none shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <ListChecks className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Core Settings</h1>
                <p className="text-muted-foreground text-sm md:text-base">Manage system parameters and configurations</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative w-full md:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  className="pl-9 pr-4 py-2 w-full md:w-64" 
                  placeholder="Search parameters..."
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8 border-none shadow-md">
        <Tabs value={activeSectionTab} onValueChange={setActiveSectionTab} className="w-full">
          <TabsList className="w-full grid grid-cols-5 md:grid-cols-9 p-0 rounded-t-lg rounded-b-none border-b bg-muted">
            <TabsTrigger 
              value="report-types" 
              className="flex items-center justify-center gap-2 rounded-none py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden md:inline">Report Types</span>
              <span className="md:hidden">Reports</span>
            </TabsTrigger>
            <TabsTrigger 
              value="file-categories" 
              className="flex items-center justify-center gap-2 rounded-none py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              <Folder className="h-4 w-4" />
              <span className="hidden md:inline">File Categories</span>
              <span className="md:hidden">Files</span>
            </TabsTrigger>
            <TabsTrigger 
              value="bank-holidays" 
              className="flex items-center justify-center gap-2 rounded-none py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden md:inline">Bank Holidays</span>
              <span className="md:hidden">Holidays</span>
            </TabsTrigger>
            <TabsTrigger 
              value="travel-rates" 
              className="flex items-center justify-center gap-2 rounded-none py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              <Car className="h-4 w-4" />
              <span className="hidden md:inline">Rate Management</span>
              <span className="md:hidden">Rates</span>
            </TabsTrigger>
            <TabsTrigger 
              value="communication-types" 
              className="flex items-center justify-center gap-2 rounded-none py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden md:inline">Communication Types</span>
              <span className="md:hidden">Comms</span>
            </TabsTrigger>
            <TabsTrigger 
              value="expense-types" 
              className="flex items-center justify-center gap-2 rounded-none py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              <PoundSterling className="h-4 w-4" />
              <span className="hidden md:inline">Expense Types</span>
              <span className="md:hidden">Expenses</span>
            </TabsTrigger>
            <TabsTrigger 
              value="services" 
              className="flex items-center justify-center gap-2 rounded-none py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              <Briefcase className="h-4 w-4" />
              <span className="hidden md:inline">Services</span>
              <span className="md:hidden">Services</span>
            </TabsTrigger>
            <TabsTrigger 
              value="diagnosis" 
              className="flex items-center justify-center gap-2 rounded-none py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              <Stethoscope className="h-4 w-4" />
              <span className="hidden md:inline">Diagnosis</span>
              <span className="md:hidden">Diagnosis</span>
            </TabsTrigger>
            <TabsTrigger 
              value="authorities" 
              className="flex items-center justify-center gap-2 rounded-none py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              <Building2 className="h-4 w-4" />
              <span className="hidden md:inline">Authorities</span>
              <span className="md:hidden">Auth</span>
            </TabsTrigger>
          </TabsList>

          {["report-types", "file-categories", "bank-holidays", "travel-rates", "communication-types", "expense-types", "services", "diagnosis"].map((paramType) => (
            <TabsContent key={paramType} value={paramType} className="p-0 border-0">
              {paramType === 'services' ? (
                <div className="p-4 border-t-0 rounded-b-lg bg-card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {getParameterTypeIcon(paramType)}
                      <h2 className="text-xl font-semibold text-foreground">
                        {getParameterTypeTitle(paramType)}s
                      </h2>
                    </div>
                    <Button 
                      onClick={() => handleAddNew(paramType)}
                      className="whitespace-nowrap"
                    >
                      <Plus className="h-4 w-4 mr-1" /> 
                      New {getParameterTypeTitle(paramType)}
                    </Button>
                  </div>
                  <div className="relative overflow-hidden border rounded-lg">
                    <ServicesTable searchQuery={searchQuery} />
                  </div>
                </div>
              ) : (
                <div className="p-4 border-t-0 rounded-b-lg bg-card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {getParameterTypeIcon(paramType)}
                      <h2 className="text-xl font-semibold text-foreground">
                        {paramType === "travel-rates" ? "Rate Management" : `${getParameterTypeTitle(paramType)}s`}
                      </h2>
                    </div>
                    <Button 
                      onClick={() => handleAddNew(paramType)}
                      className="whitespace-nowrap"
                      disabled={isLoading(paramType)}
                    >
                      <Plus className="h-4 w-4 mr-1" /> 
                      New {getParameterTypeTitle(paramType)}
                    </Button>
                  </div>
                  
                  <div className="relative overflow-hidden border rounded-lg">
                    {isLoading(paramType) ? (
                      <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="ml-2">Loading...</span>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {getParameterColumns(paramType).map((column, index) => (
                              <TableHead key={index} className="text-left font-semibold">
                                {column.header}
                              </TableHead>
                            ))}
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredData(getParameterData(paramType) || []).map((item) => (
                            <TableRow key={item.id}>
                              {getParameterColumns(paramType).map((column, colIndex) => (
                                <TableCell key={`${item.id}-${colIndex}`} className="text-left">
                                  {column.cell 
                                    ? column.cell(item[column.accessorKey], item)
                                    : item[column.accessorKey]?.toString()}
                                </TableCell>
                              ))}
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <ChevronRight className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEdit(item)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleDelete(item)}
                                      className="text-red-600"
                                    >
                                      <Trash className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                          {filteredData(getParameterData(paramType) || []).length === 0 && (
                            <TableRow>
                              <TableCell colSpan={getParameterColumns(paramType).length + 1} className="text-center py-6 text-gray-500">
                                No data found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          ))}

          {/* Authorities Tab Content */}
          <TabsContent value="authorities" className="p-0 border-0">
            <div className="p-4 border-t-0 rounded-b-lg bg-card">
              <AuthoritiesTab />
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Services Dialog */}
      <AddServiceDialog 
        isOpen={isAddServiceDialogOpen} 
        onClose={() => setIsAddServiceDialogOpen(false)} 
      />

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Add New {getParameterTypeTitle(activeSectionTab)}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1">
            <ParameterForm
              parameterType={activeSectionTab}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsDialogOpen(false)}
              isLoading={getParameterHook(activeSectionTab)?.isCreating}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Edit {getParameterTypeTitle(activeSectionTab)}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1">
            <ParameterForm
              parameterType={activeSectionTab}
              initialData={editingItem}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setEditingItem(null);
              }}
              isLoading={getParameterHook(activeSectionTab)?.isUpdating}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {getParameterTypeTitle(activeSectionTab).toLowerCase()}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={getParameterHook(activeSectionTab)?.isDeleting}
            >
              {getParameterHook(activeSectionTab)?.isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default KeyParametersContent;
