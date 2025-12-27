
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  FileText, 
  Clock, 
  PoundSterling, 
  Car, 
  Percent,
  Receipt
} from "lucide-react";
import { useBranchDashboardNavigation } from "@/hooks/useBranchDashboardNavigation";
import InvoicesPaymentsTab from "./InvoicesPaymentsTab";
import ExtraTimeTab from "./ExtraTimeTab";
import ExpensesTab from "./ExpensesTab";
import TravelTab from "./TravelTab";
import PayrollTab from "./PayrollTab";
import RateManagementTab from "./RateManagementTab";

const AccountingTab: React.FC = () => {
  const { id: branchId, branchName } = useBranchDashboardNavigation();
  const [activeTab, setActiveTab] = useState("invoices-payments");
  const [isExporting, setIsExporting] = useState(false);

  const displayBranchName = branchName ? decodeURIComponent(branchName) : "Med-Infinite Branch";

  const getExportButtonText = () => {
    switch (activeTab) {
      case "invoices-payments": return "Export Invoices";
      case "extra-time": return "Export Extra Time";
      case "expenses": return "Export Expenses";
      case "travel": return "Export Travel";
      case "payroll": return "Export Payroll";
      case "rates": return "Export Rates";
      default: return "Export";
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Dispatch a custom event that the active tab can listen to
      const exportEvent = new CustomEvent('accounting-export', {
        detail: { tabName: activeTab }
      });
      window.dispatchEvent(exportEvent);
      
      // Show feedback to user
      setTimeout(() => {
        setIsExporting(false);
      }, 1000); // Give some time for the export to process
    } catch (error) {
      console.error('Export error:', error);
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-6">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Accounting</h1>
            <p className="text-muted-foreground mt-1">Manage financial operations for {branchName}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={handleExport}
              disabled={isExporting}
            >
              <Download className="h-4 w-4" />
              <span>{isExporting ? "Exporting..." : getExportButtonText()}</span>
            </Button>
          </div>
        </div>
        
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="bg-muted p-1 rounded-lg w-full md:w-auto grid grid-cols-3 md:grid-cols-6 mb-6">
            <TabsTrigger 
              value="invoices-payments" 
              className="flex items-center gap-2 rounded-md data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <Receipt className="h-4 w-4" />
              <span>Invoices & Payments</span>
            </TabsTrigger>
            <TabsTrigger 
              value="extra-time" 
              className="flex items-center gap-2 rounded-md data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <Clock className="h-4 w-4" />
              <span>Extra Time</span>
            </TabsTrigger>
            <TabsTrigger 
              value="expenses" 
              className="flex items-center gap-2 rounded-md data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <FileText className="h-4 w-4" />
              <span>Expenses</span>
            </TabsTrigger>
            <TabsTrigger 
              value="travel" 
              className="flex items-center gap-2 rounded-md data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <Car className="h-4 w-4" />
              <span>Travel & Mileage</span>
            </TabsTrigger>
            <TabsTrigger 
              value="payroll" 
              className="flex items-center gap-2 rounded-md data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <PoundSterling className="h-4 w-4" />
              <span>Payroll</span>
            </TabsTrigger>
            <TabsTrigger 
              value="rates" 
              className="flex items-center gap-2 rounded-md data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <Percent className="h-4 w-4" />
              <span>Rate Management</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="invoices-payments" className="mt-0">
            <InvoicesPaymentsTab branchId={branchId} branchName={displayBranchName} />
          </TabsContent>
          
          <TabsContent value="extra-time" className="mt-0">
            <ExtraTimeTab branchId={branchId} branchName={displayBranchName} />
          </TabsContent>
          
          <TabsContent value="expenses" className="mt-0">
            <ExpensesTab branchId={branchId} branchName={displayBranchName} />
          </TabsContent>
          
          <TabsContent value="travel" className="mt-0">
            <TravelTab branchId={branchId} branchName={displayBranchName} />
          </TabsContent>
          
          <TabsContent value="payroll" className="mt-0">
            <PayrollTab branchId={branchId} branchName={displayBranchName} />
          </TabsContent>
          
          <TabsContent value="rates" className="mt-0">
            <RateManagementTab branchId={branchId} branchName={displayBranchName} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AccountingTab;
