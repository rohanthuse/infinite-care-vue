import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { BranchLayout } from "@/components/branch-dashboard/BranchLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttendanceForm } from "@/components/attendance/AttendanceForm";
import { AttendanceList } from "@/components/attendance/AttendanceList";
import { AttendanceLeaveManagement } from "@/components/attendance/AttendanceLeaveManagement";

const Attendance = () => {
  const [activeTab, setActiveTab] = useState("record");
  const { id, branchName } = useParams<{ id: string; branchName: string }>();

  return (
    <BranchLayout>
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-1">Attendance Management</h2>
        <p className="text-sm text-muted-foreground mb-4">Track staff attendance and manage leave requests</p>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid grid-cols-3 mb-6 w-full lg:w-auto">
            <TabsTrigger value="record" className="flex items-center gap-1">
              <span>Record Attendance</span>
            </TabsTrigger>
            <TabsTrigger value="view" className="flex items-center gap-1">
              <span>View Attendance</span>
            </TabsTrigger>
            <TabsTrigger value="leave" className="flex items-center gap-1">
              <span>Leave Management</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="record" className="space-y-6">
            <AttendanceForm branchId={id || ''} />
          </TabsContent>
          
          <TabsContent value="view" className="space-y-6">
            <AttendanceList branchId={id || ''} />
          </TabsContent>
          
          <TabsContent value="leave" className="space-y-6">
            <AttendanceLeaveManagement branchId={id || ''} />
          </TabsContent>
        </Tabs>
      </div>
    </BranchLayout>
  );
};

export default Attendance;