import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GeneralAccountingSettings } from './accounting/GeneralAccountingSettings';
import { PrivateAccountingSettings } from './accounting/PrivateAccountingSettings';
import { AuthorityAccountingSettings } from './accounting/AuthorityAccountingSettings';
import { RateManagement } from './accounting/RateManagement';
import { useClientFundingInfo } from '@/hooks/useClientFunding';

interface ClientAccountingTabProps {
  clientId: string;
  branchId: string;
}

export const ClientAccountingTab: React.FC<ClientAccountingTabProps> = ({
  clientId,
  branchId
}) => {
  const { data: fundingInfo } = useClientFundingInfo(clientId);
  const isAuthorityFunding = fundingInfo?.funding_type === 'authority';
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Rate & Accounting Configuration</CardTitle>
          <CardDescription>
            Configure client-specific accounting settings, rate schedules, and billing preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General Settings</TabsTrigger>
              <TabsTrigger value={isAuthorityFunding ? "authority" : "private"}>
                {isAuthorityFunding ? "Authority Settings" : "Private Settings"}
              </TabsTrigger>
              <TabsTrigger value="rates">Rate Management</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-4">
              <GeneralAccountingSettings clientId={clientId} branchId={branchId} />
            </TabsContent>
            
            {!isAuthorityFunding && (
              <TabsContent value="private" className="space-y-4">
                <PrivateAccountingSettings clientId={clientId} branchId={branchId} />
              </TabsContent>
            )}
            
            {isAuthorityFunding && (
              <TabsContent value="authority" className="space-y-4">
                <AuthorityAccountingSettings clientId={clientId} branchId={branchId} />
              </TabsContent>
            )}
            
            <TabsContent value="rates" className="space-y-4">
              <RateManagement clientId={clientId} branchId={branchId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};