import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Clock, Users, Database } from 'lucide-react';

interface SystemAnalyticsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SystemAnalyticsModal({ open, onOpenChange }: SystemAnalyticsModalProps) {
  // Mock analytics data - in real app, this would come from API
  const metrics = [
    {
      label: 'System Uptime',
      value: '99.98%',
      icon: Activity,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Active Users',
      value: '1,247',
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Avg Response Time',
      value: '124ms',
      icon: Clock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      label: 'Data Processed',
      value: '2.4 TB',
      icon: Database,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

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

          {/* Usage Trends Section */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Usage Trends</h3>
            <div className="h-48 flex items-center justify-center border border-dashed border-border rounded-lg">
              <p className="text-muted-foreground">Chart visualization would appear here</p>
            </div>
          </div>

          {/* Performance Metrics Section */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Performance Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">API Response Time</span>
                <span className="text-sm font-medium text-foreground">124ms avg</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Database Query Time</span>
                <span className="text-sm font-medium text-foreground">45ms avg</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Memory Usage</span>
                <span className="text-sm font-medium text-foreground">68% (4.2GB / 6GB)</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">CPU Usage</span>
                <span className="text-sm font-medium text-foreground">42%</span>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
