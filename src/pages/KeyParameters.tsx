
import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
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
import { CustomButton } from "@/components/ui/CustomButton";
import { ParameterTable } from "@/components/ParameterTable";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

// Define types for our different parameters
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

const KeyParameters = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { id, branchName } = params;
  const [activeTab, setActiveTab] = useState("parameters");
  const [activeSectionTab, setActiveSectionTab] = useState("report-types");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  
  // Determine if we're in a branch context
  const isInBranchContext = Boolean(id && branchName);

  // Sample data
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

  // Column definitions
  const reportTypeColumns = [
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

  const fileCategoryColumns = [
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

  const bankHolidayColumns = [
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

  const travelManagementColumns = [
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

  const communicationTypeColumns = [
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

  const expenseTypeColumns = [
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

  // Form for adding new parameter
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
    toast.success("Parameter added successfully");
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

  const getParameterColumns = (parameterType: string) => {
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

  return (
    <div className="container mx-auto p-4">
      {isInBranchContext && (
        <div className="mb-6">
          <TabNavigation 
            activeTab={activeTab} 
            onChange={(tab) => {
              setActiveTab(tab);
              navigate(`/branch-dashboard/${id}/${branchName}/${tab}`);
            }}
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

      <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-2xl p-6 md:p-8 mb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <ListChecks className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">Key Parameters</h1>
              <p className="text-gray-500 text-sm md:text-base">Manage system parameters and configurations</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                className="pl-9 bg-white border-gray-200 focus:border-blue-300 w-full sm:w-64" 
                placeholder="Search parameters..."
              />
            </div>
            
            <CustomButton 
              variant="pill" 
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
              onClick={() => handleAddNew(activeSectionTab)}
            >
              <Plus className="mr-1.5 h-4 w-4" /> New {getParameterTypeTitle(activeSectionTab)}
            </CustomButton>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <Tabs value={activeSectionTab} onValueChange={setActiveSectionTab} className="w-full">
          <TabsList className="w-full flex overflow-x-auto bg-gray-50 p-1 border-b border-gray-200">
            <TabsTrigger 
              value="report-types" 
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2"
            >
              <FileText className="h-4 w-4" />
              <span>Report Types</span>
            </TabsTrigger>
            <TabsTrigger 
              value="file-categories" 
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2"
            >
              <Folder className="h-4 w-4" />
              <span>File Categories</span>
            </TabsTrigger>
            <TabsTrigger 
              value="bank-holidays" 
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2"
            >
              <Calendar className="h-4 w-4" />
              <span>Bank Holidays</span>
            </TabsTrigger>
            <TabsTrigger 
              value="travel-management" 
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2"
            >
              <Car className="h-4 w-4" />
              <span>Travel Management</span>
            </TabsTrigger>
            <TabsTrigger 
              value="communication-types" 
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Communication Types</span>
            </TabsTrigger>
            <TabsTrigger 
              value="expense-types" 
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2"
            >
              <DollarSign className="h-4 w-4" />
              <span>Expense Types</span>
            </TabsTrigger>
          </TabsList>

          {["report-types", "file-categories", "bank-holidays", "travel-management", "communication-types", "expense-types"].map((paramType) => (
            <TabsContent key={paramType} value={paramType} className="p-0">
              <ParameterTable
                title={getParameterTypeTitle(paramType)}
                icon={getParameterTypeIcon(paramType)}
                columns={getParameterColumns(paramType)}
                data={getParameterData(paramType)}
                showFilter={false}
                showActions={true}
                addButton={
                  <CustomButton 
                    variant="pill" 
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
                    onClick={() => handleAddNew(paramType)}
                  >
                    <Plus className="mr-1.5 h-4 w-4" /> New {getParameterTypeTitle(paramType)}
                  </CustomButton>
                }
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Dialog for adding new parameter */}
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
