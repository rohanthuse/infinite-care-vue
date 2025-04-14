
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, PlusCircle, Calendar, Clock, FileCheck, Search, Filter, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CustomButton } from "@/components/ui/CustomButton";
import { SignedAgreements } from "./SignedAgreements";
import { ScheduledAgreements } from "./ScheduledAgreements";
import { AgreementTemplates } from "./AgreementTemplates";
import { SignAgreementDialog } from "./SignAgreementDialog";
import { ScheduleAgreementDialog } from "./ScheduleAgreementDialog";
import { CreateTemplateDialog } from "./CreateTemplateDialog";

interface BranchAgreementsTabProps {
  branchId: string;
  branchName: string;
}

export const BranchAgreementsTab: React.FC<BranchAgreementsTabProps> = ({ branchId, branchName }) => {
  const [activeTab, setActiveTab] = useState("signed");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <FileText className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">Agreements</h1>
              <p className="text-gray-500 text-sm md:text-base">
                Manage agreements for {decodeURIComponent(branchName)}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                className="pl-9 bg-white border-gray-200 focus:border-blue-300 w-full sm:w-64" 
                placeholder="Search agreements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <CustomButton 
              variant="pill" 
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
              onClick={() => setShowSignDialog(true)}
            >
              <PlusCircle className="mr-1.5 h-4 w-4" /> Sign New
            </CustomButton>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-gray-200">
            <TabsList className="bg-transparent border-b-0 px-4 pt-2">
              <TabsTrigger 
                value="signed" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none border-b-2 border-transparent px-4 pb-3"
              >
                <FileText className="mr-2 h-4 w-4" />
                Signed
              </TabsTrigger>
              <TabsTrigger 
                value="scheduled" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none border-b-2 border-transparent px-4 pb-3"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Scheduled
              </TabsTrigger>
              <TabsTrigger 
                value="templates" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none border-b-2 border-transparent px-4 pb-3"
              >
                <FileCheck className="mr-2 h-4 w-4" />
                Templates
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="border-b border-gray-200 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Filter className="h-4 w-4" />
              <div className="flex gap-2 flex-wrap">
                <select 
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-300"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="Employment Agreement">Employment Agreement</option>
                  <option value="Service Agreement">Service Agreement</option>
                  <option value="NDA">NDA</option>
                  <option value="Data Agreement">Data Agreement</option>
                </select>
                <select 
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-300"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="all">All Dates</option>
                  <option value="last7days">Last 7 Days</option>
                  <option value="last30days">Last 30 Days</option>
                  <option value="last90days">Last 90 Days</option>
                </select>
              </div>
            </div>
            
            <div className="flex flex-row gap-2">
              {activeTab === "signed" && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  onClick={() => setShowSignDialog(true)}
                >
                  <PlusCircle className="mr-1.5 h-4 w-4" /> Sign New
                </Button>
              )}
              
              {activeTab === "scheduled" && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  onClick={() => setShowScheduleDialog(true)}
                >
                  <Clock className="mr-1.5 h-4 w-4" /> Schedule New
                </Button>
              )}
              
              {activeTab === "templates" && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  onClick={() => setShowTemplateDialog(true)}
                >
                  <PlusCircle className="mr-1.5 h-4 w-4" /> New Template
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="sm"
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Download className="mr-1.5 h-4 w-4" /> Export
              </Button>
            </div>
          </div>

          <TabsContent value="signed" className="p-0 border-none">
            <SignedAgreements 
              searchQuery={debouncedSearchQuery}
              typeFilter={typeFilter}
              dateFilter={dateFilter}
              branchId={branchId}
            />
          </TabsContent>
          
          <TabsContent value="scheduled" className="p-0 border-none">
            <ScheduledAgreements
              searchQuery={debouncedSearchQuery}
              typeFilter={typeFilter}
              dateFilter={dateFilter}
              branchId={branchId}
            />
          </TabsContent>
          
          <TabsContent value="templates" className="p-0 border-none">
            <AgreementTemplates
              searchQuery={debouncedSearchQuery}
              typeFilter={typeFilter}
              branchId={branchId}
            />
          </TabsContent>
        </Tabs>
      </div>

      <SignAgreementDialog 
        open={showSignDialog} 
        onOpenChange={setShowSignDialog} 
        branchId={branchId}
      />
      
      <ScheduleAgreementDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        branchId={branchId}
      />
      
      <CreateTemplateDialog
        open={showTemplateDialog}
        onOpenChange={setShowTemplateDialog}
        branchId={branchId}
      />
    </div>
  );
};
