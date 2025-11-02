import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { corsHeaders } from '../_shared/cors.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface AIRecommendations {
  immediate_actions: string[];
  monitoring_plan: {
    frequency: string;
    focus_areas: string[];
  };
  care_suggestions: string[];
  escalation_criteria: string[];
  positive_observations: string[];
  clinical_reasoning: string;
  generated_at: string;
  model_used: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { observation_id, news2_patient_id, include_client_context = true, include_history = true } = await req.json();

    console.log('[news2-ai-recommendations] Generating recommendations for observation:', observation_id);

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    // Fetch the observation
    const { data: observation, error: obsError } = await supabase
      .from('news2_observations')
      .select('*')
      .eq('id', observation_id)
      .single();

    if (obsError || !observation) {
      throw new Error('Observation not found');
    }

    // Fetch patient and client data
    const { data: patientData, error: patientError } = await supabase
      .from('news2_patients')
      .select(`
        *,
        client:clients(
          id,
          first_name,
          last_name,
          date_of_birth,
          medical_conditions,
          medications
        )
      `)
      .eq('id', news2_patient_id)
      .single();

    if (patientError) {
      console.error('[news2-ai-recommendations] Error fetching patient:', patientError);
    }

    // Fetch previous observations for trend analysis
    let previousObservations: any[] = [];
    if (include_history) {
      const { data: prevObs } = await supabase
        .from('news2_observations')
        .select('total_score, risk_level, recorded_at')
        .eq('news2_patient_id', news2_patient_id)
        .neq('id', observation_id)
        .order('recorded_at', { ascending: false })
        .limit(3);
      
      previousObservations = prevObs || [];
    }

    // Build comprehensive prompt
    const prompt = buildPrompt(observation, patientData, previousObservations);

    console.log('[news2-ai-recommendations] Calling Gemini API...');

    // Call Gemini API with function calling
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
          tools: [{
            functionDeclarations: [{
              name: 'provide_news2_recommendations',
              description: 'Provide structured clinical recommendations based on NEWS2 assessment',
              parameters: {
                type: 'object',
                properties: {
                  immediate_actions: {
                    type: 'array',
                    description: 'List of urgent actions required (empty if none)',
                    items: { type: 'string' }
                  },
                  monitoring_plan: {
                    type: 'object',
                    properties: {
                      frequency: {
                        type: 'string',
                        description: 'How often to monitor (e.g., "Every 4 hours", "Hourly")'
                      },
                      focus_areas: {
                        type: 'array',
                        description: 'Specific vital signs or symptoms to watch',
                        items: { type: 'string' }
                      }
                    },
                    required: ['frequency', 'focus_areas']
                  },
                  care_suggestions: {
                    type: 'array',
                    description: 'Supportive care and comfort measures',
                    items: { type: 'string' }
                  },
                  escalation_criteria: {
                    type: 'array',
                    description: 'Warning signs that require immediate clinical attention',
                    items: { type: 'string' }
                  },
                  positive_observations: {
                    type: 'array',
                    description: 'What is going well (encouragement)',
                    items: { type: 'string' }
                  },
                  clinical_reasoning: {
                    type: 'string',
                    description: 'Brief explanation of the recommendations (2-3 sentences)'
                  }
                },
                required: ['immediate_actions', 'monitoring_plan', 'care_suggestions', 'escalation_criteria', 'positive_observations', 'clinical_reasoning']
              }
            }]
          }],
          toolConfig: {
            functionCallingConfig: {
              mode: 'ANY',
              allowedFunctionNames: ['provide_news2_recommendations']
            }
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[news2-ai-recommendations] Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[news2-ai-recommendations] Gemini response received');

    // Extract function call result
    const functionCall = data.candidates?.[0]?.content?.parts?.[0]?.functionCall;
    if (!functionCall || functionCall.name !== 'provide_news2_recommendations') {
      console.error('[news2-ai-recommendations] No valid function call in response:', data);
      
      // Return fallback recommendations
      return new Response(
        JSON.stringify({
          recommendations: getFallbackRecommendations(observation.total_score, observation.risk_level)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const recommendations: AIRecommendations = {
      ...functionCall.args,
      generated_at: new Date().toISOString(),
      model_used: 'gemini-2.0-flash-exp'
    };

    console.log('[news2-ai-recommendations] Recommendations generated successfully');

    return new Response(
      JSON.stringify({ recommendations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[news2-ai-recommendations] Error:', error);
    
    // Return fallback recommendations on error
    return new Response(
      JSON.stringify({
        recommendations: {
          immediate_actions: [],
          monitoring_plan: {
            frequency: 'As per care plan',
            focus_areas: ['Monitor vital signs regularly']
          },
          care_suggestions: ['Continue routine care', 'Contact care team if concerns arise'],
          escalation_criteria: ['Significant changes in vital signs', 'Patient discomfort or distress'],
          positive_observations: ['Observation recorded for monitoring'],
          clinical_reasoning: 'AI recommendations temporarily unavailable. Please follow standard care protocols.',
          generated_at: new Date().toISOString(),
          model_used: 'fallback'
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function buildPrompt(observation: any, patientData: any, previousObservations: any[]): string {
  const client = patientData?.client;
  const age = client?.date_of_birth 
    ? Math.floor((Date.now() - new Date(client.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : 'Unknown';

  let prompt = `You are a clinical AI assistant analyzing NEWS2 vital signs observations to provide actionable recommendations.

PATIENT CONTEXT:
- Age: ${age} years
- Current Conditions: ${client?.medical_conditions || 'None recorded'}
- Current Medications: ${client?.medications || 'None recorded'}
- Monitoring Frequency: ${patientData?.monitoring_frequency || 'Not specified'}
- Risk Category: ${observation.risk_level}

CURRENT OBSERVATION (${new Date(observation.recorded_at).toLocaleString()}):
- NEWS2 Score: ${observation.total_score} (${observation.risk_level.toUpperCase()} RISK)
- Respiratory Rate: ${observation.respiratory_rate || 'N/A'}/min (score: ${observation.respiratory_rate_score})
- Oxygen Saturation: ${observation.oxygen_saturation || 'N/A'}% (score: ${observation.oxygen_saturation_score})
- Blood Pressure: ${observation.systolic_bp || 'N/A'}${observation.diastolic_bp ? `/${observation.diastolic_bp}` : ''} mmHg (score: ${observation.systolic_bp_score})
- Pulse Rate: ${observation.pulse_rate || 'N/A'} bpm (score: ${observation.pulse_rate_score})
- Temperature: ${observation.temperature || 'N/A'}°C (score: ${observation.temperature_score})
- Consciousness: ${observation.consciousness_level} (score: ${observation.consciousness_level_score})
- Supplemental Oxygen: ${observation.supplemental_oxygen ? 'Yes' : 'No'} (score: ${observation.supplemental_oxygen_score})
`;

  if (observation.clinical_notes) {
    prompt += `- Clinical Notes: ${observation.clinical_notes}\n`;
  }

  if (previousObservations.length > 0) {
    const trend = analyzeTrend(observation.total_score, previousObservations);
    prompt += `\nRECENT TREND:\n- Previous scores: ${previousObservations.map(o => `${o.total_score} (${o.risk_level})`).join(', ')}\n- Trend: ${trend}\n`;
  }

  prompt += `\nINSTRUCTIONS:
Provide evidence-based recommendations that are:
1. Clear and actionable
2. Appropriate for the risk level
3. Compassionate and supportive
4. Focused on patient safety and comfort

FOR LOW RISK (0-4):
- Focus on wellness and prevention
- Routine monitoring guidance
- Positive reinforcement

FOR MEDIUM RISK (5-6):
- Increased monitoring frequency
- Specific vital signs to watch
- When to escalate

FOR HIGH RISK (7+):
- URGENT actions required
- Immediate escalation criteria
- Close monitoring protocol

Be specific, practical, and use plain language suitable for care teams and patients.`;

  return prompt;
}

function analyzeTrend(currentScore: number, previousObservations: any[]): string {
  if (previousObservations.length === 0) return 'No previous data';
  
  const lastScore = previousObservations[0].total_score;
  const diff = currentScore - lastScore;
  
  if (diff > 2) return 'Deteriorating (score increased)';
  if (diff < -2) return 'Improving (score decreased)';
  return 'Stable';
}

function getFallbackRecommendations(totalScore: number, riskLevel: string): AIRecommendations {
  if (totalScore >= 7) {
    return {
      immediate_actions: [
        'URGENT: Immediate clinical review required',
        'Notify senior staff and follow escalation protocol',
        'Monitor continuously until condition stabilizes'
      ],
      monitoring_plan: {
        frequency: 'Continuous or every 1-2 hours',
        focus_areas: [
          'All vital signs requiring close attention',
          'Level of consciousness',
          'Signs of clinical deterioration'
        ]
      },
      care_suggestions: [
        'Ensure patient comfort and safety',
        'Maintain clear communication with clinical team',
        'Document all observations and changes'
      ],
      escalation_criteria: [
        'Any further deterioration in vital signs',
        'Decreased consciousness level',
        'Patient or family concerns'
      ],
      positive_observations: [
        'Observation recorded promptly',
        'Care team alerted to high risk status'
      ],
      clinical_reasoning: 'High NEWS2 score requires urgent clinical attention. Close monitoring and immediate intervention protocols should be followed.',
      generated_at: new Date().toISOString(),
      model_used: 'fallback-high-risk'
    };
  }

  if (totalScore >= 5) {
    return {
      immediate_actions: [],
      monitoring_plan: {
        frequency: 'Every 4-6 hours or as directed',
        focus_areas: [
          'Vital signs showing elevated scores',
          'Overall trend in observations',
          'Patient comfort and wellbeing'
        ]
      },
      care_suggestions: [
        'Increase monitoring frequency as recommended',
        'Document any changes in condition',
        'Consider clinical assessment if score increases',
        'Ensure patient hydration and comfort'
      ],
      escalation_criteria: [
        'NEWS2 score increases to 7 or above',
        'Any single parameter score of 3',
        'Rapid deterioration in any vital sign',
        'Patient reports significant discomfort'
      ],
      positive_observations: [
        'Patient being monitored appropriately',
        'Care team aware of medium risk status'
      ],
      clinical_reasoning: 'Medium risk requires increased vigilance. Monitor trends and be prepared to escalate if condition changes.',
      generated_at: new Date().toISOString(),
      model_used: 'fallback-medium-risk'
    };
  }

  return {
    immediate_actions: [],
    monitoring_plan: {
      frequency: 'As per routine care plan (e.g., daily or 12-hourly)',
      focus_areas: [
        'Routine vital signs monitoring',
        'General wellbeing',
        'Any patient concerns'
      ]
    },
    care_suggestions: [
      'Continue routine monitoring as planned',
      'Encourage healthy lifestyle habits',
      'Maintain open communication with patient',
      'Document observations regularly'
    ],
    escalation_criteria: [
      'Any significant change in vital signs',
      'Patient reports new symptoms or concerns',
      'NEWS2 score increases to 5 or above'
    ],
    positive_observations: [
      'Vital signs within expected ranges',
      'Patient appears stable',
      'Good baseline for comparison'
    ],
    clinical_reasoning: 'Low risk indicates stable condition. Continue routine care and monitoring as per care plan.',
    generated_at: new Date().toISOString(),
    model_used: 'fallback-low-risk'
  };
}
