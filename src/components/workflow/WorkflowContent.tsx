
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CheckCircle, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface WorkflowContentProps {
  branchId: string;
  branchName: string;
}

export const WorkflowContent: React.FC<WorkflowContentProps> = ({ branchId, branchName }) => {
  // Sample workflow data
  const workflows = [
    { id: 1, name: "Client Onboarding", status: "Active", lastUpdated: "2 days ago", priority: "High", assignee: "John Smith" },
    { id: 2, name: "Care Plan Review", status: "Pending", lastUpdated: "1 week ago", priority: "Medium", assignee: "Sarah Johnson" },
    { id: 3, name: "Staff Training", status: "Completed", lastUpdated: "Yesterday", priority: "Low", assignee: "Michael Brown" },
    { id: 4, name: "Medication Management", status: "Active", lastUpdated: "3 days ago", priority: "High", assignee: "Emma Davis" },
    { id: 5, name: "Risk Assessment", status: "Delayed", lastUpdated: "2 weeks ago", priority: "High", assignee: "Robert Wilson" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Workflow Management for {branchName}</h2>
        <Button>Create New Workflow</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Active Workflows</CardTitle>
            <CardDescription>Currently running</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-3xl font-bold text-blue-600">
              8
              <span className="ml-2 text-sm font-normal text-gray-500">(+2 from last week)</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Completed</CardTitle>
            <CardDescription>Successfully finished</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-3xl font-bold text-green-600">
              24
              <span className="ml-2 text-sm font-normal text-gray-500">(+5 from last month)</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Delayed</CardTitle>
            <CardDescription>Behind schedule</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-3xl font-bold text-amber-600">
              3
              <span className="ml-2 text-sm font-normal text-gray-500">(-1 from last week)</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Issues</CardTitle>
            <CardDescription>Require attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-3xl font-bold text-red-600">
              2
              <span className="ml-2 text-sm font-normal text-gray-500">(+1 from yesterday)</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Active Workflows</CardTitle>
          <CardDescription>Manage and monitor all workflow processes for Branch ID: {branchId}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Workflow Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflows.map((workflow) => (
                <TableRow key={workflow.id}>
                  <TableCell className="font-medium">{workflow.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {workflow.status === "Active" && <CheckCircle className="mr-2 h-4 w-4 text-green-500" />}
                      {workflow.status === "Pending" && <Clock className="mr-2 h-4 w-4 text-amber-500" />}
                      {workflow.status === "Completed" && <CheckCircle className="mr-2 h-4 w-4 text-blue-500" />}
                      {workflow.status === "Delayed" && <AlertCircle className="mr-2 h-4 w-4 text-red-500" />}
                      {workflow.status}
                    </div>
                  </TableCell>
                  <TableCell>{workflow.lastUpdated}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      workflow.priority === "High" ? "bg-red-100 text-red-800" :
                      workflow.priority === "Medium" ? "bg-amber-100 text-amber-800" :
                      "bg-green-100 text-green-800"
                    }`}>
                      {workflow.priority}
                    </span>
                  </TableCell>
                  <TableCell>{workflow.assignee}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <FileText className="h-4 w-4" />
                      <span className="sr-only">View</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
