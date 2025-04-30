
import React from "react";
import { 
  User, Info, Calendar, FileText, FileCheck, 
  MessageCircle, AlertTriangle, Clock, Activity, 
  Wrench, Utensils, Bath, ShieldAlert, Clipboard, ClipboardCheck,
  FileBarChart2
} from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CarePlanTabBarProps {
  activeTab: string;
  onChange: (value: string) => void;
}

export const CarePlanTabBar: React.FC<CarePlanTabBarProps> = ({ activeTab, onChange }) => {
  return (
    <TabsList className="w-full justify-start overflow-x-auto mb-4">
      <TabsTrigger value="personal" className="flex items-center gap-1">
        <User className="h-4 w-4" />
        <span>Personal</span>
      </TabsTrigger>
      <TabsTrigger value="aboutme" className="flex items-center gap-1">
        <Info className="h-4 w-4" />
        <span>About Me</span>
      </TabsTrigger>
      <TabsTrigger value="goals" className="flex items-center gap-1">
        <FileCheck className="h-4 w-4" />
        <span>Goals</span>
      </TabsTrigger>
      <TabsTrigger value="activities" className="flex items-center gap-1">
        <Calendar className="h-4 w-4" />
        <span>Activities</span>
      </TabsTrigger>
      <TabsTrigger value="notes" className="flex items-center gap-1">
        <MessageCircle className="h-4 w-4" />
        <span>Notes</span>
      </TabsTrigger>
      <TabsTrigger value="documents" className="flex items-center gap-1">
        <FileText className="h-4 w-4" />
        <span>Documents</span>
      </TabsTrigger>
      <TabsTrigger value="assessments" className="flex items-center gap-1">
        <AlertTriangle className="h-4 w-4" />
        <span>Assessments</span>
      </TabsTrigger>
      <TabsTrigger value="equipment" className="flex items-center gap-1">
        <Wrench className="h-4 w-4" />
        <span>Equipment</span>
      </TabsTrigger>
      <TabsTrigger value="dietary" className="flex items-center gap-1">
        <Utensils className="h-4 w-4" />
        <span>Dietary</span>
      </TabsTrigger>
      <TabsTrigger value="personalcare" className="flex items-center gap-1">
        <Bath className="h-4 w-4" />
        <span>Personal Care</span>
      </TabsTrigger>
      <TabsTrigger value="risk" className="flex items-center gap-1">
        <ShieldAlert className="h-4 w-4" />
        <span>Risk</span>
      </TabsTrigger>
      <TabsTrigger value="serviceplan" className="flex items-center gap-1">
        <Clipboard className="h-4 w-4" />
        <span>Service Plan</span>
      </TabsTrigger>
      <TabsTrigger value="serviceactions" className="flex items-center gap-1">
        <ClipboardCheck className="h-4 w-4" />
        <span>Service Actions</span>
      </TabsTrigger>
      <TabsTrigger value="eventslogs" className="flex items-center gap-1">
        <FileBarChart2 className="h-4 w-4" />
        <span>Events & Logs</span>
      </TabsTrigger>
    </TabsList>
  );
};
