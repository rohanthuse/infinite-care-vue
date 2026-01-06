
import React from "react";
import { 
  User, Info, Calendar, FileText, FileCheck, 
  MessageCircle, AlertTriangle, Clock, Activity, 
  Wrench, Utensils, Bath, ShieldAlert, Clipboard, ClipboardCheck,
  FileBarChart2, FormInput, Stethoscope, Pill, Users, CheckSquare
} from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CarePlanTabBarProps {
  activeTab: string;
  onChange: (value: string) => void;
}

export const CarePlanTabBar: React.FC<CarePlanTabBarProps> = ({ activeTab, onChange }) => {
  return (
    <TabsList className="w-full justify-start overflow-x-auto mb-4">
      <TabsTrigger 
        value="personal" 
        onClick={() => onChange("personal")}
        className={`flex items-center gap-1 ${activeTab === "personal" ? "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700" : ""}`}
      >
        <User className="h-4 w-4" />
        <span>Personal</span>
      </TabsTrigger>
      <TabsTrigger 
        value="aboutme" 
        onClick={() => onChange("aboutme")}
        className={`flex items-center gap-1 ${activeTab === "aboutme" ? "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700" : ""}`}
      >
        <Info className="h-4 w-4" />
        <span>About Me</span>
      </TabsTrigger>
      <TabsTrigger 
        value="diagnosis" 
        onClick={() => onChange("diagnosis")}
        className={`flex items-center gap-1 ${activeTab === "diagnosis" ? "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700" : ""}`}
      >
        <Stethoscope className="h-4 w-4" />
        <span>Diagnosis</span>
      </TabsTrigger>
      <TabsTrigger 
        value="medication" 
        onClick={() => onChange("medication")}
        className={`flex items-center gap-1 ${activeTab === "medication" ? "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700" : ""}`}
      >
        <Pill className="h-4 w-4" />
        <span>Medication</span>
      </TabsTrigger>
      <TabsTrigger 
        value="goals" 
        onClick={() => onChange("goals")}
        className={`flex items-center gap-1 ${activeTab === "goals" ? "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700" : ""}`}
      >
        <FileCheck className="h-4 w-4" />
        <span>Goals</span>
      </TabsTrigger>
      <TabsTrigger 
        value="activities" 
        onClick={() => onChange("activities")}
        className={`flex items-center gap-1 ${activeTab === "activities" ? "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700" : ""}`}
      >
        <Calendar className="h-4 w-4" />
        <span>Activities</span>
      </TabsTrigger>
      <TabsTrigger 
        value="notes" 
        onClick={() => onChange("notes")}
        className={`flex items-center gap-1 ${activeTab === "notes" ? "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700" : ""}`}
      >
        <MessageCircle className="h-4 w-4" />
        <span>Notes</span>
      </TabsTrigger>
      <TabsTrigger 
        value="documents" 
        onClick={() => onChange("documents")}
        className={`flex items-center gap-1 ${activeTab === "documents" ? "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700" : ""}`}
      >
        <FileText className="h-4 w-4" />
        <span>Documents</span>
      </TabsTrigger>
      <TabsTrigger 
        value="forms" 
        onClick={() => onChange("forms")}
        className={`flex items-center gap-1 ${activeTab === "forms" ? "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700" : ""}`}
      >
        <FormInput className="h-4 w-4" />
        <span>Forms</span>
      </TabsTrigger>
      <TabsTrigger 
        value="assessments" 
        onClick={() => onChange("assessments")}
        className={`flex items-center gap-1 ${activeTab === "assessments" ? "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700" : ""}`}
      >
        <AlertTriangle className="h-4 w-4" />
        <span>Assessments</span>
      </TabsTrigger>
      <TabsTrigger 
        value="equipment" 
        onClick={() => onChange("equipment")}
        className={`flex items-center gap-1 ${activeTab === "equipment" ? "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700" : ""}`}
      >
        <Wrench className="h-4 w-4" />
        <span>Equipment</span>
      </TabsTrigger>
      <TabsTrigger 
        value="dietary" 
        onClick={() => onChange("dietary")}
        className={`flex items-center gap-1 ${activeTab === "dietary" ? "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700" : ""}`}
      >
        <Utensils className="h-4 w-4" />
        <span>Dietary</span>
      </TabsTrigger>
      <TabsTrigger 
        value="personalcare" 
        onClick={() => onChange("personalcare")}
        className={`flex items-center gap-1 ${activeTab === "personalcare" ? "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700" : ""}`}
      >
        <Bath className="h-4 w-4" />
        <span>Personal Care</span>
      </TabsTrigger>
      <TabsTrigger 
        value="risk" 
        onClick={() => onChange("risk")}
        className={`flex items-center gap-1 ${activeTab === "risk" ? "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700" : ""}`}
      >
        <ShieldAlert className="h-4 w-4" />
        <span>Risk</span>
      </TabsTrigger>
      <TabsTrigger 
        value="serviceplan" 
        onClick={() => onChange("serviceplan")}
        className={`flex items-center gap-1 ${activeTab === "serviceplan" ? "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700" : ""}`}
      >
        <Clipboard className="h-4 w-4" />
        <span>Service Plan</span>
      </TabsTrigger>
      <TabsTrigger 
        value="serviceactions" 
        onClick={() => onChange("serviceactions")}
        className={`flex items-center gap-1 ${activeTab === "serviceactions" ? "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700" : ""}`}
      >
        <ClipboardCheck className="h-4 w-4" />
        <span>Service Actions</span>
      </TabsTrigger>
      <TabsTrigger 
        value="tasks" 
        onClick={() => onChange("tasks")}
        className={`flex items-center gap-1 ${activeTab === "tasks" ? "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700" : ""}`}
      >
        <CheckSquare className="h-4 w-4" />
        <span>Tasks</span>
      </TabsTrigger>
      <TabsTrigger 
        value="eventslogs" 
        onClick={() => onChange("eventslogs")}
        className={`flex items-center gap-1 ${activeTab === "eventslogs" ? "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700" : ""}`}
      >
        <FileBarChart2 className="h-4 w-4" />
        <span>Events & Logs</span>
      </TabsTrigger>
      <TabsTrigger 
        value="keycontacts" 
        onClick={() => onChange("keycontacts")}
        className={`flex items-center gap-1 ${activeTab === "keycontacts" ? "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700" : ""}`}
      >
        <Users className="h-4 w-4" />
        <span>Key Contacts</span>
      </TabsTrigger>
    </TabsList>
  );
};
