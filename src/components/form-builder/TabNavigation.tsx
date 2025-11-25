
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FileText, Eye, Upload, ShieldCheck, Settings, Inbox, Type } from 'lucide-react';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  title: string;
  subtitle: string;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ 
  activeTab, 
  onTabChange,
  title,
  subtitle
}) => {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold mb-1">{title}</h2>
      <p className="text-sm text-gray-500 mb-4">{subtitle}</p>
      
      <TooltipProvider>
        <Tabs value={activeTab} onValueChange={onTabChange} className="mt-2">
          <TabsList className="grid grid-cols-7 mb-6 w-full lg:w-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="naming" className="flex items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm hover:bg-primary/10 hover:text-primary transition-all">
                  <Type className="h-4 w-4" />
                  <span className="hidden md:inline">Naming</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="md:hidden">
                <p>Form Naming</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="design" className="flex items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm hover:bg-primary/10 hover:text-primary transition-all">
                  <FileText className="h-4 w-4" />
                  <span className="hidden md:inline">Design</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="md:hidden">
                <p>Design Form Fields</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="validation" className="flex items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm hover:bg-primary/10 hover:text-primary transition-all">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="hidden md:inline">Validation</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="md:hidden">
                <p>Form Validation Rules</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="preview" className="flex items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm hover:bg-primary/10 hover:text-primary transition-all">
                  <Eye className="h-4 w-4" />
                  <span className="hidden md:inline">Preview</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="md:hidden">
                <p>Preview Form</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="advanced" className="flex items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm hover:bg-primary/10 hover:text-primary transition-all">
                  <Settings className="h-4 w-4" />
                  <span className="hidden md:inline">Advanced</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="md:hidden">
                <p>Advanced Settings</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="publish" className="flex items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm hover:bg-primary/10 hover:text-primary transition-all">
                  <Upload className="h-4 w-4" />
                  <span className="hidden md:inline">Publish</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="md:hidden">
                <p>Publish Form</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="submissions" className="flex items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm hover:bg-primary/10 hover:text-primary transition-all">
                  <Inbox className="h-4 w-4" />
                  <span className="hidden md:inline">Submissions</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="md:hidden">
                <p>View Form Submissions</p>
              </TooltipContent>
            </Tooltip>
          </TabsList>
        </Tabs>
      </TooltipProvider>
    </div>
  );
};
