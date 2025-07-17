
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  PlusCircle, 
  Download, 
  FileText, 
  Clock, 
  DollarSign, 
  Car, 
  Percent,
  Receipt
} from "lucide-react";
import InvoicesPaymentsTab from "./InvoicesPaymentsTab";
import ExtraTimeTab from "./ExtraTimeTab";
import ExpensesTab from "./ExpensesTab";
import TravelTab from "./TravelTab";
import PayrollTab from "./PayrollTab";
import RateManagementTab from "./RateManagementTab";

interface AccountingTabProps {
  branchId?: string;
  branchName?: string;
}

const AccountingTab: React.FC<AccountingTabProps> = ({ branchId, branchName }) => {
  const [activeTab, setActiveTab] = useState("invoices-payments");

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Accounting</h1>
            <p className="text-gray-500 mt-1">Manage financial operations for {branchName}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
            <Button variant="default" size="sm" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="h-4 w-4" />
              <span>New Record</span>
            </Button>
          </div>
        </div>
        
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="bg-gray-100 p-1 rounded-lg w-full md:w-auto grid grid-cols-3 md:grid-cols-6 mb-6">
            <TabsTrigger 
              value="invoices-payments" 
              className="flex items-center gap-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Receipt className="h-4 w-4" />
              <span>Invoices & Payments</span>
            </TabsTrigger>
            <TabsTrigger 
              value="extra-time" 
              className="flex items-center gap-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Clock className="h-4 w-4" />
              <span>Extra Time</span>
            </TabsTrigger>
            <TabsTrigger 
              value="expenses" 
              className="flex items-center gap-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <FileText className="h-4 w-4" />
              <span>Expenses</span>
            </TabsTrigger>
            <TabsTrigger 
              value="travel" 
              className="flex items-center gap-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Car className="h-4 w-4" />
              <span>Travel & Mileage</span>
            </TabsTrigger>
            <TabsTrigger 
              value="payroll" 
              className="flex items-center gap-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <DollarSign className="h-4 w-4" />
              <span>Payroll</span>
            </TabsTrigger>
            <TabsTrigger 
              value="rates" 
              className="flex items-center gap-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Percent className="h-4 w-4" />
              <span>Rate Management</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="invoices-payments" className="mt-0">
            <InvoicesPaymentsTab branchId={branchId} branchName={branchName} />
          </TabsContent>
          
          <TabsContent value="extra-time" className="mt-0">
            <ExtraTimeTab branchId={branchId} branchName={branchName} />
          </TabsContent>
          
          <TabsContent value="expenses" className="mt-0">
            <ExpensesTab branchId={branchId} branchName={branchName} />
          </TabsContent>
          
          <TabsContent value="travel" className="mt-0">
            <TravelTab branchId={branchId} branchName={branchName} />
          </TabsContent>
          
          <TabsContent value="payroll" className="mt-0">
            <PayrollTab branchId={branchId} branchName={branchName} />
          </TabsContent>
          
          <TabsContent value="rates" className="mt-0">
            <RateManagementTab branchId={branchId} branchName={branchName} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AccountingTab;
