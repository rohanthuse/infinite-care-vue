import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, AlertTriangle, Home, FileWarning } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useClientSafeguarding } from '@/hooks/useClientSafeguarding';

interface SafeguardingRisksSectionProps {
  clientId: string;
}

const riskLevelColors: Record<string, string> = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  high: 'bg-red-100 text-red-800 border-red-200'
};

export function SafeguardingRisksSection({ clientId }: SafeguardingRisksSectionProps) {
  const { data: safeguarding, isLoading } = useClientSafeguarding(clientId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const latestRecord = safeguarding?.[0];

  if (!latestRecord) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            Safeguarding & Risks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No safeguarding information has been recorded yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const RiskBadge = ({ level }: { level: string | null }) => {
    if (!level) return <Badge variant="outline">Not Assessed</Badge>;
    return (
      <Badge className={riskLevelColors[level.toLowerCase()] || 'bg-muted'}>
        {level.charAt(0).toUpperCase() + level.slice(1)} Risk
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Risk Assessment Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Absconding Risk</span>
                <RiskBadge level={latestRecord.absconding_risk} />
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Self-Harm Risk</span>
                <RiskBadge level={latestRecord.self_harm_risk} />
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Violence/Aggression Risk</span>
                <RiskBadge level={latestRecord.violence_aggression_risk} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Management Plans */}
      {(latestRecord.absconding_plan || latestRecord.self_harm_plan || latestRecord.violence_plan) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileWarning className="h-5 w-5 text-primary" />
              Risk Management Plans
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {latestRecord.absconding_plan && (
              <div>
                <span className="text-sm font-medium">Absconding Management Plan:</span>
                <p className="text-sm text-muted-foreground mt-1 bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
                  {latestRecord.absconding_plan}
                </p>
              </div>
            )}
            
            {latestRecord.self_harm_plan && (
              <div>
                <span className="text-sm font-medium">Self-Harm Management Plan:</span>
                <p className="text-sm text-muted-foreground mt-1 bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
                  {latestRecord.self_harm_plan}
                </p>
              </div>
            )}
            
            {latestRecord.violence_plan && (
              <div>
                <span className="text-sm font-medium">Violence/Aggression Management Plan:</span>
                <p className="text-sm text-muted-foreground mt-1 bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
                  {latestRecord.violence_plan}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Environmental Risks */}
      {latestRecord.environmental_risks && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Home className="h-5 w-5 text-primary" />
              Environmental Risks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
              {latestRecord.environmental_risks}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Safeguarding Restrictions */}
      {latestRecord.safeguarding_restrictions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              Safeguarding Restrictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-red-50 border border-red-200 p-3 rounded-md">
              {latestRecord.safeguarding_restrictions}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Additional Notes */}
      {latestRecord.safeguarding_notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {latestRecord.safeguarding_notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
