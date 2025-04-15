
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientReports } from "./ClientReports";
import { StaffReports } from "./StaffReports";
import { ServiceReports } from "./ServiceReports";
import { FinancialReports } from "./FinancialReports";
import { OperationalReports } from "./OperationalReports";
import { ComplianceReports } from "./ComplianceReports";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ReportsHeader } from "./ReportsHeader";

interface ReportsContentProps {
  branchId: string;
  branchName: string;
}

export function ReportsContent({ branchId, branchName }: ReportsContentProps) {
  const [activeTab, setActiveTab] = useState<string>("client");
  
  return (
    <div className="space-y-4">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-bold">Reports</CardTitle>
          <CardDescription>
            Generate and analyze reports across various categories
          </CardDescription>
        </CardHeader>
      </Card>

      <ReportsHeader />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
          <TabsList className="flex min-w-max md:grid md:grid-cols-3 lg:grid-cols-6 gap-2">
            <TabsTrigger value="client" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              Client Reports
            </TabsTrigger>
            <TabsTrigger value="staff" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              Staff Reports
            </TabsTrigger>
            <TabsTrigger value="service" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              Service Reports
            </TabsTrigger>
            <TabsTrigger value="financial" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              Financial Reports
            </TabsTrigger>
            <TabsTrigger value="operational" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              Operational Reports
            </TabsTrigger>
            <TabsTrigger value="compliance" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              Compliance Reports
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="client" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <ClientReports branchId={branchId} branchName={branchName} />
        </TabsContent>
        
        <TabsContent value="staff" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <StaffReports branchId={branchId} branchName={branchName} />
        </TabsContent>
        
        <TabsContent value="service" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <ServiceReports branchId={branchId} branchName={branchName} />
        </TabsContent>
        
        <TabsContent value="financial" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <FinancialReports branchId={branchId} branchName={branchName} />
        </TabsContent>
        
        <TabsContent value="operational" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <OperationalReports branchId={branchId} branchName={branchName} />
        </TabsContent>
        
        <TabsContent value="compliance" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <ComplianceReports branchId={branchId} branchName={branchName} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
