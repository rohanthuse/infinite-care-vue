
import React from "react";
import { 
  User, Info, Calendar, FileText, 
  MessageCircle, Clock, Activity, 
  Utensils, Bath, Clipboard, ClipboardCheck,
  FileBarChart2, CheckSquare
} from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CarerCarePlanTabBarProps {
  activeTab: string;
  onChange: (value: string) => void;
}

export const CarerCarePlanTabBar: React.FC<CarerCarePlanTabBarProps> = ({ activeTab, onChange }) => {
  return (
    <TabsList className="w-full justify-start overflow-x-auto mb-4">
      <TabsTrigger 
        value="personal" 
        onClick={() => onChange("personal")}
        className={`flex items-center gap-1 ${activeTab === "personal" ? "data-[state=active]:bg-blue-600 data-[state=active]:text-white" : ""}`}
      >
        <User className="h-4 w-4" />
        <span>Personal</span>
      </TabsTrigger>
      <TabsTrigger 
        value="aboutme" 
        onClick={() => onChange("aboutme")}
        className={`flex items-center gap-1 ${activeTab === "aboutme" ? "data-[state=active]:bg-blue-600 data-[state=active]:text-white" : ""}`}
      >
        <Info className="h-4 w-4" />
        <span>About Me</span>
      </TabsTrigger>
      <TabsTrigger 
        value="goals" 
        onClick={() => onChange("goals")}
        className={`flex items-center gap-1 ${activeTab === "goals" ? "data-[state=active]:bg-blue-600 data-[state=active]:text-white" : ""}`}
      >
        <Activity className="h-4 w-4" />
        <span>Goals</span>
      </TabsTrigger>
      <TabsTrigger 
        value="activities" 
        onClick={() => onChange("activities")}
        className={`flex items-center gap-1 ${activeTab === "activities" ? "data-[state=active]:bg-blue-600 data-[state=active]:text-white" : ""}`}
      >
        <Calendar className="h-4 w-4" />
        <span>Activities</span>
      </TabsTrigger>
      <TabsTrigger 
        value="notes" 
        onClick={() => onChange("notes")}
        className={`flex items-center gap-1 ${activeTab === "notes" ? "data-[state=active]:bg-blue-600 data-[state=active]:text-white" : ""}`}
      >
        <MessageCircle className="h-4 w-4" />
        <span>Notes</span>
      </TabsTrigger>
      <TabsTrigger 
        value="dietary" 
        onClick={() => onChange("dietary")}
        className={`flex items-center gap-1 ${activeTab === "dietary" ? "data-[state=active]:bg-blue-600 data-[state=active]:text-white" : ""}`}
      >
        <Utensils className="h-4 w-4" />
        <span>Dietary</span>
      </TabsTrigger>
      <TabsTrigger 
        value="personalcare" 
        onClick={() => onChange("personalcare")}
        className={`flex items-center gap-1 ${activeTab === "personalcare" ? "data-[state=active]:bg-blue-600 data-[state=active]:text-white" : ""}`}
      >
        <Bath className="h-4 w-4" />
        <span>Personal Care</span>
      </TabsTrigger>
      <TabsTrigger 
        value="serviceplan" 
        onClick={() => onChange("serviceplan")}
        className={`flex items-center gap-1 ${activeTab === "serviceplan" ? "data-[state=active]:bg-blue-600 data-[state=active]:text-white" : ""}`}
      >
        <Clipboard className="h-4 w-4" />
        <span>Service Plan</span>
      </TabsTrigger>
      <TabsTrigger 
        value="serviceactions" 
        onClick={() => onChange("serviceactions")}
        className={`flex items-center gap-1 ${activeTab === "serviceactions" ? "data-[state=active]:bg-blue-600 data-[state=active]:text-white" : ""}`}
      >
        <ClipboardCheck className="h-4 w-4" />
        <span>Service Actions</span>
      </TabsTrigger>
      <TabsTrigger 
        value="tasks" 
        onClick={() => onChange("tasks")}
        className={`flex items-center gap-1 ${activeTab === "tasks" ? "data-[state=active]:bg-blue-600 data-[state=active]:text-white" : ""}`}
      >
        <CheckSquare className="h-4 w-4" />
        <span>Tasks</span>
      </TabsTrigger>
      <TabsTrigger 
        value="eventslogs" 
        onClick={() => onChange("eventslogs")}
        className={`flex items-center gap-1 ${activeTab === "eventslogs" ? "data-[state=active]:bg-blue-600 data-[state=active]:text-white" : ""}`}
      >
        <FileBarChart2 className="h-4 w-4" />
        <span>Events & Logs</span>
      </TabsTrigger>
    </TabsList>
  );
};
