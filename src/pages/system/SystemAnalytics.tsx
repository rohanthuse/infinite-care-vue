import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomButton } from '@/components/ui/CustomButton';
import { ArrowLeft, BarChart3, TrendingUp, Activity, Users, Globe } from 'lucide-react';

export default function SystemAnalytics() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <CustomButton
                variant="ghost"
                size="sm"
                onClick={() => navigate('/system-dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </CustomButton>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Platform Analytics</h1>
                <p className="text-sm text-muted-foreground">Monitor performance metrics</p>
              </div>
            </div>
            
            <CustomButton variant="outline" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Export Report</span>
            </CustomButton>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="text-2xl font-bold text-green-600">99.9%</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-foreground">1,234</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Response Time</p>
                <p className="text-2xl font-bold text-foreground">45ms</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Data Processed</p>
                <p className="text-2xl font-bold text-foreground">2.4TB</p>
              </div>
              <Globe className="h-8 w-8 text-primary" />
            </div>
          </div>
        </div>

        {/* Analytics Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Usage Trends</h3>
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Interactive charts and graphs will be displayed here showing platform usage trends over time.
              </p>
            </div>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Performance Metrics</h3>
            <div className="text-center py-12">
              <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Real-time performance metrics including response times, error rates, and system health indicators.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}