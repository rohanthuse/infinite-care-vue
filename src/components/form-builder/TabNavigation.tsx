
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

const tabActiveClasses = "flex items-center gap-1 data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-md hover:bg-green-100 hover:text-green-700 transition-all";

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
            <TabsTrigger value="naming" className={tabActiveClasses}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1">
                    <Type className="h-4 w-4" />
                    <span className="hidden md:inline">Naming</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent className="md:hidden">
                  <p>Form Naming</p>
                </TooltipContent>
              </Tooltip>
            </TabsTrigger>
            
            <TabsTrigger value="design" className={tabActiveClasses}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span className="hidden md:inline">Design</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent className="md:hidden">
                  <p>Design Form Fields</p>
                </TooltipContent>
              </Tooltip>
            </TabsTrigger>
            
            <TabsTrigger value="validation" className={tabActiveClasses}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="hidden md:inline">Validation</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent className="md:hidden">
                  <p>Form Validation Rules</p>
                </TooltipContent>
              </Tooltip>
            </TabsTrigger>
            
            <TabsTrigger value="preview" className={tabActiveClasses}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span className="hidden md:inline">Preview</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent className="md:hidden">
                  <p>Preview Form</p>
                </TooltipContent>
              </Tooltip>
            </TabsTrigger>
            
            <TabsTrigger value="advanced" className={tabActiveClasses}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1">
                    <Settings className="h-4 w-4" />
                    <span className="hidden md:inline">Advanced</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent className="md:hidden">
                  <p>Advanced Settings</p>
                </TooltipContent>
              </Tooltip>
            </TabsTrigger>
            
            <TabsTrigger value="publish" className={tabActiveClasses}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1">
                    <Upload className="h-4 w-4" />
                    <span className="hidden md:inline">Publish</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent className="md:hidden">
                  <p>Publish Form</p>
                </TooltipContent>
              </Tooltip>
            </TabsTrigger>
            
            <TabsTrigger value="submissions" className={tabActiveClasses}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1">
                    <Inbox className="h-4 w-4" />
                    <span className="hidden md:inline">Submissions</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent className="md:hidden">
                  <p>View Form Submissions</p>
                </TooltipContent>
              </Tooltip>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </TooltipProvider>
    </div>
  );
};
