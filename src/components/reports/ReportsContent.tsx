
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ClientReports } from "./ClientReports";
import { StaffReports } from "./StaffReports";
import { ServiceReports } from "./ServiceReports";
import { FinancialReports } from "./FinancialReports";
import { OperationalReports } from "./OperationalReports";
import { ComplianceReports } from "./ComplianceReports";
import { ClinicalReports } from "./ClinicalReports";
import { StaffComplianceMatrixReport } from "./StaffComplianceMatrixReport";
import { ClientComplianceReport } from "./ClientComplianceReport";
import { IncidentSummaryReport } from "./IncidentSummaryReport";
import { MissedCallsLateArrivalsReport } from "./MissedCallsLateArrivalsReport";
import { CarePlanCompletionReport } from "./CarePlanCompletionReport";
import { SafeguardingReport } from "./SafeguardingReport";
import { ReportsHeader } from "./ReportsHeader";
import { 
  Users, 
  Briefcase, 
  ClipboardCheck, 
  PoundSterling, 
  BarChart3, 
  ShieldCheck, 
  Stethoscope,
  ClipboardList,
  AlertTriangle,
  PhoneOff
} from "lucide-react";

interface ReportsContentProps {
  branchId: string;
  branchName: string;
}

type ReportType = 
  | "staff-compliance-matrix"
  | "client-compliance-matrix"
  | "incident-summary"
  | "missed-calls-late-arrivals"
  | "care-plan-completion"
  | "safeguarding"
  | "client" 
  | "staff" 
  | "service" 
  | "financial" 
  | "operational" 
  | "compliance" 
  | "clinical";

interface ReportOption {
  id: ReportType;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export function ReportsContent({ branchId, branchName }: ReportsContentProps) {
  const [activeReport, setActiveReport] = useState<ReportType>("staff-compliance-matrix");
  
  const reportOptions: ReportOption[] = [
    {
      id: "staff-compliance-matrix",
      title: "Staff Compliance Matrix",
      description: "Comprehensive staff compliance tracking and analytics",
      icon: <ClipboardList className="h-6 w-6" />
    },
    {
      id: "client-compliance-matrix",
      title: "Client Compliance Matrix",
      description: "Track medication, visits, appointments & health monitoring",
      icon: <Users className="h-6 w-6" />
    },
    {
      id: "incident-summary",
      title: "Incident Summary",
      description: "Analyze incidents with trends and resolution tracking",
      icon: <AlertTriangle className="h-6 w-6" />
    },
    {
      id: "missed-calls-late-arrivals",
      title: "Missed Calls & Late Arrivals",
      description: "Track missed bookings and punctuality metrics",
      icon: <PhoneOff className="h-6 w-6" />
    },
    {
      id: "care-plan-completion",
      title: "Care Plan Completion",
      description: "Track care plan status, goals, and review compliance",
      icon: <ClipboardCheck className="h-6 w-6" />
    },
    {
      id: "safeguarding",
      title: "Safeguarding & Concerns",
      description: "Monitor safeguarding concerns, investigations, and action plans",
      icon: <ShieldCheck className="h-6 w-6" />
    },
    {
      id: "client",
      title: "Client Reports",
      description: "View client demographics and service usage",
      icon: <Users className="h-6 w-6" />
    },
    {
      id: "staff",
      title: "Staff Reports",
      description: "View staff performance and availability",
      icon: <Briefcase className="h-6 w-6" />
    },
    {
      id: "service",
      title: "Service Reports",
      description: "Analyze service utilization and trends",
      icon: <ClipboardCheck className="h-6 w-6" />
    },
    {
      id: "financial",
      title: "Financial Reports",
      description: "Track revenue, expenses, and profitability",
      icon: <PoundSterling className="h-6 w-6" />
    },
    {
      id: "operational",
      title: "Operational Reports",
      description: "Monitor task completion and response times",
      icon: <BarChart3 className="h-6 w-6" />
    },
    {
      id: "compliance",
      title: "Compliance Reports",
      description: "Track training compliance and incidents",
      icon: <ShieldCheck className="h-6 w-6" />
    },
    {
      id: "clinical",
      title: "Clinical Reports",
      description: "Monitor patient observations and NEWS2 scores",
      icon: <Stethoscope className="h-6 w-6" />
    }
  ];
  
  const renderActiveReport = () => {
    switch (activeReport) {
      case "staff-compliance-matrix":
        return <StaffComplianceMatrixReport branchId={branchId} branchName={branchName} />;
      case "client-compliance-matrix":
        return <ClientComplianceReport branchId={branchId} branchName={branchName} />;
      case "incident-summary":
        return <IncidentSummaryReport branchId={branchId} branchName={branchName} />;
      case "missed-calls-late-arrivals":
        return <MissedCallsLateArrivalsReport branchId={branchId} branchName={branchName} />;
      case "care-plan-completion":
        return <CarePlanCompletionReport branchId={branchId} branchName={branchName} />;
      case "safeguarding":
        return <SafeguardingReport branchId={branchId} branchName={branchName} />;
      case "client":
        return <ClientReports branchId={branchId} branchName={branchName} />;
      case "staff":
        return <StaffReports branchId={branchId} branchName={branchName} />;
      case "service":
        return <ServiceReports branchId={branchId} branchName={branchName} />;
      case "financial":
        return <FinancialReports branchId={branchId} branchName={branchName} />;
      case "operational":
        return <OperationalReports branchId={branchId} branchName={branchName} />;
      case "compliance":
        return <ComplianceReports branchId={branchId} branchName={branchName} />;
      case "clinical":
        return <ClinicalReports branchId={branchId} branchName={branchName} />;
      default:
        return <StaffComplianceMatrixReport branchId={branchId} branchName={branchName} />;
    }
  };
  
  return (
    <div className="space-y-4">
      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-bold">Reports</CardTitle>
          <CardDescription>
            Generate and analyze reports across various categories
          </CardDescription>
        </CardHeader>
      </Card>

      <ReportsHeader />
      
      {activeReport ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {reportOptions.map((option) => (
              <Card 
                key={option.id}
                onClick={() => setActiveReport(option.id)}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  activeReport === option.id 
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700" 
                    : "bg-card hover:bg-muted"
                }`}
              >
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className={`p-2 rounded-full mb-2 ${
                    activeReport === option.id 
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {option.icon}
                  </div>
                  <h3 className={`font-medium text-sm ${
                    activeReport === option.id ? "text-blue-700 dark:text-blue-300" : ""
                  }`}>
                    {option.title}
                  </h3>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="bg-card p-4 border border-border rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">{reportOptions.find(option => option.id === activeReport)?.title}</h2>
            {renderActiveReport()}
          </div>
        </div>
      ) : null}
    </div>
  );
}
