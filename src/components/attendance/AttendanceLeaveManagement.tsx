import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, Users, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { LeaveRequestForm } from "./LeaveRequestForm";
import { LeaveRequestsList } from "./LeaveRequestsList";
import { AnnualLeaveManager } from "./AnnualLeaveManager";
import { useLeaveRequests, useAnnualLeave, useLeaveStatus } from "@/hooks/useLeaveManagement";
import { format, startOfMonth, endOfMonth } from "date-fns";

interface AttendanceLeaveManagementProps {
  branchId: string;
}

export function AttendanceLeaveManagement({ branchId }: AttendanceLeaveManagementProps) {
  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const [activeTab, setActiveTab] = useState("overview");

  // Get current month's leave data for overview
  const currentDate = new Date();
  const monthStart = format(startOfMonth(currentDate), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(currentDate), 'yyyy-MM-dd');

  const { data: leaveRequests = [] } = useLeaveRequests(branchId);
  const { data: annualLeave = [] } = useAnnualLeave(branchId);
  const { data: leaveStatus } = useLeaveStatus(branchId, monthStart, monthEnd);

  // Set default tab based on user role
  useEffect(() => {
    if (userRole?.role === 'carer') {
      setActiveTab("request");
    } else if (userRole?.role === 'branch_admin') {
      setActiveTab("approve");
    } else if (userRole?.role === 'super_admin') {
      setActiveTab("overview");
    }
  }, [userRole]);

  if (roleLoading) {
    return (
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading leave management...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate statistics
  const pendingRequests = leaveRequests.filter(r => r.status === 'pending').length;
  const approvedRequests = leaveRequests.filter(r => r.status === 'approved').length;
  const todaysHolidays = annualLeave.filter(h => 
    format(new Date(h.leave_date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  ).length;
  const currentMonthStaffOnLeave = leaveStatus?.staffLeave?.length || 0;

  const Overview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Pending Requests</p>
                <p className="text-2xl font-bold text-orange-700">{pendingRequests}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Approved This Month</p>
                <p className="text-2xl font-bold text-green-700">{approvedRequests}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Staff On Leave</p>
                <p className="text-2xl font-bold text-blue-700">{currentMonthStaffOnLeave}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Holidays Today</p>
                <p className="text-2xl font-bold text-purple-700">{todaysHolidays}</p>
              </div>
              <CalendarDays className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leave Requests */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Leave Requests
            </h3>
            <div className="space-y-3">
              {leaveRequests.slice(0, 5).map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{request.staff_name}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(request.start_date), 'MMM dd')} - {format(new Date(request.end_date), 'MMM dd')}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">{request.leave_type}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      request.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                      request.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                      request.status === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                      'bg-gray-50 text-gray-700 border-gray-200'
                    }
                  >
                    {request.status}
                  </Badge>
                </div>
              ))}
              {leaveRequests.length === 0 && (
                <p className="text-gray-500 text-center py-4">No leave requests found</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Holidays */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Upcoming Holidays
            </h3>
            <div className="space-y-3">
              {annualLeave.slice(0, 5).map((holiday) => (
                <div key={holiday.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{holiday.leave_name}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(holiday.leave_date), 'EEEE, MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              ))}
              {annualLeave.length === 0 && (
                <p className="text-gray-500 text-center py-4">No holidays scheduled</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const getTabsForRole = () => {
    const tabs = [
      { value: "overview", label: "Overview", component: <Overview /> }
    ];

    if (userRole?.role === 'carer') {
      tabs.push({ value: "request", label: "Request Leave", component: <LeaveRequestForm branchId={branchId} /> });
    }

    if (userRole?.role === 'branch_admin' || userRole?.role === 'super_admin') {
      tabs.push({ value: "approve", label: "Approve Requests", component: <LeaveRequestsList branchId={branchId} /> });
    }

    if (userRole?.role === 'branch_admin' || userRole?.role === 'super_admin') {
      tabs.push({ value: "holidays", label: "Manage Holidays", component: <AnnualLeaveManager branchId={branchId} /> });
    }

    return tabs;
  };

  const availableTabs = getTabsForRole();

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardContent className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            Leave Management
          </h3>
          <p className="text-gray-500 mt-1">
            {userRole?.role === 'carer' ? 'Submit and track your leave requests' :
             userRole?.role === 'branch_admin' ? 'Approve leave requests and manage staff availability' :
             'Manage all leave requests, holidays, and staff availability'}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${availableTabs.length}, minmax(0, 1fr))` }}>
            {availableTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {availableTabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-6">
              {tab.component}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}