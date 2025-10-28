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
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Building className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tenant Organisations</h1>
            <p className="text-muted-foreground mt-1">
              Manage and monitor all tenant organisations in the system
            </p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  {totalTenants} Total Tenants
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
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