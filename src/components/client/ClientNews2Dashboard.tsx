import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Calendar, Clock, Heart, Info, TrendingUp, Thermometer, Wind, Droplets, HelpCircle } from "lucide-react";
import { useClientNews2Data, useClientNews2History } from "@/hooks/useClientNews2Data";
import { useClientNavigation } from "@/hooks/useClientNavigation";
import { format } from "date-fns";
import { ClientNews2History } from "./ClientNews2History";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AIRecommendationsCard } from "@/components/news2/AIRecommendationsCard";
import { formatNews2Frequency } from "@/utils/news2FrequencyUtils";

export const ClientNews2Dashboard = ({ isAdminView = false }: { isAdminView?: boolean } = {}) => {
  const { data: news2Data, isLoading, error } = useClientNews2Data();
  const { data: observations } = useClientNews2History();
  const { navigateToClientPage } = useClientNavigation();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const handleRequestMonitoring = () => {
    navigateToClientPage('/support', {
      defaultMessage: 'I would like to request health monitoring (NEWS2) to be set up for my account. Please help me get enrolled in the health monitoring system.',
      subject: 'Health Monitoring Request'
    });
  };

  if (error || !news2Data) {
    return (
      <div className="text-center py-12 max-w-md mx-auto">
        <Activity className="h-16 w-16 text-blue-500 mx-auto mb-6" />
        
        {isAdminView ? (
          <>
            <h3 className="text-xl font-semibold text-foreground mb-3">Client Not Enrolled in Health Monitoring</h3>
            <p className="text-muted-foreground mb-4">
              This client is not currently enrolled in NEWS2 health monitoring.
            </p>
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">What is NEWS2 Health Monitoring?</h4>
              <ul className="text-sm text-blue-700 dark:text-blue-400 text-left space-y-1">
                <li>• Regular tracking of vital signs like heart rate and blood pressure</li>
                <li>• Early detection of health changes</li>
                <li>• Better coordination with care teams</li>
                <li>• Personalized health insights and trends</li>
              </ul>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-xl font-semibold text-foreground mb-3">Health Monitoring Not Available</h3>
            <p className="text-muted-foreground mb-4">
              You're not currently enrolled in NEWS2 health monitoring. This service tracks your vital signs and helps your care team monitor your wellbeing.
            </p>
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">What is NEWS2 Health Monitoring?</h4>
              <ul className="text-sm text-blue-700 dark:text-blue-400 text-left space-y-1">
                <li>• Regular tracking of vital signs like heart rate and blood pressure</li>
                <li>• Early detection of health changes</li>
                <li>• Better coordination with your care team</li>
                <li>• Personalized health insights and trends</li>
              </ul>
            </div>
          </>
        )}
        {isAdminView ? (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              This client is not currently enrolled in NEWS2 health monitoring.
              You can set up monitoring through the client's care plan or contact your system administrator.
            </p>
          </div>
        ) : (
          <>
            <Button 
              onClick={handleRequestMonitoring}
              className="mb-4"
              size="lg"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Request Health Monitoring
            </Button>
            <p className="text-sm text-muted-foreground">
              Or contact your care team directly if you believe this is an error.
            </p>
          </>
        )}
      </div>
    );
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-700';
      case 'medium': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-700';
      case 'low': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-700';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high': return <Badge variant="destructive">High Risk</Badge>;
      case 'medium': return <Badge className="bg-orange-500 text-white">Medium Risk</Badge>;
      case 'low': return <Badge className="bg-green-500 text-white">Low Risk</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'bg-red-500 text-white';
    if (score >= 5) return 'bg-orange-500 text-white';
    return 'bg-green-500 text-white';
  };

  const latestObservation = news2Data.latest_observation;
  const currentScore = latestObservation?.total_score || 0;
  const currentRisk = latestObservation?.risk_level || news2Data.risk_category;

  return (
    <div className="space-y-6">
      {/* Welcome and Education */}
      <Alert className="border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30">
        <Info className="h-4 w-4" />
        <AlertTitle className="text-foreground">About Your Health Monitoring</AlertTitle>
        <AlertDescription className="text-muted-foreground">
          NEWS2 (National Early Warning Score) helps monitor your health by tracking vital signs like heart rate, 
          blood pressure, and temperature. Your care team uses this information to ensure you're receiving the best possible care.
        </AlertDescription>
      </Alert>

      {/* Current Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className={`border-2 ${getRiskColor(currentRisk)}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Current Status</p>
                {getRiskBadge(currentRisk)}
                <div className="mt-2">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${getScoreColor(currentScore)} font-bold`}>
                    {currentScore}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">NEWS2 Score</p>
                </div>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Monitoring Frequency</p>
                <p className="text-2xl font-bold text-foreground">{formatNews2Frequency(news2Data.monitoring_frequency)}</p>
                <p className="text-xs text-muted-foreground mt-1">Check intervals</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Last Checked</p>
                <p className="text-lg font-semibold text-foreground">
                  {latestObservation ? format(new Date(latestObservation.recorded_at), 'MMM d, yyyy') : 'No data'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {latestObservation ? format(new Date(latestObservation.recorded_at), 'HH:mm') : ''}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      {latestObservation?.ai_recommendations && (
        <AIRecommendationsCard
          recommendations={latestObservation.ai_recommendations}
          observationDate={latestObservation.recorded_at}
          totalScore={latestObservation.total_score}
          riskLevel={latestObservation.risk_level}
        />
      )}

      {/* Latest Vital Signs */}
      {latestObservation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Latest Vital Signs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-muted/50 dark:bg-muted/30 rounded-lg">
                <Wind className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Breathing Rate</p>
                  <p className="font-semibold text-foreground">{latestObservation.respiratory_rate}/min</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-muted/50 dark:bg-muted/30 rounded-lg">
                <Droplets className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Oxygen Level</p>
                  <p className="font-semibold text-foreground">{latestObservation.oxygen_saturation}%</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-muted/50 dark:bg-muted/30 rounded-lg">
                <Heart className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Heart Rate</p>
                  <p className="font-semibold text-foreground">{latestObservation.pulse_rate}/min</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-muted/50 dark:bg-muted/30 rounded-lg">
                <Thermometer className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Temperature</p>
                  <p className="font-semibold text-foreground">{latestObservation.temperature}°C</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Blood Pressure:</strong> {latestObservation.systolic_bp}{latestObservation.diastolic_bp ? `/${latestObservation.diastolic_bp}` : ''} mmHg
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                <strong>Alertness:</strong> {latestObservation.consciousness_level === 'A' ? 'Alert' : 
                  latestObservation.consciousness_level === 'V' ? 'Responds to Voice' :
                  latestObservation.consciousness_level === 'P' ? 'Responds to Pain' :
                  latestObservation.consciousness_level === 'U' ? 'Unresponsive' : 'Unknown'}
              </p>
              {latestObservation.supplemental_oxygen && (
                <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                  <strong>Oxygen Support:</strong> Yes
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* History Section */}
      <ClientNews2History observations={observations || []} />

      {/* Educational Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            Understanding Your NEWS2 Score
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  0-4
                </div>
                <span className="font-medium text-green-800 dark:text-green-300">Low Risk</span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-400">Normal monitoring. Your vital signs are within expected ranges.</p>
            </div>
            
            <div className="p-4 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  5-6
                </div>
                <span className="font-medium text-orange-800 dark:text-orange-300">Medium Risk</span>
              </div>
              <p className="text-sm text-orange-700 dark:text-orange-400">Increased monitoring. Your care team will check on you more frequently.</p>
            </div>
            
            <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  7+
                </div>
                <span className="font-medium text-red-800 dark:text-red-300">High Risk</span>
              </div>
              <p className="text-sm text-red-700 dark:text-red-400">Close monitoring. Your care team will respond promptly to any changes.</p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-700 rounded-lg">
            <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">What do the measurements mean?</h4>
            <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
              <li><strong>Breathing Rate:</strong> How many breaths you take per minute (normal: 12-20)</li>
              <li><strong>Oxygen Level:</strong> How well oxygen is carried in your blood (normal: 95%+)</li>
              <li><strong>Heart Rate:</strong> How fast your heart beats per minute (normal: 60-100)</li>
              <li><strong>Blood Pressure:</strong> The pressure in your blood vessels (normal: around 120)</li>
              <li><strong>Temperature:</strong> Your body temperature (normal: 36-37.5°C)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
