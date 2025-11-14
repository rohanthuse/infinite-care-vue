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
  Brain,
  User,
  Droplets,
  Shield,
  Heart,
  Target,
  Globe,
  MessageSquare,
  Info
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
${parsedRecs.care_suggestions?.map((s: string) => `• ${s}`).join('\n') || 'None'}

Watch For (Escalation Criteria):
${parsedRecs.escalation_criteria?.map((c: string) => `• ${c}`).join('\n') || 'Standard escalation'}

Positive Observations:
${parsedRecs.positive_observations?.map((o: string) => `• ${o}`).join('\n') || 'None noted'}

Clinical Reasoning:
${parsedRecs.clinical_reasoning}`;

    navigator.clipboard.writeText(text);
    toast.success('Recommendations copied to clipboard');
  };

  const contextUsed = parsedRecs.context_used || {};

  return (
    <div className="space-y-4">
      {/* Context Summary Card */}
      {Object.values(contextUsed).some((v) => v === true) && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Info className="h-4 w-4" />
              AI Analysis Context
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                NEWS2 Score: {totalScore}
              </Badge>
              {contextUsed.care_plan && <Badge variant="outline" className="text-xs">Care Plan ✓</Badge>}
              {contextUsed.fluid_balance && <Badge variant="outline" className="text-xs">Fluid Balance ✓</Badge>}
              {contextUsed.personal_care && <Badge variant="outline" className="text-xs">Personal Care ✓</Badge>}
              {contextUsed.risk_assessment && <Badge variant="outline" className="text-xs">Risk Assessment ✓</Badge>}
              {contextUsed.goals && <Badge variant="outline" className="text-xs">Care Goals ✓</Badge>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Recommendations Card */}
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
          {/* Immediate Actions */}
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

          {/* Monitoring Plan */}
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

          {/* Personalized Care Adjustments - NEW */}
          {parsedRecs.personalized_care_adjustments?.length > 0 && (
            <div className="border border-purple-200 bg-purple-50 rounded-lg p-4">
              <button
                onClick={() => toggleSection('personalized')}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-900">Personalized Care Adjustments</h3>
                </div>
                {expandedSections.has('personalized') ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {expandedSections.has('personalized') && (
                <ul className="mt-3 space-y-2">
                  {parsedRecs.personalized_care_adjustments.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-purple-900">
                      <span className="mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Hydration & Nutrition - NEW */}
          {parsedRecs.hydration_nutrition_actions?.length > 0 && (
            <div className="border border-cyan-200 bg-cyan-50 rounded-lg p-4">
              <button
                onClick={() => toggleSection('hydration')}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-cyan-600" />
                  <h3 className="font-semibold text-cyan-900">Hydration & Nutrition</h3>
                </div>
                {expandedSections.has('hydration') ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {expandedSections.has('hydration') && (
                <ul className="mt-3 space-y-2">
                  {parsedRecs.hydration_nutrition_actions.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-cyan-900">
                      <span className="mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Mobility & Safety - NEW */}
          {parsedRecs.mobility_safety_measures?.length > 0 && (
            <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
              <button
                onClick={() => toggleSection('mobility')}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-orange-600" />
                  <h3 className="font-semibold text-orange-900">Mobility & Safety</h3>
                </div>
                {expandedSections.has('mobility') ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {expandedSections.has('mobility') && (
                <ul className="mt-3 space-y-2">
                  {parsedRecs.mobility_safety_measures.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-orange-900">
                      <span className="mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Comfort & Wellbeing - NEW */}
          {parsedRecs.comfort_wellbeing_suggestions?.length > 0 && (
            <div className="border border-pink-200 bg-pink-50 rounded-lg p-4">
              <button
                onClick={() => toggleSection('comfort')}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-pink-600" />
                  <h3 className="font-semibold text-pink-900">Comfort & Wellbeing</h3>
                </div>
                {expandedSections.has('comfort') ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {expandedSections.has('comfort') && (
                <ul className="mt-3 space-y-2">
                  {parsedRecs.comfort_wellbeing_suggestions.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-pink-900">
                      <span className="mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* General Care Suggestions */}
          {parsedRecs.care_suggestions?.length > 0 && (
            <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
              <button
                onClick={() => toggleSection('care')}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">General Care Suggestions</h3>
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

          {/* Goal Alignment - NEW */}
          {parsedRecs.goal_alignment_notes && (
            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="flex items-start gap-2">
                <Target className="h-4 w-4 text-indigo-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-indigo-900">Care Goal Context:</p>
                  <p className="text-sm text-indigo-800 mt-1">{parsedRecs.goal_alignment_notes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Cultural/Religious Considerations - NEW */}
          {parsedRecs.cultural_religious_considerations?.length > 0 && (
            <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
              <div className="flex items-start gap-2">
                <Globe className="h-4 w-4 text-teal-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-teal-900">Cultural & Religious Considerations:</p>
                  <ul className="mt-2 space-y-1">
                    {parsedRecs.cultural_religious_considerations.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-teal-800">
                        <span className="mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Communication Tips - NEW */}
          {parsedRecs.communication_tips?.length > 0 && (
            <div className="p-3 bg-violet-50 rounded-lg border border-violet-200">
              <div className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 text-violet-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-violet-900">Communication Tips:</p>
                  <ul className="mt-2 space-y-1">
                    {parsedRecs.communication_tips.map((tip: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-violet-800">
                        <span className="mt-0.5">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Escalation Criteria */}
          {parsedRecs.escalation_criteria?.length > 0 && (
            <div className="border border-slate-200 bg-slate-50 rounded-lg p-4">
              <button
                onClick={() => toggleSection('escalation')}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-slate-600" />
                  <h3 className="font-semibold text-slate-900">Watch For (Escalation Criteria)</h3>
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
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-900">
                      <span className="mt-0.5">•</span>
                      <span>{criteria}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Positive Observations */}
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
                      <span className="mt-0.5">•</span>
                      <span>{observation}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Clinical Reasoning */}
          <div className="p-4 bg-slate-100 rounded-lg border border-slate-200">
            <h3 className="font-semibold text-sm text-slate-900 mb-2">Clinical Reasoning</h3>
            <p className="text-sm text-slate-700">{parsedRecs.clinical_reasoning}</p>
          </div>

          {/* Next Review Time - NEW */}
          {parsedRecs.next_review_time && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background p-3 rounded-lg border">
              <Clock className="h-4 w-4" />
              <span><strong>Next Review:</strong> {parsedRecs.next_review_time}</span>
            </div>
          )}

          {/* Footer Info */}
          <div className="text-xs text-slate-500 pt-2 border-t flex items-center justify-between">
            <span>Generated by {parsedRecs.model_used || 'AI'} at {new Date(parsedRecs.generated_at || observationDate).toLocaleString()}</span>
            <span className="italic">For clinical review</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
