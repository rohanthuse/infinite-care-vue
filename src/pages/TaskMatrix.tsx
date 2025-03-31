
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";

interface TaskMatrixProps {
  branchId: string;
  branchName: string;
}

const TaskMatrix: React.FC<TaskMatrixProps> = ({ branchId, branchName }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Task Matrix for {branchName}</h2>
        <div className="flex space-x-2">
          <Button size="sm">
            Export Matrix
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Task Completion Matrix</CardTitle>
          <CardDescription>Overview of task completion status for all staff members</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Staff Member</TableHead>
                <TableHead>Daily Reports</TableHead>
                <TableHead>Client Assessments</TableHead>
                <TableHead>Training Compliance</TableHead>
                <TableHead>Equipment Checks</TableHead>
                <TableHead>Care Plans</TableHead>
                <TableHead>Medication Reviews</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((item) => (
                <TableRow key={item}>
                  <TableCell className="font-medium">Staff Member {item}</TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <CheckCircle2 className="text-green-500" size={16} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      {item % 3 === 0 ? (
                        <XCircle className="text-red-500" size={16} />
                      ) : item % 2 === 0 ? (
                        <Clock className="text-amber-500" size={16} />
                      ) : (
                        <CheckCircle2 className="text-green-500" size={16} />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      {item % 2 === 0 ? (
                        <CheckCircle2 className="text-green-500" size={16} />
                      ) : (
                        <AlertCircle className="text-amber-500" size={16} />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <CheckCircle2 className="text-green-500" size={16} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      {item % 4 === 0 ? (
                        <XCircle className="text-red-500" size={16} />
                      ) : (
                        <CheckCircle2 className="text-green-500" size={16} />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      {item % 5 === 0 ? (
                        <Clock className="text-amber-500" size={16} />
                      ) : (
                        <CheckCircle2 className="text-green-500" size={16} />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Task Completion Rate</CardTitle>
            <CardDescription>Overall completion rate by task type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Daily Reports", value: 92 },
                { name: "Client Assessments", value: 78 },
                { name: "Training Compliance", value: 84 },
                { name: "Equipment Checks", value: 95 },
                { name: "Care Plans", value: 86 },
                { name: "Medication Reviews", value: 81 }
              ].map((item) => (
                <div key={item.name} className="flex items-center">
                  <div className="w-40 font-medium text-sm">{item.name}</div>
                  <div className="flex-1">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full" 
                        style={{ width: `${item.value}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="ml-3 text-sm font-medium">{item.value}%</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Task Status Breakdown</CardTitle>
            <CardDescription>Current status of all tasks in system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center p-4 bg-green-50 rounded-lg">
                <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                <div className="text-xl font-bold">75</div>
                <div className="text-sm text-gray-500">Completed</div>
              </div>
              <div className="flex flex-col items-center p-4 bg-amber-50 rounded-lg">
                <Clock className="h-8 w-8 text-amber-500 mb-2" />
                <div className="text-xl font-bold">23</div>
                <div className="text-sm text-gray-500">In Progress</div>
              </div>
              <div className="flex flex-col items-center p-4 bg-red-50 rounded-lg">
                <XCircle className="h-8 w-8 text-red-500 mb-2" />
                <div className="text-xl font-bold">12</div>
                <div className="text-sm text-gray-500">Overdue</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TaskMatrix;
