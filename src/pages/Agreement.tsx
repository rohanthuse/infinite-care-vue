
import React, { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { SignedAgreements } from "@/components/agreements/SignedAgreements";
import { ExpiringAgreementsBanner } from "@/components/agreements/ExpiringAgreementsBanner";
import { 
  FileText, 
  Filter, 
  Search, 
  FileSignature, 
  CalendarPlus, 
  PlusCircle 
} from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { CustomButton } from "@/components/ui/CustomButton";
import { toast } from "sonner";
import { useAgreementTypes } from "@/data/hooks/agreements";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScheduledAgreements } from "@/components/agreements/ScheduledAgreements";
import { AgreementTemplates } from "@/components/agreements/AgreementTemplates";
import { SignAgreementDialog } from "@/components/agreements/SignAgreementDialog";
import { ScheduleAgreementDialog } from "@/components/agreements/ScheduleAgreementDialog";
import { CreateTemplateDialog } from "@/components/agreements/CreateTemplateDialog";

const Agreement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("signed");
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showCreateTemplateDialog, setShowCreateTemplateDialog] = useState(false);
  
  const { data: agreementTypes } = useAgreementTypes();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  const handleDownloadAll = () => {
    toast.info("This feature is not yet implemented.");
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader />
      <DashboardNavbar />
      
      <motion.main 
        className="flex-1 px-4 md:px-8 py-6 md:py-8 w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="bg-muted/50 rounded-2xl p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-card rounded-xl shadow-sm">
                <FileText className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Agreements</h1>
                <p className="text-muted-foreground text-sm md:text-base">Manage all company agreements</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  className="pl-9 bg-card border-border focus:border-primary w-full sm:w-auto" 
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <CustomButton
                variant="pill"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
                onClick={() => setShowSignDialog(true)}
              >
                <FileSignature className="mr-1.5 h-4 w-4" /> Sign Agreement
              </CustomButton>
              <CustomButton
                variant="pill"
                className="bg-card hover:bg-accent text-foreground border border-border"
                onClick={() => setShowScheduleDialog(true)}
              >
                <CalendarPlus className="mr-1.5 h-4 w-4" /> Schedule
              </CustomButton>
              <CustomButton
                variant="pill"
                className="bg-card hover:bg-accent text-foreground border border-border"
                onClick={() => setShowCreateTemplateDialog(true)}
              >
                <PlusCircle className="mr-1.5 h-4 w-4" /> New Template
              </CustomButton>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-border p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <TabsList className="grid w-full grid-cols-3 sm:w-auto">
                <TabsTrigger value="signed">Signed</TabsTrigger>
                <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
              </TabsList>
            
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                <div className="flex gap-2 flex-wrap">
                  <select 
                    className="px-3 py-1.5 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    {agreementTypes?.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
                  </select>
                  <select 
                    className="px-3 py-1.5 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
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
            </div>

            <ExpiringAgreementsBanner isOrganizationLevel={true} />

            <TabsContent value="signed" className="focus-visible:ring-0">
              <SignedAgreements
                searchQuery={debouncedSearchQuery} 
                typeFilter={typeFilter} 
                dateFilter={dateFilter}
                isOrganizationLevel={true}
              />
            </TabsContent>
            
            <TabsContent value="scheduled" className="focus-visible:ring-0">
              <ScheduledAgreements 
                searchQuery={debouncedSearchQuery} 
                typeFilter={typeFilter} 
                dateFilter={dateFilter}
                isOrganizationLevel={true}
              />
            </TabsContent>

            <TabsContent value="templates" className="focus-visible:ring-0">
              <AgreementTemplates
                searchQuery={debouncedSearchQuery}
                typeFilter={typeFilter}
                isOrganizationLevel={true}
              />
            </TabsContent>
          </Tabs>
        </div>
      </motion.main>
      
      <SignAgreementDialog open={showSignDialog} onOpenChange={setShowSignDialog} isOrganizationLevel={true} />
      <ScheduleAgreementDialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog} isOrganizationLevel={true} />
      <CreateTemplateDialog open={showCreateTemplateDialog} onOpenChange={setShowCreateTemplateDialog} isOrganizationLevel={true} />
    </div>
  );
};

export default Agreement;
