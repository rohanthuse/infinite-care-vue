
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Eye, Upload, ShieldCheck, Settings, Inbox } from 'lucide-react';

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
      
      <Tabs value={activeTab} onValueChange={onTabChange} className="mt-2">
        <TabsList className="grid grid-cols-6 mb-6 w-full lg:w-auto">
          <TabsTrigger value="design" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span className="hidden md:inline">Design</span>
          </TabsTrigger>
          <TabsTrigger value="validation" className="flex items-center gap-1">
            <ShieldCheck className="h-4 w-4" />
            <span className="hidden md:inline">Validation</span>
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span className="hidden md:inline">Preview</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-1">
            <Settings className="h-4 w-4" />
            <span className="hidden md:inline">Advanced</span>
          </TabsTrigger>
          <TabsTrigger value="submissions" className="flex items-center gap-1">
            <Inbox className="h-4 w-4" />
            <span className="hidden md:inline">Submissions</span>
          </TabsTrigger>
          <TabsTrigger value="publish" className="flex items-center gap-1">
            <Upload className="h-4 w-4" />
            <span className="hidden md:inline">Publish</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};
