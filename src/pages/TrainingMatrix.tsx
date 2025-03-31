
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, AlertCircle, Download } from "lucide-react";

interface TrainingMatrixProps {
  branchId: string;
  branchName: string;
}

const TrainingMatrix: React.FC<TrainingMatrixProps> = ({ branchId, branchName }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Training Matrix for {branchName}</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Staff Training Status</CardTitle>
          <CardDescription>Training compliance matrix for all staff members</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Staff Member</TableHead>
                <TableHead>Manual Handling</TableHead>
                <TableHead>Medication</TableHead>
                <TableHead>First Aid</TableHead>
                <TableHead>Safeguarding</TableHead>
                <TableHead>Fire Safety</TableHead>
                <TableHead>Infection Control</TableHead>
                <TableHead>Mental Capacity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((item) => (
                <TableRow key={item}>
                  <TableCell className="font-medium">Staff Member {item}</TableCell>
                  <TableCell>
                    <Badge className={
                      item % 3 === 0 ? "bg-red-100 text-red-800" : 
                      item % 2 === 0 ? "bg-amber-100 text-amber-800" : 
                      "bg-green-100 text-green-800"
                    }>
                      {item % 3 === 0 ? "Expired" : 
                       item % 2 === 0 ? "Expiring Soon" : 
                       "Valid"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800">
                      Valid
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={item % 5 === 0 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                      {item % 5 === 0 ? "Expired" : "Valid"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800">
                      Valid
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={item % 4 === 0 ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}>
                      {item % 4 === 0 ? "Expiring Soon" : "Valid"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800">
                      Valid
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={item % 6 === 0 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                      {item % 6 === 0 ? "Expired" : "Valid"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Training Status</CardTitle>
            <CardDescription>Overall training status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center p-4 bg-green-50 rounded-lg">
                <div className="text-xl font-bold">82%</div>
                <div className="text-sm text-gray-500">Valid</div>
              </div>
              <div className="flex flex-col items-center p-4 bg-amber-50 rounded-lg">
                <div className="text-xl font-bold">11%</div>
                <div className="text-sm text-gray-500">Expiring</div>
              </div>
              <div className="flex flex-col items-center p-4 bg-red-50 rounded-lg">
                <div className="text-xl font-bold">7%</div>
                <div className="text-sm text-gray-500">Expired</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Renewals</CardTitle>
            <CardDescription>Training due in next 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { staff: "Staff Member 2", training: "Manual Handling", daysLeft: 12 },
                { staff: "Staff Member 4", training: "Fire Safety", daysLeft: 18 },
                { staff: "Staff Member 1", training: "Medication", daysLeft: 25 }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2 border-b">
                  <div>
                    <div className="font-medium text-sm">{item.staff}</div>
                    <div className="text-xs text-gray-500">{item.training}</div>
                  </div>
                  <Badge variant="outline" className="bg-amber-50">
                    {item.daysLeft} days left
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Training Compliance</CardTitle>
            <CardDescription>By training type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Manual Handling", value: 88 },
                { name: "Medication", value: 96 },
                { name: "First Aid", value: 84 },
                { name: "Safeguarding", value: 100 },
                { name: "Infection Control", value: 92 }
              ].map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-sm">{item.value}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        item.value >= 90 ? "bg-green-500" : 
                        item.value >= 80 ? "bg-amber-500" : 
                        "bg-red-500"
                      }`}
                      style={{ width: `${item.value}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrainingMatrix;
