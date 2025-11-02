import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  Clock, 
  Lightbulb, 
  Eye, 
  CheckCircle2, 
  Copy,
  ChevronDown,
  ChevronUp,
  Brain
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AIRecommendationsCardProps {
  recommendations: string;
  observationDate: string;
  totalScore: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export function AIRecommendationsCard({ 
  recommendations, 
  observationDate,
  totalScore,
  riskLevel 
}: AIRecommendationsCardProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['immediate']));
  
  let parsedRecs: any;
  try {
    parsedRecs = JSON.parse(recommendations);
  } catch (e) {
    console.error('Failed to parse AI recommendations:', e);
    return null;
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const copyToClipboard = () => {
    const text = `NEWS2 AI Recommendations (Score: ${totalScore}, Risk: ${riskLevel})

${parsedRecs.immediate_actions?.length > 0 ? `Immediate Actions:\n${parsedRecs.immediate_actions.map((a: string) => `• ${a}`).join('\n')}\n\n` : ''}Monitoring Plan:
Frequency: ${parsedRecs.monitoring_plan.frequency}
Focus Areas:
${parsedRecs.monitoring_plan.focus_areas.map((a: string) => `• ${a}`).join('\n')}

Care Suggestions:
${parsedRecs.care_suggestions.map((s: string) => `• ${s}`).join('\n')}

Watch For (Escalation Criteria):
${parsedRecs.escalation_criteria.map((c: string) => `• ${c}`).join('\n')}

Positive Observations:
${parsedRecs.positive_observations.map((o: string) => `• ${o}`).join('\n')}

Clinical Reasoning:
${parsedRecs.clinical_reasoning}`;

    navigator.clipboard.writeText(text);
    toast.success('Recommendations copied to clipboard');
  };

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">AI Clinical Recommendations</CardTitle>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={copyToClipboard}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {parsedRecs.immediate_actions?.length > 0 && (
          <div className="border border-red-200 bg-red-50 rounded-lg p-4">
            <button
              onClick={() => toggleSection('immediate')}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold text-red-900">Immediate Actions</h3>
                <Badge variant="destructive">Urgent</Badge>
              </div>
              {expandedSections.has('immediate') ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {expandedSections.has('immediate') && (
              <ul className="mt-3 space-y-2">
                {parsedRecs.immediate_actions.map((action: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-red-900">
                    <span className="mt-0.5">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
          <button
            onClick={() => toggleSection('monitoring')}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold text-amber-900">Monitoring Plan</h3>
            </div>
            {expandedSections.has('monitoring') ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.has('monitoring') && (
            <div className="mt-3 space-y-2">
              <p className="text-sm font-medium text-amber-900">
                Frequency: {parsedRecs.monitoring_plan.frequency}
              </p>
              <p className="text-sm font-medium text-amber-900">Focus Areas:</p>
              <ul className="space-y-1">
                {parsedRecs.monitoring_plan.focus_areas.map((area: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-amber-900">
                    <span className="mt-0.5">•</span>
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {parsedRecs.care_suggestions?.length > 0 && (
          <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
            <button
              onClick={() => toggleSection('care')}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Care Suggestions</h3>
              </div>
              {expandedSections.has('care') ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {expandedSections.has('care') && (
              <ul className="mt-3 space-y-2">
                {parsedRecs.care_suggestions.map((suggestion: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-blue-900">
                    <span className="mt-0.5">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {parsedRecs.escalation_criteria?.length > 0 && (
          <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
            <button
              onClick={() => toggleSection('escalation')}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-orange-600" />
                <h3 className="font-semibold text-orange-900">Watch For (Escalation)</h3>
              </div>
              {expandedSections.has('escalation') ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {expandedSections.has('escalation') && (
              <ul className="mt-3 space-y-2">
                {parsedRecs.escalation_criteria.map((criteria: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-orange-900">
                    <span className="mt-0.5">⚠️</span>
                    <span>{criteria}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {parsedRecs.positive_observations?.length > 0 && (
          <div className="border border-green-200 bg-green-50 rounded-lg p-4">
            <button
              onClick={() => toggleSection('positive')}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-900">Positive Observations</h3>
              </div>
              {expandedSections.has('positive') ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {expandedSections.has('positive') && (
              <ul className="mt-3 space-y-2">
                {parsedRecs.positive_observations.map((observation: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-green-900">
                    <span className="mt-0.5">✓</span>
                    <span>{observation}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {parsedRecs.clinical_reasoning && (
          <div className="border border-gray-200 bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Clinical Reasoning</h3>
            <p className="text-sm text-gray-700">{parsedRecs.clinical_reasoning}</p>
          </div>
        )}

        <div className="border-t pt-3">
          <p className="text-xs text-gray-500 italic">
            ⓘ AI-generated suggestions using Google Gemini AI. Always follow your clinical protocols and use professional judgment. 
            Model: {parsedRecs.model_used || 'gemini-2.0-flash-exp'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
