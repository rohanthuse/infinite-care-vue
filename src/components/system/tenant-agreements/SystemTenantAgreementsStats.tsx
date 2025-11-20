import React from 'react';
import { FileText, FileCheck, FileClock, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { SystemTenantAgreement } from '@/types/systemTenantAgreements';

interface SystemTenantAgreementsStatsProps {
  agreements: SystemTenantAgreement[];
  isLoading: boolean;
}

export const SystemTenantAgreementsStats: React.FC<SystemTenantAgreementsStatsProps> = ({
  agreements,
  isLoading,
}) => {
  const total = agreements.length;
  const active = agreements.filter(a => a.status === 'Active').length;
  const pending = agreements.filter(a => a.status === 'Pending').length;
  
  // Count expiring soon (within 30 days)
  const expiringSoon = agreements.filter(a => {
    if (!a.expiry_date || a.status !== 'Active') return false;
    const expiryDate = new Date(a.expiry_date);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiryDate <= thirtyDaysFromNow && expiryDate > new Date();
  }).length;

  const stats = [
    {
      title: 'Total Agreements',
      value: total,
      icon: FileText,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Active Agreements',
      value: active,
      icon: FileCheck,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Pending Signatures',
      value: pending,
      icon: FileClock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Expiring Soon',
      value: expiringSoon,
      icon: AlertCircle,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
