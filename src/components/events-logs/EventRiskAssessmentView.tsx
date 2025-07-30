import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, MapPin, RefreshCw, Lightbulb } from 'lucide-react';

interface EventRiskAssessmentViewProps {
  riskLevel?: string;
  contributingFactors?: string[];
  environmentalFactors?: string;
  preventable?: boolean;
  similarIncidents?: string;
}

export function EventRiskAssessmentView({ 
  riskLevel,
  contributingFactors,
  environmentalFactors,
  preventable,
  similarIncidents
}: EventRiskAssessmentViewProps) {
  const hasRiskData = riskLevel || contributingFactors?.length || environmentalFactors || preventable !== undefined || similarIncidents;
  
  if (!hasRiskData) return null;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        Risk Assessment
      </h4>
      
      <div className="space-y-4">
        {/* Risk Level */}
        {riskLevel && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Risk Level:</span>
            <Badge className={getRiskColor(riskLevel)}>
              {riskLevel.toUpperCase()}
            </Badge>
            {preventable !== undefined && (
              <Badge variant={preventable ? "destructive" : "secondary"}>
                {preventable ? "Preventable" : "Not Preventable"}
              </Badge>
            )}
          </div>
        )}

        {/* Contributing Factors */}
        {contributingFactors && contributingFactors.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Lightbulb className="h-4 w-4 text-orange-600" />
              Contributing Factors
            </div>
            <div className="flex flex-wrap gap-1">
              {contributingFactors.map((factor, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {factor}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Environmental Factors */}
        {environmentalFactors && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4 text-blue-600" />
              Environmental Factors
            </div>
            <div className="bg-gray-50 rounded p-3 text-sm">
              {environmentalFactors}
            </div>
          </div>
        )}

        {/* Similar Incidents */}
        {similarIncidents && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <RefreshCw className="h-4 w-4 text-purple-600" />
              Similar Incidents
            </div>
            <div className="bg-gray-50 rounded p-3 text-sm">
              {similarIncidents}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}