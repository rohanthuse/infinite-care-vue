import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CarerViewAttendanceTab } from "./CarerViewAttendanceTab";
import { CarerLeaveManagementTab } from "./CarerLeaveManagementTab";

interface CarerAttendanceTabProps {
  carerId: string;
}

export const CarerAttendanceTab: React.FC<CarerAttendanceTabProps> = ({ carerId }) => {
  return (
    <div className="w-full">
      <Tabs defaultValue="view-attendance" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="view-attendance">View Attendance</TabsTrigger>
          <TabsTrigger value="leave-management">Leave Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="view-attendance" className="mt-6">
          <CarerViewAttendanceTab carerId={carerId} />
        </TabsContent>
        
        <TabsContent value="leave-management" className="mt-6">
          <CarerLeaveManagementTab carerId={carerId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};