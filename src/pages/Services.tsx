import React, { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { ServicesTable } from "@/components/ServicesTable";
import { motion } from "framer-motion";
import { Briefcase, Plus, Search, Filter, Download, Library } from "lucide-react";
import { CustomButton } from "@/components/ui/CustomButton";
import { Input } from "@/components/ui/input";
import { AddServiceDialog } from "@/components/AddServiceDialog";
import { AdoptSystemTemplatesDialog } from "@/components/system-templates/AdoptSystemTemplatesDialog";
import { useAvailableSystemServices, useAdoptedTemplates, useAdoptSystemServices } from "@/hooks/useAdoptSystemTemplates";

const Services = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showAddServiceDialog, setShowAddServiceDialog] = useState(false);
  const [showAdoptDialog, setShowAdoptDialog] = useState(false);
  
  const { data: systemServices = [], isLoading: isLoadingSystem } = useAvailableSystemServices();
  const { data: adoptedIds = [] } = useAdoptedTemplates('services');
  const { mutate: adoptServices, isPending: isAdopting } = useAdoptSystemServices();
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  const handleFilterChange = (category: string | null) => {
    setFilterCategory(category);
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
                <Briefcase className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Services</h1>
                <p className="text-muted-foreground text-sm md:text-base">Manage client service offerings</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  className="pl-9 bg-card border-border focus:border-primary w-full sm:w-64" 
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              
              <CustomButton 
                variant="outline" 
                className="border-border hover:bg-accent"
                onClick={() => setShowAdoptDialog(true)}
              >
                <Library className="mr-1.5 h-4 w-4" /> Import from System
              </CustomButton>
              
              <CustomButton 
                variant="pill" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
                onClick={() => setShowAddServiceDialog(true)}
              >
                <Plus className="mr-1.5 h-4 w-4" /> Add Service
              </CustomButton>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="border-b border-border p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <div className="flex gap-2 flex-wrap">
                <select 
                  className="px-3 py-1.5 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  value={filterCategory || ""}
                  onChange={(e) => handleFilterChange(e.target.value || null)}
                >
                  <option value="">All Categories</option>
                  <option value="Daily Support">Daily Support</option>
                  <option value="Medical">Medical</option>
                  <option value="Mobility">Mobility</option>
                  <option value="Family Support">Family Support</option>
                  <option value="Mental Wellbeing">Mental Wellbeing</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Overnight">Overnight</option>
                  <option value="Specialized Care">Specialized Care</option>
                  <option value="Physical Support">Physical Support</option>
                  <option value="Long-term Support">Long-term Support</option>
                </select>
                {filterCategory !== null && (
                  <button 
                    className="px-3 py-1.5 bg-card border border-border rounded-md text-sm hover:bg-accent focus:outline-none focus:ring-1 focus:ring-primary"
                    onClick={() => handleFilterChange(null)}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
            
            <CustomButton 
              variant="outline" 
              size="sm"
              className="text-muted-foreground border-border hover:bg-accent"
            >
              <Download className="mr-1.5 h-4 w-4" /> Export
            </CustomButton>
          </div>
          
          <ServicesTable 
            searchQuery={debouncedSearchQuery} 
            filterCategory={filterCategory} 
          />
        </div>
        
        <AddServiceDialog 
          isOpen={showAddServiceDialog}
          onClose={() => setShowAddServiceDialog(false)}
        />
        
        <AdoptSystemTemplatesDialog
          isOpen={showAdoptDialog}
          onClose={() => setShowAdoptDialog(false)}
          title="Import Services from System Templates"
          description="Select system services to add to your organization. These will be copied as your own services that you can customize."
          templates={systemServices}
          adoptedIds={adoptedIds}
          isLoading={isLoadingSystem}
          isAdopting={isAdopting}
          onAdopt={(templates) => {
            adoptServices(templates as any);
            setShowAdoptDialog(false);
          }}
          displayField="title"
        />
      </motion.main>
    </div>
  );
};

export default Services;
