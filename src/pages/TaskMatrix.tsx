
import { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { TabNavigation } from "@/components/TabNavigation";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface TaskData {
  id: number;
  name: string;
  percentage: number;
  workPermit: { status: string; date?: string; expiresIn?: number };
  carInsurance: { status: string; date?: string; expiresIn?: number };
  niNumber: { status: string };
  drivingLicense: { status: string; date?: string; expiresIn?: number };
  dvla: { status: string };
  dbs: { status: string; date?: string; expiresIn?: number };
}

const mockData: TaskData[] = [
  {
    id: 1,
    name: "Ayo-Famure, Opeyemi",
    percentage: 86,
    workPermit: { status: "pending", date: "13/05/2028", expiresIn: 1164 },
    carInsurance: { status: "n/a" },
    niNumber: { status: "completed" },
    drivingLicense: { status: "n/a" },
    dvla: { status: "n/a" },
    dbs: { status: "pending", date: "20/02/2027", expiresIn: 716 }
  },
  // Add more mock data as needed
];

const TaskMatrix = () => {
  const [activeTab, setActiveTab] = useState("workflow");
  const [viewType, setViewType] = useState<"staff" | "client">("staff");

  const getStatusColor = (status: string, date?: string) => {
    if (status === "completed") return "bg-[#F2FCE2] text-green-700";
    if (status === "n/a") return "bg-gray-100 text-gray-600";
    if (status === "pending") return "bg-[#F2FCE2] text-green-700";
    return "bg-[#FFDEE2] text-red-600";
  };

  const renderStatus = (item: { status: string; date?: string; expiresIn?: number }) => {
    if (item.status === "completed") return "Completed";
    if (item.status === "n/a") return "N/A";
    if (item.date) return (
      <>
        {item.date}
        <div className="text-xs mt-1">
          Expires in {item.expiresIn} days
        </div>
      </>
    );
    return `No ${item.status}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <TabNavigation activeTab={activeTab} onChange={setActiveTab} hideQuickAdd />
        
        <Card className="mt-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Task Matrix</h2>
              <div className="flex gap-2">
                <Badge
                  variant={viewType === "staff" ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setViewType("staff")}
                >
                  Staff
                </Badge>
                <Badge
                  variant={viewType === "client" ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setViewType("client")}
                >
                  Client
                </Badge>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">#</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead className="text-center">
                    Work Permit
                    <div className="text-xs font-normal">61%</div>
                  </TableHead>
                  <TableHead className="text-center">
                    Car Insurance
                    <div className="text-xs font-normal">61%</div>
                  </TableHead>
                  <TableHead className="text-center">
                    NI Number
                    <div className="text-xs font-normal">55%</div>
                  </TableHead>
                  <TableHead className="text-center">
                    Driving License
                    <div className="text-xs font-normal">72%</div>
                  </TableHead>
                  <TableHead className="text-center">
                    DVLA
                    <div className="text-xs font-normal">72%</div>
                  </TableHead>
                  <TableHead className="text-center">
                    DBS
                    <div className="text-xs font-normal">55%</div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.percentage}%</TableCell>
                    <TableCell className={cn("text-center", getStatusColor(row.workPermit.status))}>
                      {renderStatus(row.workPermit)}
                      <Checkbox className="mt-2" />
                    </TableCell>
                    <TableCell className={cn("text-center", getStatusColor(row.carInsurance.status))}>
                      {renderStatus(row.carInsurance)}
                      <Checkbox className="mt-2" />
                    </TableCell>
                    <TableCell className={cn("text-center", getStatusColor(row.niNumber.status))}>
                      {renderStatus(row.niNumber)}
                      <Checkbox className="mt-2" />
                    </TableCell>
                    <TableCell className={cn("text-center", getStatusColor(row.drivingLicense.status))}>
                      {renderStatus(row.drivingLicense)}
                      <Checkbox className="mt-2" />
                    </TableCell>
                    <TableCell className={cn("text-center", getStatusColor(row.dvla.status))}>
                      {renderStatus(row.dvla)}
                      <Checkbox className="mt-2" />
                    </TableCell>
                    <TableCell className={cn("text-center", getStatusColor(row.dbs.status))}>
                      {renderStatus(row.dbs)}
                      <Checkbox className="mt-2" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default TaskMatrix;
