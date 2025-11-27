import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { BranchLayout } from "@/components/branch-dashboard/BranchLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttendanceForm } from "@/components/attendance/AttendanceForm";
import { AttendanceList } from "@/components/attendance/AttendanceList";
import { AttendanceLeaveManagement } from "@/components/attendance/AttendanceLeaveManagement";
import { AttendanceCalendarView } from "@/components/attendance/AttendanceCalendarView";
import { AddClientDialog } from "@/components/AddClientDialog";
import { NewBookingDialog } from "@/components/bookings/dialogs/NewBookingDialog";
import { useBookingData } from "@/components/bookings/hooks/useBookingData";
import { useServices } from "@/data/hooks/useServices";

const Attendance = () => {
  const [activeTab, setActiveTab] = useState("record");
  const { id, branchName } = useParams<{ id: string; branchName: string }>();
  const branchId = id || "";
  const [addClientDialogOpen, setAddClientDialogOpen] = useState(false);
  const [newBookingDialogOpen, setNewBookingDialogOpen] = useState(false);
  
  const { clients, carers } = useBookingData(branchId);
  const { data: services = [] } = useServices();
  
  const handleNewClient = () => setAddClientDialogOpen(true);
  const handleNewBooking = () => setNewBookingDialogOpen(true);
  const handleClientAdded = () => {};
  const handleCreateBooking = (bookingData: any) => {
    console.log("Creating new booking:", bookingData);
    setNewBookingDialogOpen(false);
  };

  return (
    <>
      <BranchLayout onNewClient={handleNewClient} onNewBooking={handleNewBooking}>
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-1">Attendance Management</h2>
        <p className="text-sm text-muted-foreground mb-4">Track staff attendance and manage leave requests</p>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid grid-cols-4 mb-6 w-full lg:w-auto">
            <TabsTrigger value="record" className="flex items-center gap-1">
              <span>Record Attendance</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-1">
              <span>Calendar View</span>
            </TabsTrigger>
            <TabsTrigger value="view" className="flex items-center gap-1">
              <span>List View</span>
            </TabsTrigger>
            <TabsTrigger value="leave" className="flex items-center gap-1">
              <span>Leave Management</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="record" className="space-y-6">
            <AttendanceForm branchId={id || ''} />
          </TabsContent>
          
          <TabsContent value="calendar" className="space-y-6">
            <AttendanceCalendarView branchId={id || ''} branchName={branchName || ''} />
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
    
    <AddClientDialog
      open={addClientDialogOpen}
      onOpenChange={setAddClientDialogOpen}
      branchId={branchId}
      onSuccess={handleClientAdded}
    />
    
    <NewBookingDialog
      open={newBookingDialogOpen}
      onOpenChange={setNewBookingDialogOpen}
      carers={carers}
      services={services}
      onCreateBooking={handleCreateBooking}
      branchId={branchId}
    />
  </>
  );
};

export default Attendance;