import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useCarePlanCompletionData } from '@/hooks/useCarePlanCompletionData';
import { Download, Search, FileText, CheckCircle, Clock, AlertCircle, XCircle, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CarePlanCompletionReportProps {
  branchId: string;
  branchName: string;
}

export function CarePlanCompletionReport({ branchId, branchName }: CarePlanCompletionReportProps) {
  const { data, isLoading, error } = useCarePlanCompletionData(branchId);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [overdueFilter, setOverdueFilter] = useState<string>('all');

  const COLORS = {
    active: 'hsl(var(--chart-1))',
    pending: 'hsl(var(--chart-2))',
    rejected: 'hsl(var(--chart-3))',
    completed: 'hsl(var(--chart-4))',
    overdue: 'hsl(var(--destructive))',
  };

  const filteredData = useMemo(() => {
    if (!data?.carePlans) return [];
    
    return data.carePlans.filter(plan => {
      const matchesSearch = plan.client_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;
      const matchesOverdue = overdueFilter === 'all' || 
        (overdueFilter === 'overdue' && plan.is_overdue) ||
        (overdueFilter === 'not-overdue' && !plan.is_overdue);
      
      return matchesSearch && matchesStatus && matchesOverdue;
    });
  }, [data?.carePlans, searchTerm, statusFilter, overdueFilter]);

  const statusChartData = useMemo(() => {
    if (!data?.carePlans) return [];
    
    const statusCounts: Record<string, number> = {};
    data.carePlans.forEach(plan => {
      statusCounts[plan.status] = (statusCounts[plan.status] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: count,
    }));
  }, [data?.carePlans]);

  const goalsCompletionChartData = useMemo(() => {
    if (!filteredData.length) return [];
    
    const ranges = [
      { name: '0-20%', min: 0, max: 20, count: 0 },
      { name: '21-40%', min: 21, max: 40, count: 0 },
      { name: '41-60%', min: 41, max: 60, count: 0 },
      { name: '61-80%', min: 61, max: 80, count: 0 },
      { name: '81-100%', min: 81, max: 100, count: 0 },
    ];

    filteredData.forEach(plan => {
      const range = ranges.find(r => 
        plan.goals_completion_rate >= r.min && plan.goals_completion_rate <= r.max
      );
      if (range) range.count++;
    });

    return ranges;
  }, [filteredData]);

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(18);
    doc.text('Care Plan Completion Report', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Branch: ${branchName}`, pageWidth / 2, 22, { align: 'center' });
    doc.text(`Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth / 2, 28, { align: 'center' });

    // Summary Stats
    if (data?.stats) {
      doc.setFontSize(14);
      doc.text('Summary Statistics', 14, 40);
      
      const statsData = [
        ['Total Care Plans', data.stats.total_care_plans.toString()],
        ['Active Plans', data.stats.active_plans.toString()],
        ['Pending Approval', data.stats.pending_approval.toString()],
        ['Rejected Plans', data.stats.rejected_plans.toString()],
        ['Overdue Reviews', data.stats.overdue_reviews.toString()],
        ['Avg Goals Completion', `${data.stats.avg_goals_completion}%`],
        ['Plans with No Goals', data.stats.plans_with_no_goals.toString()],
      ];

      autoTable(doc, {
        startY: 45,
        head: [['Metric', 'Value']],
        body: statsData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
      });
    }

    // Care Plans Table
    const tableData = filteredData.map(plan => [
      plan.client_name,
      plan.status.replace(/-/g, ' '),
      `${plan.goals_completion_rate}%`,
      `${plan.completed_goals}/${plan.total_goals}`,
      plan.is_overdue ? `Yes (${plan.days_overdue}d)` : 'No',
      plan.review_date ? format(new Date(plan.review_date), 'dd/MM/yyyy') : 'N/A',
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 15,
      head: [['Client', 'Status', 'Completion', 'Goals', 'Overdue', 'Review Date']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`care-plan-completion-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const exportToCSV = () => {
    const headers = ['Client Name', 'Status', 'Goals Completion %', 'Completed Goals', 'Total Goals', 'In Progress', 'Not Started', 'Overdue', 'Days Overdue', 'Review Date', 'Created Date', 'Updated Date'];
    const rows = filteredData.map(plan => [
      plan.client_name,
      plan.status,
      plan.goals_completion_rate,
      plan.completed_goals,
      plan.total_goals,
      plan.in_progress_goals,
      plan.not_started_goals,
      plan.is_overdue ? 'Yes' : 'No',
      plan.days_overdue || '',
      plan.review_date ? format(new Date(plan.review_date), 'dd/MM/yyyy') : '',
      format(new Date(plan.created_at), 'dd/MM/yyyy'),
      format(new Date(plan.updated_at), 'dd/MM/yyyy'),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `care-plan-completion-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      'draft': { variant: 'outline', label: 'Draft' },
      'pending-client-approval': { variant: 'secondary', label: 'Pending Approval' },
      'active': { variant: 'default', label: 'Active' },
      'rejected': { variant: 'destructive', label: 'Rejected' },
      'completed': { variant: 'default', label: 'Completed' },
      'on-hold': { variant: 'outline', label: 'On Hold' },
    };

    const config = statusConfig[status] || { variant: 'outline' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading care plan data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-destructive">Error loading data: {(error as Error).message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Care Plans</CardDescription>
            <CardTitle className="text-3xl">{data?.stats.total_care_plans || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <FileText className="h-4 w-4 mr-1" />
              All care plans
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Plans</CardDescription>
            <CardTitle className="text-3xl">{data?.stats.active_plans || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 mr-1" />
              Currently active
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overdue Reviews</CardDescription>
            <CardTitle className="text-3xl text-destructive">{data?.stats.overdue_reviews || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 mr-1" />
              Requires attention
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Goals Completion</CardDescription>
            <CardTitle className="text-3xl">{data?.stats.avg_goals_completion || 0}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 mr-1" />
              Across all plans
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Care plans by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Goals Completion Distribution</CardTitle>
            <CardDescription>Care plans by completion percentage</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={goalsCompletionChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS.active} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Export */}
      <Card>
        <CardHeader>
          <CardTitle>Care Plan Details</CardTitle>
          <CardDescription>Filter and export care plan completion data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by client name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending-client-approval">Pending Approval</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={overdueFilter} onValueChange={setOverdueFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by overdue" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="overdue">Overdue Only</SelectItem>
                <SelectItem value="not-overdue">Not Overdue</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={exportToPDF} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button onClick={exportToCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Client</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">Completion</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">Goals</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">Review Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Review Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        No care plans found matching your filters
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((plan) => (
                      <tr key={plan.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 text-sm font-medium">{plan.client_name}</td>
                        <td className="px-4 py-3">{getStatusBadge(plan.status)}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-sm font-semibold">{plan.goals_completion_rate}%</span>
                            <div className="w-full max-w-[100px] bg-muted rounded-full h-2 mt-1">
                              <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${plan.goals_completion_rate}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          <div className="flex flex-col items-center">
                            <span className="font-medium">{plan.completed_goals}/{plan.total_goals}</span>
                            <span className="text-xs text-muted-foreground">
                              {plan.in_progress_goals} in progress
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {plan.is_overdue ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Overdue {plan.days_overdue}d
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <CheckCircle className="h-3 w-3" />
                              On Track
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {plan.review_date ? format(new Date(plan.review_date), 'dd/MM/yyyy') : 'Not set'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {filteredData.length} of {data?.carePlans.length || 0} care plans
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
