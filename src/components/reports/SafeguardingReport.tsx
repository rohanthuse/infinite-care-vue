import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useSafeguardingReportsData } from '@/hooks/useSafeguardingReportsData';
import { Download, Search, Shield, AlertTriangle, Clock, CheckCircle, XCircle, TrendingUp, Eye } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DetailDialog, type DetailField } from '@/components/reports/shared/DetailDialog';
import { AdvancedExportMenu, type ExportColumn } from '@/components/reports/shared/AdvancedExportMenu';
import type { ExportOptions as AdvancedExportOptions } from '@/components/reports/shared/AdvancedExportMenu';
import { ReportExporter } from '@/utils/reportExporter';
import { toast } from 'sonner';

interface SafeguardingReportProps {
  branchId: string;
  branchName: string;
}

export function SafeguardingReport({ branchId, branchName }: SafeguardingReportProps) {
  const { data, isLoading, error } = useSafeguardingReportsData(branchId);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedConcern, setSelectedConcern] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const COLORS = {
    critical: 'hsl(var(--destructive))',
    high: 'hsl(var(--chart-3))',
    medium: 'hsl(var(--chart-2))',
    low: 'hsl(var(--chart-1))',
    resolved: 'hsl(var(--chart-4))',
    investigating: 'hsl(var(--chart-2))',
    awaiting: 'hsl(var(--chart-3))',
  };

  const filteredData = useMemo(() => {
    if (!data?.concerns) return [];
    
    return data.concerns.filter(concern => {
      const matchesSearch = concern.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           concern.concern_type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSeverity = severityFilter === 'all' || concern.severity === severityFilter;
      const matchesStatus = statusFilter === 'all' || concern.investigation_status === statusFilter;
      
      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [data?.concerns, searchTerm, severityFilter, statusFilter]);

  const severityChartData = useMemo(() => {
    if (!data?.stats) return [];
    
    return [
      { name: 'Critical', value: data.stats.critical_severity, color: COLORS.critical },
      { name: 'High', value: data.stats.high_severity, color: COLORS.high },
      { name: 'Medium', value: data.stats.medium_severity, color: COLORS.medium },
      { name: 'Low', value: data.stats.low_severity, color: COLORS.low },
    ].filter(item => item.value > 0);
  }, [data?.stats]);

  const statusChartData = useMemo(() => {
    if (!data?.stats) return [];
    
    return [
      { name: 'Resolved', value: data.stats.resolved },
      { name: 'Under Investigation', value: data.stats.under_investigation },
      { name: 'Awaiting Action', value: data.stats.awaiting_action },
    ];
  }, [data?.stats]);

  const concernTypeData = useMemo(() => {
    if (!filteredData.length) return [];
    
    const typeCounts: Record<string, number> = {};
    filteredData.forEach(concern => {
      typeCounts[concern.concern_type] = (typeCounts[concern.concern_type] || 0) + 1;
    });

    return Object.entries(typeCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 types
  }, [filteredData]);

  // Export columns configuration
  const exportColumns: ExportColumn[] = [
    { key: 'client_name', label: 'Client Name', included: true },
    { key: 'concern_type', label: 'Concern Type', included: true },
    { key: 'severity', label: 'Severity', included: true },
    { key: 'risk_level', label: 'Risk Level', included: true },
    { key: 'investigation_status', label: 'Status', included: true },
    { key: 'reported_date', label: 'Reported Date', included: true },
    { key: 'reported_by', label: 'Reported By', included: true },
    { key: 'description', label: 'Description', included: false },
    { key: 'investigation_notes', label: 'Investigation Notes', included: false },
    { key: 'action_taken', label: 'Action Taken', included: false },
    { key: 'resolution_date', label: 'Resolution Date', included: false },
    { key: 'days_to_resolve', label: 'Days to Resolve', included: false },
  ];

  const handleAdvancedExport = async (exportFormat: 'pdf' | 'csv' | 'excel', options: AdvancedExportOptions) => {
    const dataToExport = filteredData;
    
    // Prepare data based on selected columns
    const exportData = dataToExport.map(concern => {
      const row: any = {};
      options.selectedColumns.forEach(col => {
        if (col === 'reported_date' && concern.reported_date) {
          row[col] = format(new Date(concern.reported_date), 'dd/MM/yyyy');
        } else if (col === 'resolution_date' && concern.resolution_date) {
          row[col] = format(new Date(concern.resolution_date), 'dd/MM/yyyy');
        } else {
          row[col] = concern[col as keyof typeof concern] || '';
        }
      });
      return row;
    });

    const exportOptions = {
      title: 'Safeguarding & Concerns Report',
      data: exportData,
      columns: options.selectedColumns,
      branchName,
      branchId,
      metadata: options.includeMetadata ? {
        filters: {
          'Search Term': searchTerm || 'None',
          'Severity': severityFilter,
          'Status': statusFilter,
        },
        totalRecords: data?.concerns.length || 0,
        exportedRecords: dataToExport.length,
      } : undefined,
    };

    if (exportFormat === 'pdf') {
      await ReportExporter.exportToPDF(exportOptions);
    } else if (exportFormat === 'csv') {
      ReportExporter.exportToCSV(exportOptions);
    } else {
      ReportExporter.exportToExcel(exportOptions);
    }
  };

  const handleRowClick = (concern: any) => {
    setSelectedConcern(concern);
    setDetailDialogOpen(true);
  };

  const handleCardClick = (filterType: 'severity' | 'status', value: string) => {
    if (filterType === 'severity') {
      setSeverityFilter(value);
    } else {
      setStatusFilter(value);
    }
    toast.info(`Filtered by ${filterType}: ${value}`);
  };

  const handleChartClick = (data: any, filterType: 'severity' | 'status') => {
    if (data && data.name) {
      const filterValue = data.name.toLowerCase().replace(/ /g, '-');
      if (filterType === 'severity') {
        setSeverityFilter(filterValue);
      } else {
        setStatusFilter(filterValue);
      }
      toast.info(`Filtered by: ${data.name}`);
    }
  };

  const getDetailFields = (concern: any): DetailField[] => {
    if (!concern) return [];
    
    return [
      { label: 'Client Name', value: concern.client_name, section: 'General Information' },
      { label: 'Concern Type', value: concern.concern_type, section: 'General Information' },
      { label: 'Severity', value: concern.severity.toUpperCase(), type: 'badge', badgeVariant: concern.severity === 'critical' ? 'destructive' : 'default', section: 'General Information' },
      { label: 'Risk Level', value: concern.risk_level, section: 'General Information' },
      { label: 'Investigation Status', value: concern.investigation_status.replace(/-/g, ' '), type: 'badge', section: 'General Information' },
      { label: 'Reported Date', value: concern.reported_date, type: 'date', section: 'Timeline' },
      { label: 'Reported By', value: concern.reported_by, section: 'Timeline' },
      { label: 'Resolution Date', value: concern.resolution_date, type: 'date', section: 'Timeline' },
      { label: 'Days to Resolve', value: concern.days_to_resolve ? `${concern.days_to_resolve} days` : 'Ongoing', section: 'Timeline' },
      { label: 'Description', value: concern.description, type: 'longtext', section: 'Details' },
      { label: 'Investigation Notes', value: concern.investigation_notes, type: 'longtext', section: 'Investigation' },
      { label: 'Action Taken', value: concern.action_taken, type: 'longtext', section: 'Resolution' },
      { label: 'Status', value: concern.is_open ? 'Open' : 'Closed', type: 'badge', badgeVariant: concern.is_open ? 'destructive' : 'default', section: 'General Information' },
    ];
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(18);
    doc.text('Safeguarding & Concerns Report', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Branch: ${branchName}`, pageWidth / 2, 22, { align: 'center' });
    doc.text(`Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth / 2, 28, { align: 'center' });

    // Summary Stats
    if (data?.stats) {
      doc.setFontSize(14);
      doc.text('Summary Statistics', 14, 40);
      
      const statsData = [
        ['Total Concerns', data.stats.total_concerns.toString()],
        ['Open Concerns', data.stats.open_concerns.toString()],
        ['Closed Concerns', data.stats.closed_concerns.toString()],
        ['Critical Severity', data.stats.critical_severity.toString()],
        ['Under Investigation', data.stats.under_investigation.toString()],
        ['Awaiting Action', data.stats.awaiting_action.toString()],
        ['Resolved', data.stats.resolved.toString()],
        ['Avg Resolution Days', data.stats.avg_resolution_days.toString()],
        ['Overdue Investigations', data.stats.overdue_investigations.toString()],
      ];

      autoTable(doc, {
        startY: 45,
        head: [['Metric', 'Value']],
        body: statsData,
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68] },
      });
    }

    // Concerns Table
    const tableData = filteredData.map(concern => [
      concern.client_name,
      concern.concern_type,
      concern.severity.toUpperCase(),
      concern.investigation_status.replace(/-/g, ' '),
      format(new Date(concern.reported_date), 'dd/MM/yyyy'),
      concern.is_open ? 'Open' : 'Closed',
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 15,
      head: [['Client', 'Concern Type', 'Severity', 'Status', 'Reported', 'Open/Closed']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [239, 68, 68] },
    });

    doc.save(`safeguarding-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const exportToCSV = () => {
    const headers = [
      'Client Name', 'Concern Type', 'Severity', 'Risk Level', 
      'Investigation Status', 'Reported Date', 'Reported By', 
      'Description', 'Investigation Notes', 'Action Taken', 
      'Resolution Date', 'Days to Resolve', 'Open/Closed'
    ];
    
    const rows = filteredData.map(concern => [
      concern.client_name,
      concern.concern_type,
      concern.severity,
      concern.risk_level,
      concern.investigation_status,
      format(new Date(concern.reported_date), 'dd/MM/yyyy'),
      concern.reported_by,
      concern.description,
      concern.investigation_notes || '',
      concern.action_taken || '',
      concern.resolution_date ? format(new Date(concern.resolution_date), 'dd/MM/yyyy') : '',
      concern.days_to_resolve || '',
      concern.is_open ? 'Open' : 'Closed',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `safeguarding-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const getSeverityBadge = (severity: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', className?: string }> = {
      'critical': { variant: 'destructive', className: 'bg-red-600 dark:bg-red-700' },
      'high': { variant: 'destructive' },
      'medium': { variant: 'secondary' },
      'low': { variant: 'outline' },
    };

    const { variant, className } = config[severity] || { variant: 'outline' as const };
    return <Badge variant={variant} className={className}>{severity.toUpperCase()}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: React.ReactNode }> = {
      'resolved': { variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
      'under-investigation': { variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
      'awaiting-action': { variant: 'outline', icon: <AlertTriangle className="h-3 w-3" /> },
      'reported': { variant: 'outline', icon: <AlertTriangle className="h-3 w-3" /> },
    };

    const { variant, icon } = config[status] || { variant: 'outline' as const, icon: null };
    return (
      <Badge variant={variant} className="gap-1">
        {icon}
        {status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading safeguarding data...</div>
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
      {/* Summary Cards - Now Clickable */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => {
            setSeverityFilter('all');
            setStatusFilter('all');
            toast.info('Showing all concerns');
          }}
        >
          <CardHeader className="pb-2">
            <CardDescription>Total Concerns</CardDescription>
            <CardTitle className="text-3xl">{data?.stats.total_concerns || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Shield className="h-4 w-4 mr-1" />
              Click to view all
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-destructive transition-colors"
          onClick={() => handleCardClick('status', 'awaiting-action')}
        >
          <CardHeader className="pb-2">
            <CardDescription>Open Concerns</CardDescription>
            <CardTitle className="text-3xl text-destructive">{data?.stats.open_concerns || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Click to filter
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-destructive transition-colors"
          onClick={() => handleCardClick('status', 'under-investigation')}
        >
          <CardHeader className="pb-2">
            <CardDescription>Overdue Investigations</CardDescription>
            <CardTitle className="text-3xl text-destructive">{data?.stats.overdue_investigations || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              Click to filter
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => handleCardClick('status', 'resolved')}
        >
          <CardHeader className="pb-2">
            <CardDescription>Avg Resolution Time</CardDescription>
            <CardTitle className="text-3xl">{data?.stats.avg_resolution_days || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 mr-1" />
              Click to view resolved
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts - Now Interactive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Severity Distribution</CardTitle>
            <CardDescription>Click segments to filter concerns by severity</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={severityChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  onClick={(data) => handleChartClick(data, 'severity')}
                  style={{ cursor: 'pointer' }}
                >
                  {severityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Investigation Status</CardTitle>
            <CardDescription>Click bars to filter concerns by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusChartData} onClick={(data) => data?.activePayload && handleChartClick(data.activePayload[0].payload, 'status')}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS.investigating} style={{ cursor: 'pointer' }} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Concern Types</CardTitle>
            <CardDescription>Distribution of safeguarding concern categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={concernTypeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS.high} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Export */}
      <Card>
        <CardHeader>
          <CardTitle>Safeguarding Concerns Details</CardTitle>
          <CardDescription>Filter and export safeguarding concern records</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by client or concern type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="awaiting-action">Awaiting Action</SelectItem>
                <SelectItem value="under-investigation">Under Investigation</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={exportToPDF} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Quick Export PDF
            </Button>
            <Button onClick={exportToCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Quick Export CSV
            </Button>
            <AdvancedExportMenu
              columns={exportColumns}
              onExport={handleAdvancedExport}
              filterApplied={searchTerm !== '' || severityFilter !== 'all' || statusFilter !== 'all'}
              totalRowCount={data?.concerns.length || 0}
            />
          </div>

          {/* Table - Now with clickable rows */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Client</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Concern Type</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">Severity</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Reported Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Reported By</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">Days Open</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                        No safeguarding concerns found matching your filters
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((concern) => {
                      const daysOpen = Math.floor(
                        (new Date().getTime() - new Date(concern.reported_date).getTime()) / (1000 * 60 * 60 * 24)
                      );
                      
                      return (
                        <tr key={concern.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => handleRowClick(concern)}>
                          <td className="px-4 py-3 text-sm font-medium">{concern.client_name}</td>
                          <td className="px-4 py-3 text-sm">{concern.concern_type}</td>
                          <td className="px-4 py-3 text-center">{getSeverityBadge(concern.severity)}</td>
                          <td className="px-4 py-3 text-center">{getStatusBadge(concern.investigation_status)}</td>
                          <td className="px-4 py-3 text-sm">
                            {format(new Date(concern.reported_date), 'dd/MM/yyyy')}
                          </td>
                          <td className="px-4 py-3 text-sm">{concern.reported_by}</td>
                          <td className="px-4 py-3 text-center">
                            {concern.is_open ? (
                              <span className={`text-sm font-medium ${daysOpen > 7 ? 'text-destructive' : ''}`}>
                                {daysOpen} days
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {concern.days_to_resolve} days
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRowClick(concern);
                              }}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {filteredData.length} of {data?.concerns.length || 0} concerns
            {(searchTerm || severityFilter !== 'all' || statusFilter !== 'all') && (
              <Button
                variant="link"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSeverityFilter('all');
                  setStatusFilter('all');
                }}
                className="ml-2"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <DetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        title={`Safeguarding Concern: ${selectedConcern?.concern_type || ''}`}
        subtitle={`Client: ${selectedConcern?.client_name || ''}`}
        fields={getDetailFields(selectedConcern)}
        onExport={() => {
          if (selectedConcern) {
            const exportData = [selectedConcern].map(concern => ({
              'Client Name': concern.client_name,
              'Concern Type': concern.concern_type,
              'Severity': concern.severity,
              'Risk Level': concern.risk_level,
              'Status': concern.investigation_status,
              'Reported Date': format(new Date(concern.reported_date), 'dd/MM/yyyy'),
              'Reported By': concern.reported_by,
              'Description': concern.description,
              'Investigation Notes': concern.investigation_notes || '',
              'Action Taken': concern.action_taken || '',
            }));
            
            ReportExporter.exportToCSV({
              title: 'Safeguarding Concern Detail',
              data: exportData,
              columns: Object.keys(exportData[0]),
            });
            
            toast.success('Concern details exported');
          }
        }}
      />
    </div>
  );
}
