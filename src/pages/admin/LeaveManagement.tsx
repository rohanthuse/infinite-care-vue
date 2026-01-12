import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users } from "lucide-react";
import { useParams } from "react-router-dom";
import LeaveRequestsList from "@/components/leave/LeaveRequestsList";
import AnnualLeaveManager from "@/components/leave/AnnualLeaveManager";
import LeaveRequestForm from "@/components/leave/LeaveRequestForm";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

const LeaveManagement: React.FC = () => {
  const { branchId } = useParams<{ branchId: string }>();
  const { user } = useAuth();
  const { data: userRole } = useUserRole();
  
  const isAdmin = userRole?.role === 'super_admin' || userRole?.role === 'branch_admin';
  const isSuperAdmin = userRole?.role === 'super_admin';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-muted-foreground">
            Manage staff leave requests and annual leave calendar
          </p>
        </div>
      </div>

      <Tabs defaultValue="requests" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Leave Requests
          </TabsTrigger>
          {!isAdmin && (
            <TabsTrigger value="request-leave" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Request Leave
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="annual-leave" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Annual Leave
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="requests" className="space-y-6">
          <div className="grid gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Leave Requests</h2>
              <LeaveRequestsList branchId={branchId || ''} />
            </div>
          </div>
        </TabsContent>

        {!isAdmin && (
          <TabsContent value="request-leave" className="space-y-6">
            <div className="grid gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Request Leave</h2>
                <LeaveRequestForm 
                  staffId={user?.id || ''} 
                  branchId={branchId || ''} 
                />
              </div>
            </div>
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="annual-leave" className="space-y-6">
            <div className="grid gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Branch Annual Leave</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage annual leave dates that apply to this branch only.
                </p>
                <AnnualLeaveManager branchId={branchId} />
              </div>
            </div>
          </TabsContent>
        )}

      </Tabs>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +2 from last week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff on Leave Today</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              15% of total staff
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Holidays</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              In next 30 days
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeaveManagement;