
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  FileText, 
  PlusCircle, 
  Share, 
  Bell, 
  Calendar, 
  Printer, 
  Download, 
  Mail
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate, useParams } from "react-router-dom";
import { 
  mockNews2Patients, 
  mockNews2Observations, 
  News2Patient, 
  News2Observation, 
  getScoreStatusColor,
  getScoreStatusText,
  generateMockObservationsForPatient
} from "@/data/mockNews2Data";
import { AddNews2ObservationDialog } from "./AddNews2ObservationDialog";
import { News2AlertSettingsDialog } from "./News2AlertSettingsDialog";
import { News2ObservationDetails } from "./News2ObservationDetails";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from "sonner";

export const News2PatientDetails: React.FC = () => {
  const { patientId, branchId } = useParams<{ patientId: string, branchId: string }>();
  const navigate = useNavigate();
  
  const [patient, setPatient] = useState<News2Patient | undefined>(undefined);
  const [observations, setObservations] = useState<News2Observation[]>([]);
  const [selectedObservation, setSelectedObservation] = useState<News2Observation | null>(null);
  const [newObservationDialogOpen, setNewObservationDialogOpen] = useState(false);
  const [alertSettingsDialogOpen, setAlertSettingsDialogOpen] = useState(false);
  const [observationDetailsDialogOpen, setObservationDetailsDialogOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'table' | 'chart'>('table');
  
  useEffect(() => {
    if (patientId) {
      // Find patient data
      const foundPatient = mockNews2Patients.find(p => p.id === patientId);
      setPatient(foundPatient);
      
      if (foundPatient) {
        // Find observations for this patient
        let patientObservations = mockNews2Observations.filter(o => o.patientId === patientId);
        
        // If we have less than 3 observations, generate some mock ones
        if (patientObservations.length < 3) {
          const generatedObservations = generateMockObservationsForPatient(patientId);
          patientObservations = [...patientObservations, ...generatedObservations];
        }
        
        // Sort observations by timestamp (newest first)
        patientObservations.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        setObservations(patientObservations);
      }
    }
  }, [patientId]);
  
  const handleBack = () => {
    navigate(`/branch-dashboard/${branchId}/reports`);
  };
  
  const handleViewObservation = (observation: News2Observation) => {
    setSelectedObservation(observation);
    setObservationDetailsDialogOpen(true);
  };
  
  const handleExportPDF = () => {
    toast.success("Exporting NEWS2 report as PDF");
  };
  
  const handleEmailReport = () => {
    toast.success("Preparing to email NEWS2 report");
  };
  
  // Prepare data for the chart
  const chartData = observations.slice().reverse().map(obs => ({
    date: format(obs.timestamp, 'MMM dd, HH:mm'),
    score: obs.score,
    timestamp: obs.timestamp.getTime(),
  }));
  
  if (!patient) {
    return (
      <div className="p-8 text-center">
        <p>Patient not found</p>
        <Button variant="link" onClick={handleBack}>Return to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={handleBack} className="p-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold">
          Patient NEWS2 Record
        </h2>
      </div>
      
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-bold">{patient.name}</CardTitle>
              <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                <span>ID: {patient.id}</span>
                <span>•</span>
                <span>Age: {patient.age}</span>
                <span>•</span>
                <span>Client ID: {patient.clientId}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {patient.latestScore !== undefined && (
                <div className="flex flex-col items-center">
                  <div className="text-sm text-gray-500">Latest Score</div>
                  <Badge className={`text-lg px-3 py-1 ${getScoreStatusColor(patient.latestScore)}`}>
                    {patient.latestScore}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-6">
            <Button onClick={() => setNewObservationDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Observation
            </Button>
            <Button variant="outline" onClick={() => setAlertSettingsDialogOpen(true)}>
              <Bell className="h-4 w-4 mr-2" />
              Alert Settings
            </Button>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Patient Notes
            </Button>
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              History
            </Button>
            
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="icon" onClick={handleExportPDF}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Printer className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleEmailReport}>
                <Mail className="h-4 w-4" />
              </Button>
              <Button variant="outline">
                <Share className="h-4 w-4 mr-1" />
                Share
              </Button>
            </div>
          </div>
          
          <div>
            <Tabs 
              value={currentView} 
              onValueChange={(value) => setCurrentView(value as 'table' | 'chart')}
              className="mb-4"
            >
              <TabsList>
                <TabsTrigger value="table">Table View</TabsTrigger>
                <TabsTrigger value="chart">Chart View</TabsTrigger>
              </TabsList>
            </Tabs>
            
            {currentView === 'table' ? (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Date & Time</TableHead>
                      <TableHead className="text-center">Respiratory Rate</TableHead>
                      <TableHead className="text-center">SpO2</TableHead>
                      <TableHead className="text-center">Oxygen</TableHead>
                      <TableHead className="text-center">Systolic BP</TableHead>
                      <TableHead className="text-center">Pulse</TableHead>
                      <TableHead className="text-center">Consciousness</TableHead>
                      <TableHead className="text-center">Temp</TableHead>
                      <TableHead className="text-center">Score</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {observations.map((observation) => (
                      <TableRow key={observation.id}>
                        <TableCell className="font-medium">{format(observation.timestamp, 'PPp')}</TableCell>
                        <TableCell className="text-center">{observation.respiratoryRate}</TableCell>
                        <TableCell className="text-center">{observation.oxygenSaturation}%</TableCell>
                        <TableCell className="text-center">{observation.supplementalOxygen ? 'Yes' : 'No'}</TableCell>
                        <TableCell className="text-center">{observation.systolicBP}</TableCell>
                        <TableCell className="text-center">{observation.pulseRate}</TableCell>
                        <TableCell className="text-center">{observation.consciousness}</TableCell>
                        <TableCell className="text-center">{observation.temperature.toFixed(1)}°C</TableCell>
                        <TableCell className="text-center">
                          <Badge className={`${getScoreStatusColor(observation.score)}`}>
                            {observation.score}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={`${getScoreStatusColor(observation.score)} border-0`}>
                            {getScoreStatusText(observation.score)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="link" 
                            className="p-0 h-auto text-blue-600"
                            onClick={() => handleViewObservation(observation)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <Card className="p-4">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickMargin={10}
                      />
                      <YAxis 
                        domain={[0, 12]}
                        tickCount={13}
                      />
                      <Tooltip 
                        formatter={(value) => [`Score: ${value}`, 'NEWS2']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#2563eb" 
                        strokeWidth={2}
                        dot={{ r: 6 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500 text-center">
                    NEWS2 Score Timeline - {observations.length} observations
                  </p>
                  <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                      <span className="text-sm">Low Risk (0-4)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-amber-600 rounded-full"></div>
                      <span className="text-sm">Medium Risk (5-6)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                      <span className="text-sm">High Risk (7+)</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Dialog components */}
      <AddNews2ObservationDialog 
        patient={patient}
        open={newObservationDialogOpen} 
        onOpenChange={setNewObservationDialogOpen}
        onObservationAdded={(newObservation) => {
          setObservations([newObservation, ...observations]);
          
          // Update patient's latest score
          setPatient({
            ...patient,
            latestScore: newObservation.score,
            latestTimestamp: newObservation.timestamp
          });
        }}
      />
      
      <News2AlertSettingsDialog
        patient={patient}
        open={alertSettingsDialogOpen}
        onOpenChange={setAlertSettingsDialogOpen}
      />
      
      {selectedObservation && (
        <News2ObservationDetails
          observation={selectedObservation}
          open={observationDetailsDialogOpen}
          onOpenChange={setObservationDetailsDialogOpen}
        />
      )}
    </div>
  );
};
