
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Download, Filter, Plus } from "lucide-react";

export interface KeyParametersContentProps {
  branchId: string;
  branchName: string;
}

export const KeyParametersContent: React.FC<KeyParametersContentProps> = ({ branchId, branchName }) => {
  // Sample key parameters data
  const parameters = [
    { id: 1, name: "Client Satisfaction", target: "90%", current: "87%", status: "Amber", trend: "Increasing" },
    { id: 2, name: "Staff Retention", target: "85%", current: "90%", status: "Green", trend: "Stable" },
    { id: 3, name: "Care Plan Compliance", target: "100%", current: "98%", status: "Green", trend: "Stable" },
    { id: 4, name: "Medication Errors", target: "<1%", current: "0.5%", status: "Green", trend: "Decreasing" },
    { id: 5, name: "Training Completion", target: "95%", current: "82%", status: "Red", trend: "Increasing" },
    { id: 6, name: "Incident Reporting", target: "100%", current: "95%", status: "Amber", trend: "Stable" },
  ];

  // Sample chart data
  const chartData = [
    { month: "Jan", satisfaction: 85, compliance: 92 },
    { month: "Feb", satisfaction: 83, compliance: 94 },
    { month: "Mar", satisfaction: 86, compliance: 96 },
    { month: "Apr", satisfaction: 87, compliance: 95 },
    { month: "May", satisfaction: 85, compliance: 97 },
    { month: "Jun", satisfaction: 88, compliance: 98 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Key Parameters for {branchName}</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Parameter
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Performance Dashboard</CardTitle>
          <CardDescription>Branch ID: {branchId}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="satisfaction" name="Client Satisfaction" fill="#8884d8" />
                <Bar dataKey="compliance" name="Care Plan Compliance" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Key Performance Indicators</CardTitle>
          <CardDescription>Current status of critical parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parameter</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Current</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Trend</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parameters.map((param) => (
                <TableRow key={param.id}>
                  <TableCell className="font-medium">{param.name}</TableCell>
                  <TableCell>{param.target}</TableCell>
                  <TableCell>{param.current}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      param.status === "Green" ? "bg-green-100 text-green-800" :
                      param.status === "Amber" ? "bg-amber-100 text-amber-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {param.status}
                    </span>
                  </TableCell>
                  <TableCell>{param.trend}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">View Details</Button>
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
