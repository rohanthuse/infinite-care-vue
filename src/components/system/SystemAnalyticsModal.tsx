import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, TrendingUp, Users, DollarSign, PieChart as PieChartIcon } from 'lucide-react';
import { useSystemAnalytics } from '@/hooks/useSystemAnalytics';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, AreaChart, Area, CartesianGrid, Legend } from 'recharts';

interface SystemAnalyticsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CHART_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function SystemAnalyticsModal({ open, onOpenChange }: SystemAnalyticsModalProps) {
  const { data: analytics, isLoading, error } = useSystemAnalytics();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const metrics = analytics ? [
    {
      label: 'Total Tenants',
      value: analytics.total_tenants.toString(),
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Total Users',
      value: analytics.total_users.toString(),
      icon: Activity,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Pending Demos',
      value: analytics.demo_requests.pending.toString(),
      icon: TrendingUp,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(analytics.total_revenue),
      icon: DollarSign,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ] : [];

  const revenueData = analytics ? [
    { name: 'Monthly', value: analytics.monthly_revenue, count: analytics.monthly_count },
    { name: 'Yearly', value: analytics.yearly_revenue, count: analytics.yearly_count },
  ] : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] max-h-[600px] h-[600px] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-2xl font-bold">Platform Analytics</DialogTitle>
          <DialogDescription>
            Real-time system performance metrics and usage statistics
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[calc(600px-120px)] px-6 pb-6">
          {isLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-32 rounded-lg" />
                ))}
              </div>
              <Skeleton className="h-64 rounded-lg" />
              <Skeleton className="h-64 rounded-lg" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-destructive">Error loading analytics data</p>
            </div>
          ) : analytics ? (
            <>
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {metrics.map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <div
                      key={metric.label}
                      className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                          <Icon className={`h-6 w-6 ${metric.color}`} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">{metric.label}</p>
                        <p className="text-3xl font-bold text-foreground">{metric.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Subscription Distribution Chart */}
              {analytics.subscription_distribution && analytics.subscription_distribution.length > 0 && (
                <div className="bg-card border border-border rounded-lg p-6 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <PieChartIcon className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Subscription Distribution</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={analytics.subscription_distribution}
                        dataKey="tenant_count"
                        nameKey="plan_name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ plan_name, tenant_count }) => `${plan_name}: ${tenant_count}`}
                      >
                        {analytics.subscription_distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Tenant Growth Trend */}
              {analytics.tenant_growth && analytics.tenant_growth.length > 0 && (
                <div className="bg-card border border-border rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Tenant Growth (Last 12 Months)</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={analytics.tenant_growth}>
                      <defs>
                        <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="month" 
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="hsl(var(--primary))" 
                        fillOpacity={1} 
                        fill="url(#colorGrowth)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Revenue Breakdown */}
              {revenueData.length > 0 && (
                <div className="bg-card border border-border rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Revenue by Billing Cycle</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="name" 
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                      />
                      <Legend />
                      <Bar dataKey="value" fill="hsl(var(--primary))" name="Revenue" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 flex gap-4 justify-center text-sm text-muted-foreground">
                    <div>
                      Monthly: <span className="font-semibold text-foreground">{analytics.monthly_count} tenants</span>
                    </div>
                    <div>
                      Yearly: <span className="font-semibold text-foreground">{analytics.yearly_count} tenants</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Demo Request Stats */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Demo Request Summary</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{analytics.demo_requests.total}</p>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-500">{analytics.demo_requests.pending}</p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-500">{analytics.demo_requests.approved}</p>
                    <p className="text-sm text-muted-foreground">Approved</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-500">{analytics.demo_requests.rejected}</p>
                    <p className="text-sm text-muted-foreground">Rejected</p>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
