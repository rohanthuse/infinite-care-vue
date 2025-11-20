import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SystemSectionTabs } from '@/components/system/SystemSectionTabs';
import { SystemInfoHeader } from '@/components/system/SystemInfoHeader';
import { Badge } from '@/components/ui/badge';
import { SystemTenantAgreementsTable } from '@/components/system/tenant-agreements/SystemTenantAgreementsTable';
import { SystemTenantAgreementTemplatesTable } from '@/components/system/tenant-agreements/SystemTenantAgreementTemplatesTable';
import { SystemTenantAgreementsStats } from '@/components/system/tenant-agreements/SystemTenantAgreementsStats';
import { CreateSystemTenantAgreementDialog } from '@/components/system/tenant-agreements/CreateSystemTenantAgreementDialog';
import { CreateSystemTenantAgreementTemplateDialog } from '@/components/system/tenant-agreements/CreateSystemTenantAgreementTemplateDialog';
import { useSystemTenantAgreements } from '@/hooks/useSystemTenantAgreements';

export default function SystemTenantAgreements() {
  const [activeTab, setActiveTab] = useState('agreements');
  const { data: agreements, isLoading } = useSystemTenantAgreements();

  const activeCount = agreements?.filter(a => a.status === 'Active').length || 0;
  const pendingCount = agreements?.filter(a => a.status === 'Pending').length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <DashboardHeader />
      
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <SystemInfoHeader
          systemInfo={{
            status: "Operational",
            version: "v1.0.0",
            uptime: "99.99%",
            serverLocation: "EU-West",
            lastUpdate: new Date().toLocaleString(),
          }}
          onQuickAction={() => {}}
        />

        <div className="mb-4">
          <Tabs value="tenant-agreements" className="w-full">
            <SystemSectionTabs value="tenant-agreements" />
          </Tabs>
        </div>

        {/* Page Header */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Tenant Agreements</h1>
                <p className="text-muted-foreground mt-1">
                  Manage agreements between Med-Infinite and tenant organizations
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {agreements?.length || 0} Total Agreements
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    {activeCount} Active
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    {pendingCount} Pending
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <SystemTenantAgreementsStats agreements={agreements || []} isLoading={isLoading} />

        {/* Main Content Tabs */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="p-6 border-b border-border/50">
              <TabsList>
                <TabsTrigger value="agreements">Agreements</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="agreements" className="p-6 mt-0">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Tenant Agreements</h2>
                  <p className="text-sm text-muted-foreground">View and manage all tenant agreements</p>
                </div>
                <CreateSystemTenantAgreementDialog />
              </div>
              <SystemTenantAgreementsTable agreements={agreements || []} isLoading={isLoading} />
            </TabsContent>

            <TabsContent value="templates" className="p-6 mt-0">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Agreement Templates</h2>
                  <p className="text-sm text-muted-foreground">Manage reusable agreement templates</p>
                </div>
                <CreateSystemTenantAgreementTemplateDialog />
              </div>
              <SystemTenantAgreementTemplatesTable />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
