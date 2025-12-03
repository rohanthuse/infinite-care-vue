import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building, Plus, Clock, Activity } from 'lucide-react';

interface SystemTenantsInfoHeaderProps {
  totalTenants: number;
  onAddTenant: () => void;
}

export const SystemTenantsInfoHeader = ({ 
  totalTenants,
  onAddTenant 
}: SystemTenantsInfoHeaderProps) => {
  return (
    <div className="bg-gradient-to-br from-card/80 via-card/50 to-blue-50/30 dark:to-blue-950/20 backdrop-blur-sm border border-border/50 rounded-xl p-6 mb-8 shadow-md shadow-blue-100/20 dark:shadow-blue-900/10 relative overflow-hidden">
      {/* Gradient accent strip */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500" />
      
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl shadow-sm">
            <Building className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tenant Organisations</h1>
            <p className="text-muted-foreground mt-1">
              Manage and monitor all tenant organisations in the system
            </p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2">
                <Badge variant="info" className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  {totalTenants} Total Tenants
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  System Operational
                </Badge>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};