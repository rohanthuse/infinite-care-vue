import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CarerViewAttendanceTab } from "./CarerViewAttendanceTab";
import { CarerLeaveManagementTab } from "./CarerLeaveManagementTab";
import { CarerAttendanceCalendarView } from "./CarerAttendanceCalendarView";

interface CarerAttendanceTabProps {
  carerId: string;
}

export const CarerAttendanceTab: React.FC<CarerAttendanceTabProps> = ({ carerId }) => {
  return (
    <div className="w-full">
      <Tabs defaultValue="calendar-view" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar-view">Calendar View</TabsTrigger>
          <TabsTrigger value="list-view">List View</TabsTrigger>
          <TabsTrigger value="leave-management">Leave Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar-view" className="mt-6">
          <CarerAttendanceCalendarView carerId={carerId} />
        </TabsContent>
        
        <TabsContent value="list-view" className="mt-6">
          <CarerViewAttendanceTab carerId={carerId} />
        </TabsContent>
        
        <TabsContent value="leave-management" className="mt-6">
          <CarerLeaveManagementTab carerId={carerId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};