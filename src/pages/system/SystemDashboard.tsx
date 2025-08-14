import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Building, 
  DollarSign, 
  TrendingUp, 
  Plus,
  Settings,
  BarChart3,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SystemDashboard: React.FC = () => {
  const navigate = useNavigate();

  const stats = [
    {
      title: "Total Organizations",
      value: "12",
      description: "+2 from last month",
      icon: Building,
      color: "text-blue-600"
    },
    {
      title: "Active Users",
      value: "1,234",
      description: "+12% from last month",
      icon: Users,
      color: "text-green-600"
    },
    {
      title: "Monthly Revenue",
      value: "$12,450",
      description: "+8% from last month",
      icon: DollarSign,
      color: "text-emerald-600"
    },
    {
      title: "Growth Rate",
      value: "15.3%",
      description: "+2.1% from last month",
      icon: TrendingUp,
      color: "text-purple-600"
    }
  ];

  const quickActions = [
    {
      title: "Create Organization",
      description: "Add a new organization to the system",
      icon: Plus,
      action: () => navigate('/system/organizations/new'),
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      title: "Manage Subscriptions",
      description: "View and manage subscription plans",
      icon: Settings,
      action: () => navigate('/system/subscriptions'),
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      title: "Analytics",
      description: "View detailed system analytics",
      icon: BarChart3,
      action: () => navigate('/system/analytics'),
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      title: "Security",
      description: "Review security settings and audit logs",
      icon: Shield,
      action: () => navigate('/system/security'),
      color: "bg-red-500 hover:bg-red-600"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage your multi-tenant care system
          </p>
        </div>
        <Button onClick={() => navigate('/system/organizations/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Organization
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => (
            <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${action.color} text-white flex items-center justify-center mb-2`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={action.action}
                >
                  Open
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest system events and changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <p className="font-medium">New organization created: "Healthcare Plus"</p>
                <p className="text-sm text-muted-foreground">2 hours ago</p>
              </div>
              <Button variant="ghost" size="sm">View</Button>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <p className="font-medium">Subscription upgraded: "Care Solutions Ltd"</p>
                <p className="text-sm text-muted-foreground">5 hours ago</p>
              </div>
              <Button variant="ghost" size="sm">View</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Payment received: $199 from "Medical Center Inc"</p>
                <p className="text-sm text-muted-foreground">1 day ago</p>
              </div>
              <Button variant="ghost" size="sm">View</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};