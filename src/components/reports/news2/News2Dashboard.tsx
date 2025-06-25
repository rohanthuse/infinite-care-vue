
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, AlertTriangle, ArrowDown, ArrowUp, Clock, Filter, Search, FileText, BarChart3, Users, User, CheckCircle, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNews2Patients, useNews2Alerts } from "@/hooks/useNews2Data";
import { News2AnalyticsDashboard } from "./News2AnalyticsDashboard";
import { IndividualPatientCharts } from "./IndividualPatientCharts";
import { AlertManagementDialog } from "./AlertManagementDialog";
import { format } from "date-fns";
import { toast } from "sonner";
import { generateNews2PDF } from "@/utils/pdfGenerator";

interface News2DashboardProps {
  branchId: string;
  branchName: string;
}

export const News2Dashboard = ({ branchId, branchName }: News2DashboardProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [alertFilter, setAlertFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  
  const { data: patients = [], isLoading, error } = useNews2Patients(branchId);
  const { data: alerts = [], isLoading: alertsLoading } = useNews2Alerts(branchId);
  
  // Filter patients based on search and risk level
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = searchQuery === "" || 
      (patient.client?.first_name + " " + patient.client?.last_name).toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const latestScore = patient.latest_observation?.total_score || 0;
    const matchesRisk = riskFilter === "all" || 
      (riskFilter === "high" && latestScore >= 7) ||
      (riskFilter === "medium" && latestScore >= 5 && latestScore < 7) ||
      (riskFilter === "low" && latestScore < 5);
    
    return matchesSearch && matchesRisk;
  });

  // Filter alerts based on severity
  const filteredAlerts = alerts.filter(alert => {
    if (alertFilter === "all") return true;
    return alert.severity === alertFilter;
  });
  
  const handleExportPatient = (patient: any) => {
    try {
      // Convert real patient data to format expected by PDF generator
      const pdfPatient = {
        id: patient.id,
        name: `${patient.client?.first_name || ''} ${patient.client?.last_name || ''}`.trim(),
        age: patient.client?.date_of_birth ? 
          new Date().getFullYear() - new Date(patient.client.date_of_birth).getFullYear() : 0,
        latestScore: patient.latest_observation?.total_score || 0,
        trend: "stable", // Could be calculated from observation history
        lastUpdated: patient.latest_observation?.recorded_at || patient.updated_at,
        riskLevel: patient.latest_observation?.risk_level || patient.risk_category
      };
      
      generateNews2PDF(pdfPatient, branchName);
      toast.success("PDF exported successfully", {
        description: `NEWS2 report for ${pdfPatient.name} has been downloaded`
      });
    } catch (error) {
      toast.error("Export failed", {
        description: "There was a problem exporting the report"
      });
    }
  };
  
  const getRiskBadge = (score: number) => {
    if (score >= 7) {
      return <Badge variant="destructive" className="whitespace-nowrap">High Risk</Badge>;
    } else if (score >= 5) {
      return <Badge variant="warning" className="bg-orange-500 whitespace-nowrap">Medium Risk</Badge>;
    }
    return <Badge variant="outline" className="bg-green-100 text-green-800 whitespace-nowrap">Low Risk</Badge>;
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive" className="bg-red-600">Critical</Badge>;
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="warning" className="bg-orange-500">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'high_score':
        return 'High Score Alert';
      case 'deteriorating':
        return 'Deteriorating Condition';
      case 'overdue_observation':
        return 'Overdue Observation';
      default:
        return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };
  
  const getTrendIcon = () => {
    // For now, show stable. Could be enhanced to calculate actual trends from observation history
    return <span>–</span>;
  };
  
  // Calculate summary stats from real data
  const highRiskCount = patients.filter(p => (p.latest_observation?.total_score || 0) >= 7).length;
  const mediumRiskCount = patients.filter(p => {
    const score = p.latest_observation?.total_score || 0;
    return score >= 5 && score < 7;
  }).length;
  const lowRiskCount = patients.filter(p => (p.latest_observation?.total_score || 0) < 5).length;

  // Calculate alert counts
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
  const highAlerts = alerts.filter(a => a.severity === 'high').length;
  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged).length;
  
  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-500 mb-2">Error loading NEWS2 data</p>
        <p className="text-sm text-gray-500">{error.message}</p>
      </div>
    );
  }
  
  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium text-gray-500">High Risk</h3>
                <p className="text-2xl font-bold">{highRiskCount}</p>
              </div>
              <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
                NEWS2 ≥ 7
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Medium Risk</h3>
                <p className="text-2xl font-bold">{mediumRiskCount}</p>
              </div>
              <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm">
                NEWS2 5-6
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Low Risk</h3>
                <p className="text-2xl font-bold">{lowRiskCount}</p>
              </div>
              <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                NEWS2 &lt; 5
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Different Views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics Overview
          </TabsTrigger>
          <TabsTrigger value="individual" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Individual Charts
          </TabsTrigger>
          <TabsTrigger value="patients" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Patient List
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2 relative">
            <AlertTriangle className="h-4 w-4" />
            Clinical Alerts
            {unacknowledgedAlerts > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unacknowledgedAlerts}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <News2AnalyticsDashboard branchId={branchId} />
        </TabsContent>

        <TabsContent value="individual" className="mt-6">
          <IndividualPatientCharts branchId={branchId} />
        </TabsContent>

        <TabsContent value="patients" className="mt-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input 
                className="pl-8"
                placeholder="Search patients by name or ID" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by risk level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Patients</SelectItem>
                <SelectItem value="high">High Risk (7+)</SelectItem>
                <SelectItem value="medium">Medium Risk (5-6)</SelectItem>
                <SelectItem value="low">Low Risk (0-4)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Patients Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Patient NEWS2 Scores</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center">
                  <div className="w-8 h-8 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mx-auto mb-4"></div>
                  <p>Loading patient data...</p>
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-500">
                    {patients.length === 0 ? "No patients found in NEWS2 monitoring" : "No patients match the current filters"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Latest Score</TableHead>
                        <TableHead>Risk Level</TableHead>
                        <TableHead>Trend</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPatients.map((patient) => {
                        const score = patient.latest_observation?.total_score || 0;
                        const patientName = `${patient.client?.first_name || ''} ${patient.client?.last_name || ''}`.trim() || 'Unknown Patient';
                        const lastUpdated = patient.latest_observation?.recorded_at || patient.updated_at;
                        
                        return (
                          <TableRow key={patient.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{patientName}</div>
                                <div className="text-sm text-gray-500">ID: {patient.id.slice(0, 8)}...</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium ${
                                score >= 7 
                                  ? "bg-red-500" 
                                  : score >= 5 
                                    ? "bg-orange-500" 
                                    : "bg-green-500"
                              }`}>
                                {score}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getRiskBadge(score)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {getTrendIcon()}
                                <span className="text-sm">Stable</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-gray-400" />
                                <span className="text-sm">
                                  {format(new Date(lastUpdated), "dd MMM, HH:mm")}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleExportPatient(patient)}
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  Export
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          {/* Alert Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border-l-4 border-l-red-600">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Critical Alerts</h3>
                    <p className="text-2xl font-bold text-red-600">{criticalAlerts}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">High Priority</h3>
                    <p className="text-2xl font-bold text-orange-500">{highAlerts}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Unacknowledged</h3>
                    <p className="text-2xl font-bold text-blue-600">{unacknowledgedAlerts}</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alert Filters */}
          <div className="flex gap-4 mb-6">
            <Select value={alertFilter} onValueChange={setAlertFilter}>
              <SelectTrigger className="w-48">
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
          </div>

          {/* Alerts Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Active Clinical Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alertsLoading ? (
                <div className="py-8 text-center">
                  <div className="w-8 h-8 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mx-auto mb-4"></div>
                  <p>Loading alerts...</p>
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">No active alerts</p>
                  <p className="text-sm mt-2">
                    {alerts.length === 0 
                      ? "All patients are stable with no clinical alerts"
                      : "No alerts match the current filter"
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAlerts.map((alert) => {
                    // Find the patient for this alert
                    const patient = patients.find(p => p.id === alert.news2_patient_id);
                    const patientName = patient?.client ? 
                      `${patient.client.first_name} ${patient.client.last_name}` : 
                      'Unknown Patient';

                    return (
                      <Card key={alert.id} className={`border-l-4 ${
                        alert.severity === 'critical' ? 'border-l-red-600 bg-red-50' :
                        alert.severity === 'high' ? 'border-l-red-500 bg-red-50' :
                        alert.severity === 'medium' ? 'border-l-orange-500 bg-orange-50' :
                        'border-l-yellow-500 bg-yellow-50'
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <AlertTriangle className={`h-5 w-5 ${
                                  alert.severity === 'critical' || alert.severity === 'high' ? 'text-red-500' :
                                  alert.severity === 'medium' ? 'text-orange-500' : 'text-yellow-500'
                                }`} />
                                <div>
                                  <h4 className="font-semibold text-gray-900">{patientName}</h4>
                                  <p className="text-sm text-gray-600">{getAlertTypeLabel(alert.alert_type)}</p>
                                </div>
                              </div>
                              
                              <p className="text-sm text-gray-800 mb-3">{alert.message}</p>
                              
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{format(new Date(alert.created_at), "dd MMM, HH:mm")}</span>
                                </div>
                                {alert.acknowledged && (
                                  <div className="flex items-center gap-1 text-green-600">
                                    <CheckCircle className="h-3 w-3" />
                                    <span>Acknowledged</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-2">
                              {getSeverityBadge(alert.severity)}
                              
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setSelectedAlert(alert)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Details
                                </Button>
                                
                                {!alert.acknowledged && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="text-green-600 border-green-600 hover:bg-green-50"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Acknowledge
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alert Management Dialog */}
      {selectedAlert && (
        <AlertManagementDialog
          alert={selectedAlert}
          patient={patients.find(p => p.id === selectedAlert.news2_patient_id)}
          onClose={() => setSelectedAlert(null)}
        />
      )}
    </div>
  );
};
