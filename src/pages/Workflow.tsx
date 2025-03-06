
import { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Workflow as WorkflowIcon, Check, Clock, AlertTriangle } from "lucide-react";
import { TabNavigation } from "@/components/TabNavigation";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const Workflow = () => {
  const { id, branchName } = useParams<{ id: string; branchName: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState("workflow");
  
  const isInBranchContext = location.pathname.includes('/branch-dashboard/');
  
  const handleNavigationChange = (value: string) => {
    if (value === "workflow") {
      setTab(value);
    } else {
      if (isInBranchContext && id && branchName) {
        navigate(`/branch-dashboard/${id}/${branchName}/${value}`);
      } else {
        navigate(`/${value}`);
      }
    }
  };

  const handleNewBooking = () => {
    if (isInBranchContext && id && branchName) {
      navigate(`/branch-dashboard/${id}/${branchName}/bookings/new`);
    } else {
      navigate('/bookings/new');
    }
  };
  
  const workflowCards = [
    {
      title: "Client Onboarding",
      description: "Process for new client registration and setup",
      completed: 15,
      pending: 8,
      late: 3,
      status: "active",
    },
    {
      title: "Staff Training",
      description: "Required training modules for care staff",
      completed: 42,
      pending: 12,
      late: 0,
      status: "active",
    },
    {
      title: "Care Plan Reviews",
      description: "Regular updates and reviews of client care plans",
      completed: 27,
      pending: 18,
      late: 5,
      status: "warning",
    },
    {
      title: "Compliance Checks",
      description: "Regulatory and policy compliance verification",
      completed: 36,
      pending: 4,
      late: 0,
      status: "completed",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <DashboardHeader />
      {!isInBranchContext && <DashboardNavbar />}
      <div className="container mx-auto px-4 py-6">
        {isInBranchContext && (
          <>
            <div className="flex items-center text-sm text-gray-500 mb-6">
              <span className="mr-2">
                <a 
                  href="/branches" 
                  className="hover:text-blue-600 hover:underline"
                >
                  Branches
                </a>
              </span>
              <span className="mx-2">&gt;</span>
              <span className="font-medium text-gray-700">{branchName}</span>
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <div className="flex flex-col">
                <div className="flex items-center">
                  <h1 className="text-4xl font-bold text-gray-900">{branchName}</h1>
                  <Badge className="ml-3 bg-green-100 text-green-800 hover:bg-green-200">
                    Active
                  </Badge>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-4 text-gray-600">
                  <div className="flex items-center">
                    <span>Milton Keynes, UK</span>
                  </div>
                </div>
              </div>
              
              <Button
                className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700"
                onClick={handleNewBooking}
              >
                New Booking
              </Button>
            </div>
          </>
        )}
        
        <TabNavigation activeTab={tab} onChange={handleNavigationChange} hideQuickAdd={true} />
        
        <div className="mt-8">
          <div className="mb-6 flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <WorkflowIcon className="h-6 w-6 text-blue-600" />
                  Workflow Management
                </h1>
                <p className="text-gray-500 mt-1">
                  Track and manage your business processes
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {workflowCards.map((workflow, index) => (
              <Card key={index} className="border-gray-200 shadow-sm hover:shadow-md transition-all">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle>{workflow.title}</CardTitle>
                    <Badge 
                      className={
                        workflow.status === "active" ? "bg-blue-100 text-blue-800" : 
                        workflow.status === "warning" ? "bg-amber-100 text-amber-800" : 
                        "bg-green-100 text-green-800"
                      }
                    >
                      {workflow.status === "active" ? "Active" : 
                       workflow.status === "warning" ? "Attention" : 
                       "Completed"}
                    </Badge>
                  </div>
                  <CardDescription>{workflow.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{workflow.completed} Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{workflow.pending} Pending</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span className="text-sm">{workflow.late} Late</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full">View Details</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workflow;
