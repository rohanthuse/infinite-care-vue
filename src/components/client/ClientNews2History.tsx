import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Calendar, TrendingUp, User, ChevronDown, ChevronUp, ClipboardList } from "lucide-react";
import { ClientNews2Observation } from "@/hooks/useClientNews2Data";
import { format } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Extended observation type that includes visit context
interface ObservationWithContext extends ClientNews2Observation {
  visit_context?: {
    booking_id?: string;
    booking_reference?: string;
    visit_date?: string;
    carer_name?: string;
  };
}

interface ClientNews2HistoryProps {
  observations: ObservationWithContext[];
}

export const ClientNews2History = ({ observations }: ClientNews2HistoryProps) => {
  const [showChart, setShowChart] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  // Cast observations to extended type
  const extendedObservations = observations as ObservationWithContext[];

  if (extendedObservations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            Your Health History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No observation history available yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Your monitoring data will appear here once your care team starts tracking your vital signs during visits.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data (reverse to show chronological order)
  const chartData = extendedObservations
    .slice()
    .reverse()
    .slice(-14) // Last 14 observations for better visualization
    .map((obs, index) => ({
      date: format(new Date(obs.recorded_at), 'MMM d'),
      fullDate: obs.recorded_at,
      score: obs.total_score,
      risk: obs.risk_level,
      index: index,
      hasVisitContext: !!obs.visit_context?.booking_id,
    }));

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high': return <Badge variant="destructive">High</Badge>;
      case 'medium': return <Badge className="bg-orange-500 text-white">Medium</Badge>;
      case 'low': return <Badge className="bg-green-500 text-white">Low</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{format(new Date(data.fullDate), 'MMM d, yyyy HH:mm')}</p>
          <p className="text-sm">
            <span className="text-blue-600">Score: {data.score}</span>
          </p>
          <p className="text-sm capitalize">
            <span className="text-gray-600">Risk: {data.risk}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Chart Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Your Health Trend
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChart(!showChart)}
            >
              {showChart ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showChart ? 'Hide Chart' : 'Show Chart'}
            </Button>
          </div>
        </CardHeader>
        <Collapsible open={showChart} onOpenChange={setShowChart}>
          <CollapsibleContent>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      domain={[0, 15]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    
                    {/* Reference lines for risk levels */}
                    <ReferenceLine y={5} stroke="#f59e0b" strokeDasharray="2 2" />
                    <ReferenceLine y={7} stroke="#ef4444" strokeDasharray="2 2" />
                    
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex justify-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-green-500"></div>
                  <span>Low Risk (0-4)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-orange-500"></div>
                  <span>Medium Risk (5-6)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-red-500"></div>
                  <span>High Risk (7+)</span>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Recent Observations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Recent Observations
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showDetails ? 'Show Less' : 'Show Details'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {extendedObservations.slice(0, showDetails ? extendedObservations.length : 5).map((observation) => (
              <div key={observation.id} className="p-4 bg-muted/50 dark:bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                      observation.total_score >= 7 ? 'bg-red-500' :
                      observation.total_score >= 5 ? 'bg-orange-500' : 'bg-green-500'
                    }`}>
                      {observation.total_score}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {format(new Date(observation.recorded_at), 'MMM d, yyyy')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(observation.recorded_at), 'HH:mm')}
                        {observation.recorded_by && (
                          <span className="ml-2">
                            by {observation.recorded_by.first_name} {observation.recorded_by.last_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {getRiskBadge(observation.risk_level)}
                    {observation.notes && (
                      <p className="text-xs text-muted-foreground mt-1 max-w-xs truncate">
                        {observation.notes}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Visit Context - Shows booking/visit details when available */}
                {observation.visit_context?.booking_id && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <ClipboardList className="h-3.5 w-3.5" />
                        <span>Visit Ref:</span>
                        <span className="font-mono text-foreground">
                          #{observation.visit_context.booking_reference || observation.visit_context.booking_id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>
                      {observation.visit_context.carer_name && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <User className="h-3.5 w-3.5" />
                          <span>Carer:</span>
                          <span className="text-foreground">{observation.visit_context.carer_name}</span>
                        </div>
                      )}
                      {observation.visit_context.visit_date && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Visit:</span>
                          <span className="text-foreground">
                            {format(new Date(observation.visit_context.visit_date), 'MMM d, HH:mm')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {extendedObservations.length > 5 && !showDetails && (
            <div className="text-center mt-4">
              <Button
                variant="outline"
                onClick={() => setShowDetails(true)}
              >
                View All {extendedObservations.length} Observations
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};