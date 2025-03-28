import { useState, useEffect } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { 
  ListChecks, ChevronRight, Search, Plus, 
  FileText, Calendar, Car, MessageSquare, DollarSign, Folder
} from "lucide-react";
import { 
  Tabs, TabsList, TabsTrigger, TabsContent 
} from "@/components/ui/tabs";
import { TabNavigation } from "@/components/TabNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { BranchSidebar } from "@/components/BranchSidebar";

interface BaseParameter {
  id: string | number;
  title: string;
  status: "Active" | "Inactive";
}

interface ReportType extends BaseParameter {}

interface FileCategory extends BaseParameter {}

interface BankHoliday extends BaseParameter {
  registeredBy: string;
  registeredOn: string;
}

interface TravelManagement extends BaseParameter {
  fromDate: string;
  ratePerMile: number;
  ratePerHour: number;
  userType: string;
}

interface CommunicationType extends BaseParameter {}

interface ExpenseType extends BaseParameter {
  type: "Increment" | "Decrement";
  amount: number;
  tax: number;
}

interface ColumnDef {
  header: string;
  accessorKey: string;
  cell?: (value: any) => React.ReactNode;
}

const KeyParameters = () => {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const { id, branchName } = params;
  const [activeTab, setActiveTab] = useState("key-parameters");
  const [activeSectionTab, setActiveSectionTab] = useState("report-types");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const isInBranchContext = Boolean(id && branchName);
  const pathParts = location.pathname.split('/');
  const isBranchDashboardPath = pathParts.includes('branch-dashboard');

  const reportTypes: ReportType[] = [
    { id: 1, title: "General", status: "Active" },
    { id: 2, title: "Diet and Nutrition", status: "Active" },
    { id: 3, title: "Bowel Movement", status: "Active" },
    { id: 4, title: "Behavior", status: "Active" },
    { id: 5, title: "Mood", status: "Active" },
    { id: 6, title: "Body Map", status: "Active" },
    { id: 7, title: "Medication", status: "Active" },
    { id: 8, title: "Transfer", status: "Active" },
    { id: 9, title: "DNACPR", status: "Active" },
    { id: 10, title: "Sleeping Pattern", status: "Active" },
  ];

  const fileCategories: FileCategory[] = [
    { id: 1, title: "Carers Documents", status: "Active" },
    { id: 2, title: "Client Documents", status: "Active" },
    { id: 3, title: "Company Policies", status: "Active" },
    { id: 4, title: "ID", status: "Active" },
    { id: 5, title: "Agreements", status: "Active" },
  ];

  const bankHolidays: BankHoliday[] = [
    { id: 1, title: "New Year's Day", status: "Active", registeredBy: "Admin", registeredOn: "01/01/2023" },
    { id: 2, title: "Good Friday", status: "Active", registeredBy: "Admin", registeredOn: "07/04/2023" },
    { id: 3, title: "Easter Monday", status: "Active", registeredBy: "Admin", registeredOn: "10/04/2023" },
    { id: 4, title: "Early May Bank Holiday", status: "Active", registeredBy: "Admin", registeredOn: "01/05/2023" },
    { id: 5, title: "Spring Bank Holiday", status: "Active", registeredBy: "Admin", registeredOn: "29/05/2023" },
  ];

  const travelManagement: TravelManagement[] = [
    { id: 1, title: "Standard Travel Rate", status: "Active", fromDate: "01/01/2023", ratePerMile: 0.45, ratePerHour: 15, userType: "Carer" },
    { id: 2, title: "Manager Travel Rate", status: "Active", fromDate: "01/01/2023", ratePerMile: 0.50, ratePerHour: 20, userType: "Manager" },
    { id: 3, title: "Senior Carer Rate", status: "Active", fromDate: "01/01/2023", ratePerMile: 0.48, ratePerHour: 18, userType: "Senior Carer" },
  ];

  const communicationTypes: CommunicationType[] = [
    { id: 1, title: "Cancellation", status: "Active" },
    { id: 2, title: "Lateness/Delay", status: "Active" },
    { id: 3, title: "Sickness", status: "Active" },
    { id: 4, title: "Grievance", status: "Active" },
    { id: 5, title: "Holiday", status: "Active" },
    { id: 6, title: "Appraisal", status: "Active" },
    { id: 7, title: "Disciplinary", status: "Active" },
  ];

  const expenseTypes: ExpenseType[] = [
    { id: 1, title: "Mileage", status: "Active", type: "Increment", amount: 0.45, tax: 0 },
    { id: 2, title: "Hourly rate", status: "Active", type: "Increment", amount: 15, tax: 0.2 },
    { id: 3, title: "Admin deduction", status: "Active", type: "Decrement", amount: 5, tax: 0 },
    { id: 4, title: "Training fee", status: "Active", type: "Decrement", amount: 50, tax: 0 },
  ];

  const reportTypeColumns: ColumnDef[] = [
    { header: "Title", accessorKey: "title" },
    { 
      header: "Status", 
      accessorKey: "status", 
      cell: (value: string) => (
        <Badge variant={value === "Active" ? "success" : "danger"}>
          {value}
        </Badge>
      )
    },
  ];

  const fileCategoryColumns: ColumnDef[] = [
    { header: "Title", accessorKey: "title" },
    { 
      header: "Status", 
      accessorKey: "status", 
      cell: (value: string) => (
        <Badge variant={value === "Active" ? "success" : "danger"}>
          {value}
        </Badge>
      )
    },
  ];

  const bankHolidayColumns: ColumnDef[] = [
    { header: "Title", accessorKey: "title" },
    { header: "Registered By", accessorKey: "registeredBy" },
    { header: "Registered On", accessorKey: "registeredOn" },
    { 
      header: "Status", 
      accessorKey: "status", 
      cell: (value: string) => (
        <Badge variant={value === "Active" ? "success" : "danger"}>
          {value}
        </Badge>
      )
    },
  ];

  const travelManagementColumns: ColumnDef[] = [
    { header: "Title", accessorKey: "title" },
    { header: "From Date", accessorKey: "fromDate" },
    { 
      header: "Rate per Mile", 
      accessorKey: "ratePerMile",
      cell: (value: number) => `£${value.toFixed(2)}`
    },
    { 
      header: "Rate per Hour", 
      accessorKey: "ratePerHour",
      cell: (value: number) => `£${value.toFixed(2)}`
    },
    { header: "User Type", accessorKey: "userType" },
    { 
      header: "Status", 
      accessorKey: "status", 
      cell: (value: string) => (
        <Badge variant={value === "Active" ? "success" : "danger"}>
          {value}
        </Badge>
      )
    },
  ];

  const communicationTypeColumns: ColumnDef[] = [
    { header: "Title", accessorKey: "title" },
    { 
      header: "Status", 
      accessorKey: "status", 
      cell: (value: string) => (
        <Badge variant={value === "Active" ? "success" : "danger"}>
          {value}
        </Badge>
      )
    },
  ];

  const expenseTypeColumns: ColumnDef[] = [
    { header: "Title", accessorKey: "title" },
    { header: "Type", accessorKey: "type" },
    { 
      header: "Amount", 
      accessorKey: "amount",
      cell: (value: number) => `£${value.toFixed(2)}`
    },
    { 
      header: "Tax", 
      accessorKey: "tax",
      cell: (value: number) => `${(value * 100).toFixed(0)}%`
    },
    { 
      header: "Status", 
      accessorKey: "status", 
      cell: (value: string) => (
        <Badge variant={value === "Active" ? "success" : "danger"}>
          {value}
        </Badge>
      )
    },
  ];

  const form = useForm({
    defaultValues: {
      title: "",
      status: "Active",
      fromDate: "",
      ratePerMile: 0,
      ratePerHour: 0,
      userType: "",
      type: "Increment",
      amount: 0,
      tax: 0,
    },
  });

  const handleAddNew = (parameterType: string) => {
    setDialogTitle(`Add New ${getParameterTypeTitle(parameterType)}`);
    form.reset();
    setIsDialogOpen(true);
  };

  const onSubmit = (data: any) => {
    console.log("Form submitted:", data);
    toast.success(`${getParameterTypeTitle(activeSectionTab)} added successfully`);
    setIsDialogOpen(false);
  };

  const getParameterTypeTitle = (parameterType: string): string => {
    switch (parameterType) {
      case "report-types":
        return "Report Type";
      case "file-categories":
        return "File Category";
      case "bank-holidays":
        return "Bank Holiday";
      case "travel-management":
        return "Travel Management";
      case "communication-types":
        return "Communication Type";
      case "expense-types":
        return "Expense Type";
      default:
        return "Parameter";
    }
  };

  const getParameterTypeIcon = (parameterType: string) => {
    switch (parameterType) {
      case "report-types":
        return <FileText className="h-5 w-5 text-gray-600" />;
      case "file-categories":
        return <Folder className="h-5 w-5 text-gray-600" />;
      case "bank-holidays":
        return <Calendar className="h-5 w-5 text-gray-600" />;
      case "travel-management":
        return <Car className="h-5 w-5 text-gray-600" />;
      case "communication-types":
        return <MessageSquare className="h-5 w-5 text-gray-600" />;
      case "expense-types":
        return <DollarSign className="h-5 w-5 text-gray-600" />;
      default:
        return <ListChecks className="h-5 w-5 text-gray-600" />;
    }
  };

  const getParameterData = (parameterType: string) => {
    switch (parameterType) {
      case "report-types":
        return reportTypes;
      case "file-categories":
        return fileCategories;
      case "bank-holidays":
        return bankHolidays;
      case "travel-management":
        return travelManagement;
      case "communication-types":
        return communicationTypes;
      case "expense-types":
        return expenseTypes;
      default:
        return [];
    }
  };

  const getParameterColumns = (parameterType: string): ColumnDef[] => {
    switch (parameterType) {
      case "report-types":
        return reportTypeColumns;
      case "file-categories":
        return fileCategoryColumns;
      case "bank-holidays":
        return bankHolidayColumns;
      case "travel-management":
        return travelManagementColumns;
      case "communication-types":
        return communicationTypeColumns;
      case "expense-types":
        return expenseTypeColumns;
      default:
        return [];
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      {!isInBranchContext && (
        <>
          <DashboardHeader />
          <DashboardNavbar />
        </>
      )}
      
      {isInBranchContext && isBranchDashboardPath && (
        <div className="flex">
          <BranchSidebar branchName={decodeURIComponent(branchName || "")} />
          <div className="flex-1 ml-[250px]">
            {/* Branch dashboard specific content */}
          </div>
        </div>
      )}
      
      <div className={`flex-1 px-4 md:px-8 py-6 md:py-8 w-full ${isInBranchContext && isBranchDashboardPath ? 'ml-[250px]' : ''}`}>
        {isInBranchContext && (
          <div className="mb-6">
            <TabNavigation 
              activeTab={activeTab} 
              onChange={(tab) => {
                setActiveTab(tab);
                if (isBranchDashboardPath) {
                  navigate(`/branch-dashboard/${id}/${branchName}/${tab}`);
                }
              }}
              hideQuickAdd={true}
            />
          </div>
        )}
        
        <div className="mb-4">
          <Breadcrumb>
            <BreadcrumbList>
              {isInBranchContext ? (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to={`/branch-dashboard/${id}/${branchName}`}>
                        Dashboard
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-4 w-4" />
                  </BreadcrumbSeparator>
                </>
              ) : (
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/dashboard">
                      Dashboard
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              )}
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink>Key Parameters</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <Card className="mb-8 border-none shadow-md">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <ListChecks className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">Key Parameters</h1>
                  <p className="text-gray-500 text-sm md:text-base">Manage system parameters and configurations</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative w-full md:w-auto">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
            <TabsList className="w-full grid grid-cols-3 md:grid-cols-6 p-0 rounded-t-lg rounded-b-none border-b bg-gray-50">
              <TabsTrigger 
                value="report-types" 
                className="flex items-center justify-center gap-2 rounded-none py-3 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden md:inline">Report Types</span>
                <span className="md:hidden">Reports</span>
              </TabsTrigger>
              <TabsTrigger 
                value="file-categories" 
                className="flex items-center justify-center gap-2 rounded-none py-3 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
              >
                <Folder className="h-4 w-4" />
                <span className="hidden md:inline">File Categories</span>
                <span className="md:hidden">Files</span>
              </TabsTrigger>
              <TabsTrigger 
                value="bank-holidays" 
                className="flex items-center justify-center gap-2 rounded-none py-3 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden md:inline">Bank Holidays</span>
                <span className="md:hidden">Holidays</span>
              </TabsTrigger>
              <TabsTrigger 
                value="travel-management" 
                className="flex items-center justify-center gap-2 rounded-none py-3 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
              >
                <Car className="h-4 w-4" />
                <span className="hidden md:inline">Travel Management</span>
                <span className="md:hidden">Travel</span>
              </TabsTrigger>
              <TabsTrigger 
                value="communication-types" 
                className="flex items-center justify-center gap-2 rounded-none py-3 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden md:inline">Communication Types</span>
                <span className="md:hidden">Comms</span>
              </TabsTrigger>
              <TabsTrigger 
                value="expense-types" 
                className="flex items-center justify-center gap-2 rounded-none py-3 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
              >
                <DollarSign className="h-4 w-4" />
                <span className="hidden md:inline">Expense Types</span>
                <span className="md:hidden">Expenses</span>
              </TabsTrigger>
            </TabsList>

            {["report-types", "file-categories", "bank-holidays", "travel-management", "communication-types", "expense-types"].map((paramType) => (
              <TabsContent key={paramType} value={paramType} className="p-0 border-0">
                <div className="p-4 border-t-0 rounded-b-lg bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {getParameterTypeIcon(paramType)}
                      <h2 className="text-xl font-semibold text-gray-800">
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
                        {getParameterData(paramType)
                          .filter(item => searchQuery 
                            ? item.title.toLowerCase().includes(searchQuery.toLowerCase())
                            : true)
                          .map((item) => (
                            <TableRow key={item.id}>
                              {getParameterColumns(paramType).map((column, colIndex) => (
                                <TableCell key={`${item.id}-${colIndex}`} className="text-left">
                                  {column.cell && column.accessorKey in item
                                    ? column.cell(item[column.accessorKey as keyof typeof item])
                                    : item[column.accessorKey as keyof typeof item]?.toString()}
                                </TableCell>
                              ))}
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        {getParameterData(paramType).filter(item => searchQuery 
                          ? item.title.toLowerCase().includes(searchQuery.toLowerCase())
                          : true).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={getParameterColumns(paramType).length + 1} className="text-center py-6 text-gray-500">
                              No data found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {activeSectionTab === "travel-management" && (
                <>
                  <FormField
                    control={form.control}
                    name="fromDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="ratePerMile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rate per Mile (£)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="ratePerHour"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rate per Hour (£)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="userType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User Type</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter user type" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              
              {activeSectionTab === "expense-types" && (
                <>
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <FormControl>
                          <select
                            className="w-full rounded-md border border-input px-3 py-2"
                            {...field}
                          >
                            <option value="Increment">Increment</option>
                            <option value="Decrement">Decrement</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (£)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="tax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Rate (0-1)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" min="0" max="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KeyParameters;
