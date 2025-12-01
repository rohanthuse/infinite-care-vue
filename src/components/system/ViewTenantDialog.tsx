import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow, format } from 'date-fns';
import { Building2, CreditCard, Users, Network, Mail } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface ViewTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: {
    id: string;
    name: string;
    slug: string;
    subscription_plan: string;
    subscription_status: string;
    contact_email: string;
    subscription_expires_at?: string | null;
    settings?: {
      subscription_duration?: number;
      billing_cycle?: string;
      subscription_start_date?: string;
    };
    super_admin_first_name?: string;
    super_admin_last_name?: string;
    super_admin_email?: string;
    plan_max_users?: number;
    plan_price_monthly?: number;
    plan_price_yearly?: number;
    total_branches?: number;
    total_clients?: number;
    active_clients?: number;
    total_users?: number;
    active_users?: number;
    has_agreement?: boolean;
  } | null;
}

export const ViewTenantDialog: React.FC<ViewTenantDialogProps> = ({ open, onOpenChange, tenant }) => {
  if (!tenant) return null;

  const usagePercentage = tenant.plan_max_users && tenant.active_users 
    ? Math.round((tenant.active_users / tenant.plan_max_users) * 100)
    : 0;

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-destructive';
    if (percentage >= 70) return 'text-warning';
    return 'text-success';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tenant Details</DialogTitle>
          <DialogDescription>Complete organisation information and statistics</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Organization Overview Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Building2 className="h-4 w-4" />
              <span>Organization Overview</span>
            </div>
            <div className="grid gap-3">
              <div>
                <div className="text-sm text-muted-foreground">Organization Name</div>
                <div className="font-medium">{tenant.name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">URL Slug</div>
                <div className="font-mono text-sm bg-muted px-2 py-1 rounded inline-block">
                  med-infinite.care/{tenant.slug}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={tenant.subscription_status === 'active' ? 'default' : 'destructive'} className="capitalize">
                  {tenant.subscription_status}
                </Badge>
                <Badge variant="secondary" className="capitalize">
                  {tenant.subscription_plan}
                  {tenant.plan_max_users && ` (${tenant.plan_max_users} Users)`}
                </Badge>
                {tenant.has_agreement && (
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">
                    Agreement Created
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Subscription Plan Details Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <CreditCard className="h-4 w-4" />
              <span>Subscription Plan Details</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Plan Name</div>
                <div className="font-medium capitalize">
                  {tenant.subscription_plan}
                  {tenant.plan_max_users && (
                    <span className="text-muted-foreground ml-1">({tenant.plan_max_users} Users)</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Max Users Allowed</div>
                <div className="font-medium">{tenant.plan_max_users ?? '—'}</div>
              </div>
              {(tenant.plan_price_monthly || tenant.plan_price_yearly) && (
                <>
                  <div>
                    <div className="text-sm text-muted-foreground">Monthly Price</div>
                    <div className="font-medium">
                      {tenant.plan_price_monthly ? formatCurrency(tenant.plan_price_monthly) : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Yearly Price</div>
                    <div className="font-medium">
                      {tenant.plan_price_yearly ? formatCurrency(tenant.plan_price_yearly) : '—'}
                    </div>
                  </div>
                </>
              )}
              {tenant.settings?.subscription_start_date && (
                <div>
                  <div className="text-sm text-muted-foreground">Start Date</div>
                  <div className="font-medium">
                    {format(new Date(tenant.settings.subscription_start_date), 'dd MMM yyyy')}
                  </div>
                </div>
              )}
              {tenant.subscription_expires_at && (
                <div>
                  <div className="text-sm text-muted-foreground">Expiry Date</div>
                  <div className="font-medium">
                    {format(new Date(tenant.subscription_expires_at), 'dd MMM yyyy')}
                  </div>
                </div>
              )}
              {tenant.settings?.subscription_duration && (
                <div>
                  <div className="text-sm text-muted-foreground">Duration</div>
                  <div className="font-medium capitalize">
                    {tenant.settings.subscription_duration} {tenant.settings.billing_cycle || 'months'}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Assignment & Usage Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4" />
              <span>Assignment & Usage</span>
            </div>
            <div className="grid gap-3">
              {(tenant.super_admin_first_name || tenant.super_admin_email) && (
                <div>
                  <div className="text-sm text-muted-foreground">Super Admin</div>
                  <div className="font-medium">
                    {tenant.super_admin_first_name || tenant.super_admin_last_name 
                      ? `${tenant.super_admin_first_name || ''} ${tenant.super_admin_last_name || ''}`.trim()
                      : '—'}
                  </div>
                  {tenant.super_admin_email && (
                    <div className="text-sm text-muted-foreground">{tenant.super_admin_email}</div>
                  )}
                </div>
              )}
              <div>
                <div className="text-sm text-muted-foreground">Active Users</div>
                <div className="font-medium">
                  {tenant.active_users ?? 0} / {tenant.total_users ?? 0} total
                </div>
              </div>
              {tenant.plan_max_users && (
                <div>
                  <div className="text-sm text-muted-foreground">Usage vs Limit</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          usagePercentage >= 90 ? 'bg-destructive' : 
                          usagePercentage >= 70 ? 'bg-warning' : 
                          'bg-success'
                        }`}
                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                      />
                    </div>
                    <span className={`text-sm font-medium ${getUsageColor(usagePercentage)}`}>
                      {usagePercentage}%
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {tenant.active_users ?? 0} of {tenant.plan_max_users} users active
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Infrastructure Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Network className="h-4 w-4" />
              <span>Infrastructure</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Total Branches</div>
                <div className="font-medium">{tenant.total_branches ?? 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Clients</div>
                <div className="font-medium">{tenant.total_clients ?? 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Active Clients</div>
                <div className="font-medium">{tenant.active_clients ?? 0}</div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Mail className="h-4 w-4" />
              <span>Contact Information</span>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Contact Email</div>
              <div className="font-medium">{tenant.contact_email || '—'}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
