import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomButton } from '@/components/ui/CustomButton';
import { ArrowLeft, Settings, Shield, Database, Globe, Bell, Lock } from 'lucide-react';

export default function SystemSettings() {
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
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Global Settings</h1>
                <p className="text-sm text-muted-foreground">Configure platform settings</p>
              </div>
            </div>
            
            <CustomButton className="flex items-center space-x-2">
              <span>Save Changes</span>
            </CustomButton>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Settings Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Security</h3>
                <p className="text-sm text-muted-foreground">Authentication & access control</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                • Password policies
              </div>
              <div className="text-sm text-muted-foreground">
                • Session management
              </div>
              <div className="text-sm text-muted-foreground">
                • Two-factor authentication
              </div>
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Database</h3>
                <p className="text-sm text-muted-foreground">Database configuration</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                • Connection settings
              </div>
              <div className="text-sm text-muted-foreground">
                • Backup schedules
              </div>
              <div className="text-sm text-muted-foreground">
                • Performance tuning
              </div>
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Platform</h3>
                <p className="text-sm text-muted-foreground">General platform settings</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                • Branding & themes
              </div>
              <div className="text-sm text-muted-foreground">
                • Feature flags
              </div>
              <div className="text-sm text-muted-foreground">
                • Maintenance mode
              </div>
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
                <p className="text-sm text-muted-foreground">Email & alert settings</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                • Email templates
              </div>
              <div className="text-sm text-muted-foreground">
                • Alert thresholds
              </div>
              <div className="text-sm text-muted-foreground">
                • Notification channels
              </div>
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Privacy</h3>
                <p className="text-sm text-muted-foreground">Data protection & compliance</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                • GDPR compliance
              </div>
              <div className="text-sm text-muted-foreground">
                • Data retention
              </div>
              <div className="text-sm text-muted-foreground">
                • Audit logging
              </div>
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">System</h3>
                <p className="text-sm text-muted-foreground">Core system settings</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                • API rate limits
              </div>
              <div className="text-sm text-muted-foreground">
                • Cache configuration
              </div>
              <div className="text-sm text-muted-foreground">
                • Log levels
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="mt-8 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">Good</div>
              <div className="text-sm text-green-700 dark:text-green-400">System Health</div>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">99.9%</div>
              <div className="text-sm text-blue-700 dark:text-blue-400">Uptime</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">45ms</div>
              <div className="text-sm text-purple-700 dark:text-purple-400">Response Time</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}