import React from "react";
import { SystemReports } from "@/components/system/dashboard/SystemReports";
import { FileText, TrendingUp, Building, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const ReportsTab: React.FC = () => {
  return (
    <section>
      {/* Reports Info Header */}
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl mb-6">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold">System Reports</h2>
                <Badge variant="default" className="text-xs">
                  <Activity className="h-3 w-3 mr-1" />
                  Live Data
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Comprehensive analytics and insights across tenant organisations and system users
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                Auto-updated
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Building className="h-3 w-3 mr-1" />
                Multi-tenant
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Content */}
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl">
        <SystemReports />
      </div>
    </section>
  );
};
