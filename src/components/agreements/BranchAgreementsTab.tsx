
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, PlusCircle, FileCheck, Search, Filter, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CustomButton } from "@/components/ui/CustomButton";
import { SignedAgreements } from "./SignedAgreements";
import { AgreementTemplates } from "./AgreementTemplates";
import { SignAgreementDialog } from "./SignAgreementDialog";
import { CreateTemplateDialog } from "./CreateTemplateDialog";
import { ApprovalStatusFilter } from "@/types/agreements";

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
  const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "Pending" | "Expired" | "Terminated">("all");
  const [approvalFilter, setApprovalFilter] = useState<ApprovalStatusFilter>("all");
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-card rounded-xl shadow-sm">
              <FileText className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Agreements</h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Manage agreements for {decodeURIComponent(branchName)}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                className="pl-9 bg-background border-border focus:border-primary w-full sm:w-64" 
                placeholder="Search agreements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <CustomButton 
              variant="pill" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
              onClick={() => setShowSignDialog(true)}
            >
              <PlusCircle className="mr-1.5 h-4 w-4" /> Sign New
            </CustomButton>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-border">
            <TabsList className="bg-transparent border-b-0 px-4 pt-2">
              <TabsTrigger 
                value="signed" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-4 pb-3"
              >
                <FileText className="mr-2 h-4 w-4" />
                Signed
              </TabsTrigger>
              <TabsTrigger 
                value="templates" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-4 pb-3"
              >
                <FileCheck className="mr-2 h-4 w-4" />
                Templates
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="border-b border-border p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <div className="flex gap-2 flex-wrap">
                <select 
                  className="px-3 py-1.5 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
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
                  className="px-3 py-1.5 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="all">All Dates</option>
                  <option value="last7days">Last 7 Days</option>
                  <option value="last30days">Last 30 Days</option>
                  <option value="last90days">Last 90 Days</option>
                </select>
                {activeTab === "signed" && (
                  <>
                    <select 
                      className="px-3 py-1.5 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="Pending">Pending Signatures</option>
                      <option value="Active">Active</option>
                      <option value="Expired">Expired</option>
                      <option value="Terminated">Terminated</option>
                    </select>
                    <select 
                      className="px-3 py-1.5 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      value={approvalFilter}
                      onChange={(e) => setApprovalFilter(e.target.value as typeof approvalFilter)}
                    >
                      <option value="all">All Approvals</option>
                      <option value="pending_review">Awaiting Review</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="archived">Archived</option>
                    </select>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex flex-row gap-2">
              {activeTab === "signed" && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-primary border-border hover:bg-accent"
                  onClick={() => setShowSignDialog(true)}
                >
                  <PlusCircle className="mr-1.5 h-4 w-4" /> Sign New
                </Button>
              )}
              
              {activeTab === "templates" && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-primary border-border hover:bg-accent"
                  onClick={() => setShowTemplateDialog(true)}
                >
                  <PlusCircle className="mr-1.5 h-4 w-4" /> New Template
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="sm"
                className="text-primary border-border hover:bg-accent"
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
              statusFilter={statusFilter}
              approvalFilter={approvalFilter}
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
      
      <CreateTemplateDialog
        open={showTemplateDialog}
        onOpenChange={setShowTemplateDialog}
        branchId={branchId}
      />
    </div>
  );
};
