
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { Info, TrendingUp, User, Activity } from "lucide-react";
import { useNews2Patients } from "@/hooks/useNews2Data";
import { format } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface IndividualPatientChartsProps {
  branchId: string;
}

interface NormalRanges {
  respiratoryRate: { min: number; max: number; label: string };
  heartRate: { min: number; max: number; label: string };
  systolicBP: { min: number; max: number; label: string };
  oxygenSaturation: { min: number; max: number; label: string };
  temperature: { min: number; max: number; label: string };
  news2Score: { min: number; max: number; label: string };
}

const NORMAL_RANGES: NormalRanges = {
  respiratoryRate: { min: 12, max: 20, label: "12-20 breaths/min" },
  heartRate: { min: 60, max: 100, label: "60-100 bpm" },
  systolicBP: { min: 90, max: 140, label: "90-140 mmHg" },
  oxygenSaturation: { min: 95, max: 100, label: "&gt;95%" },
  temperature: { min: 36.1, max: 37.2, label: "36.1-37.2°C" },
  news2Score: { min: 0, max: 4, label: "0-4 (Low Risk)" }
};

export function IndividualPatientCharts({ branchId }: IndividualPatientChartsProps) {
  const { data: patients = [], isLoading } = useNews2Patients(branchId);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [showAllPatients, setShowAllPatients] = useState(false);
  const [expandedPatients, setExpandedPatients] = useState<Set<string>>(new Set());

  const togglePatientExpansion = (patientId: string) => {
    const newExpanded = new Set(expandedPatients);
    if (newExpanded.has(patientId)) {
      newExpanded.delete(patientId);
    } else {
      newExpanded.add(patientId);
    }
    setExpandedPatients(newExpanded);
  };

  const getRiskColor = (score: number) => {
    if (score >= 7) return "#ef4444";
    if (score >= 5) return "#f97316";
    return "#22c55e";
  };

  const getStatusColor = (value: number, range: { min: number; max: number }) => {
    if (value < range.min || value > range.max) return "#ef4444";
    return "#22c55e";
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
              {entry.dataKey === 'temperature' && '°C'}
              {entry.dataKey === 'oxygenSaturation' && '%'}
              {(entry.dataKey === 'respiratoryRate' || entry.dataKey === 'pulseRate') && ' bpm'}
              {entry.dataKey === 'systolicBP' && ' mmHg'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderPatientChart = (patient: any, isExpanded = true) => {
    // Mock observation data - in real implementation, this would come from the patient's observation history
    const observations = [
      {
        date: format(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), "MMM dd"),
        totalScore: 3,
        respiratoryRate: 16,
        heartRate: 75,
        systolicBP: 120,
        oxygenSaturation: 97,
        temperature: 36.5
      },
      {
        date: format(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), "MMM dd"),
        totalScore: 2,
        respiratoryRate: 15,
        heartRate: 72,
        systolicBP: 115,
        oxygenSaturation: 98,
        temperature: 36.3
      },
      {
        date: format(new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), "MMM dd"),
        totalScore: 4,
        respiratoryRate: 18,
        heartRate: 78,
        systolicBP: 125,
        oxygenSaturation: 96,
        temperature: 36.8
      },
      {
        date: format(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), "MMM dd"),
        totalScore: patient.latest_observation?.total_score || 1,
        respiratoryRate: 17,
        heartRate: 74,
        systolicBP: 118,
        oxygenSaturation: 97,
        temperature: 36.4
      }
    ];

    const currentScore = patient.latest_observation?.total_score || 0;
    const patientName = `${patient.client?.first_name || ''} ${patient.client?.last_name || ''}`.trim();

    return (
      <Card key={patient.id} className="mb-4">
        <Collapsible 
          open={isExpanded} 
          onOpenChange={() => !showAllPatients && togglePatientExpansion(patient.id)}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{patientName}</CardTitle>
                    <p className="text-sm text-gray-500">ID: {patient.id.slice(0, 8)}...</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Current NEWS2</div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg`} 
                         style={{ backgroundColor: getRiskColor(currentScore) }}>
                      {currentScore}
                    </div>
                  </div>
                  <Badge variant={currentScore >= 7 ? "destructive" : currentScore >= 5 ? "warning" : "outline"}>
                    {currentScore >= 7 ? "High Risk" : currentScore >= 5 ? "Medium Risk" : "Low Risk"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* NEWS2 Score Trend */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  NEWS2 Score Trend
                </h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={observations}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 15]} tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <ReferenceLine y={7} stroke="#ef4444" strokeDasharray="5 5" label="High Risk (≥7)" />
                      <ReferenceLine y={5} stroke="#f97316" strokeDasharray="5 5" label="Medium Risk (≥5)" />
                      <ReferenceLine y={4} stroke="#22c55e" strokeDasharray="5 5" label="Low Risk (≤4)" />
                      <Line 
                        type="monotone" 
                        dataKey="totalScore" 
                        stroke="#dc2626" 
                        strokeWidth={3}
                        name="NEWS2 Score"
                        dot={{ fill: '#dc2626', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Vital Signs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Respiratory & Heart Rate */}
                <div>
                  <h4 className="font-medium mb-3">Respiratory & Heart Rate</h4>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={observations}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <ReferenceLine y={12} stroke="#22c55e" strokeDasharray="3 3" />
                        <ReferenceLine y={20} stroke="#22c55e" strokeDasharray="3 3" />
                        <ReferenceLine y={60} stroke="#3b82f6" strokeDasharray="3 3" />
                        <ReferenceLine y={100} stroke="#3b82f6" strokeDasharray="3 3" />
                        <Line type="monotone" dataKey="respiratoryRate" stroke="#3b82f6" name="Respiratory Rate" strokeWidth={2} />
                        <Line type="monotone" dataKey="heartRate" stroke="#ef4444" name="Heart Rate" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Normal: Respiratory 12-20 bpm, Heart 60-100 bpm
                  </div>
                </div>

                {/* Blood Pressure & Oxygen Saturation */}
                <div>
                  <h4 className="font-medium mb-3">Blood Pressure & O₂ Saturation</h4>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={observations}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <ReferenceLine y={90} stroke="#8b5cf6" strokeDasharray="3 3" />
                        <ReferenceLine y={140} stroke="#8b5cf6" strokeDasharray="3 3" />
                        <ReferenceLine y={95} stroke="#10b981" strokeDasharray="3 3" />
                        <Line type="monotone" dataKey="systolicBP" stroke="#8b5cf6" name="Systolic BP" strokeWidth={2} />
                        <Line type="monotone" dataKey="oxygenSaturation" stroke="#10b981" name="O₂ Saturation" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Normal: BP 90-140 mmHg, O₂ Sat &gt;95%
                  </div>
                </div>

                {/* Temperature */}
                <div className="md:col-span-2">
                  <h4 className="font-medium mb-3">Temperature Trend</h4>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={observations}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis domain={[35, 40]} tick={{ fontSize: 10 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <ReferenceLine y={36.1} stroke="#22c55e" strokeDasharray="3 3" label="Normal Range" />
                        <ReferenceLine y={37.2} stroke="#22c55e" strokeDasharray="3 3" />
                        <Line type="monotone" dataKey="temperature" stroke="#f59e0b" name="Temperature (°C)" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Normal: 36.1-37.2°C
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Normal Ranges Reference Panel */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Info className="h-5 w-5" />
            Normal Ranges & Clinical Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Vital Signs</h4>
              <ul className="text-sm space-y-1">
                <li>• Respiratory Rate: {NORMAL_RANGES.respiratoryRate.label}</li>
                <li>• Heart Rate: {NORMAL_RANGES.heartRate.label}</li>
                <li>• Blood Pressure: {NORMAL_RANGES.systolicBP.label}</li>
                <li>• Oxygen Saturation: {NORMAL_RANGES.oxygenSaturation.label}</li>
                <li>• Temperature: {NORMAL_RANGES.temperature.label}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">NEWS2 Risk Levels</h4>
              <ul className="text-sm space-y-1">
                <li>• <span className="text-green-600">Low Risk:</span> 0-4 (routine monitoring)</li>
                <li>• <span className="text-orange-600">Medium Risk:</span> 5-6 (increased monitoring)</li>
                <li>• <span className="text-red-600">High Risk:</span> 7+ (urgent response)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Escalation Protocol</h4>
              <ul className="text-sm space-y-1">
                <li>• Score 0-4: Monitor every 12 hours</li>
                <li>• Score 5-6: Monitor every 4-6 hours</li>
                <li>• Score 7+: Immediate clinical review</li>
                <li>• Any single parameter scoring 3: Review</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient Selection Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="flex-1">
          <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
            <SelectTrigger className="w-full md:w-80">
              <SelectValue placeholder="Select a patient to view their charts" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((patient) => (
                <SelectItem key={patient.id} value={patient.id}>
                  {`${patient.client?.first_name || ''} ${patient.client?.last_name || ''}`.trim()} 
                  (Score: {patient.latest_observation?.total_score || 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={showAllPatients ? "default" : "outline"}
            onClick={() => {
              setShowAllPatients(!showAllPatients);
              if (!showAllPatients) {
                setExpandedPatients(new Set(patients.map(p => p.id)));
              }
            }}
          >
            <Activity className="h-4 w-4 mr-2" />
            {showAllPatients ? "Hide All" : "Show All Patients"}
          </Button>
        </div>
      </div>

      {/* Charts Display */}
      <div className="space-y-4">
        {showAllPatients ? (
          // Show all patients with collapsible charts
          <div className="space-y-4">
            <h3 className="text-lg font-medium">All Patient Charts</h3>
            {patients.map(patient => renderPatientChart(patient, expandedPatients.has(patient.id)))}
          </div>
        ) : selectedPatientId ? (
          // Show selected patient chart
          <div>
            <h3 className="text-lg font-medium mb-4">Individual Patient Chart</h3>
            {patients
              .filter(p => p.id === selectedPatientId)
              .map(patient => renderPatientChart(patient, true))}
          </div>
        ) : (
          // No selection state
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Patient</h3>
              <p className="text-gray-500 mb-4">
                Choose a patient from the dropdown above to view their individual charts and trends,
                or click "Show All Patients" to see all patient charts at once.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
