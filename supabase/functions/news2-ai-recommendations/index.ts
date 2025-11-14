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
  personalized_care_adjustments?: string[];
  hydration_nutrition_actions?: string[];
  mobility_safety_measures?: string[];
  comfort_wellbeing_suggestions?: string[];
  goal_alignment_notes?: string;
  cultural_religious_considerations?: string[];
  communication_tips?: string[];
  next_review_time?: string;
  context_used?: {
    care_plan: boolean;
    fluid_balance: boolean;
    personal_care: boolean;
    risk_assessment: boolean;
    goals: boolean;
  };
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

    // Fetch comprehensive patient and care plan data
    const { data: patientData, error: patientError } = await supabase
      .from('news2_patients')
      .select(`
        *,
        client:clients!inner(
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

    const clientId = patientData?.client?.id;
    let carePlanData: any = null;
    let fluidBalanceData: any = null;
    let goalsData: any = [];
    let contextUsed = {
      care_plan: false,
      fluid_balance: false,
      personal_care: false,
      risk_assessment: false,
      goals: false
    };

    // Fetch active care plan with all sections if client exists
    if (clientId && include_client_context) {
      try {
        const { data: carePlan } = await supabase
          .from('client_care_plans')
          .select(`
            id,
            title,
            status,
            personal_care,
            dietary_requirements,
            about_me,
            general,
            risk_assessments,
            service_plans,
            equipment
          `)
          .eq('client_id', clientId)
          .eq('status', 'active')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        if (carePlan) {
          carePlanData = carePlan;
          contextUsed.care_plan = true;
          contextUsed.personal_care = !!carePlan.personal_care;
          contextUsed.risk_assessment = !!carePlan.risk_assessments;
        }

        // Fetch goals
        const { data: goals } = await supabase
          .from('client_care_plan_goals')
          .select('description, status, progress, notes')
          .eq('care_plan_id', carePlan?.id || '')
          .order('created_at', { ascending: false })
          .limit(5);

        if (goals && goals.length > 0) {
          goalsData = goals;
          contextUsed.goals = true;
        }

        // Fetch today's fluid balance
        const today = new Date().toISOString().split('T')[0];
        
        const { data: intakeRecords } = await supabase
          .from('fluid_intake_records')
          .select('amount_ml, fluid_type, time')
          .eq('client_id', clientId)
          .eq('record_date', today)
          .order('time', { ascending: false })
          .limit(5);

        const { data: outputRecords } = await supabase
          .from('fluid_output_records')
          .select('amount_ml, output_type, appearance, time')
          .eq('client_id', clientId)
          .eq('record_date', today)
          .order('time', { ascending: false })
          .limit(5);

        const { data: urinaryRecords } = await supabase
          .from('urinary_output_records')
          .select('colour, odour, discomfort_observations, time')
          .eq('client_id', clientId)
          .eq('record_date', today)
          .order('time', { ascending: false })
          .limit(3);

        const { data: targetData } = await supabase
          .from('fluid_balance_targets')
          .select('daily_intake_target_ml, daily_output_target_ml')
          .eq('client_id', clientId)
          .eq('is_active', true)
          .single();

        if (intakeRecords || outputRecords || urinaryRecords) {
          fluidBalanceData = {
            intake: intakeRecords || [],
            output: outputRecords || [],
            urinary: urinaryRecords || [],
            target: targetData
          };
          contextUsed.fluid_balance = true;
        }
      } catch (error) {
        console.warn('[news2-ai-recommendations] Could not fetch full care plan context:', error);
      }
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
    const prompt = buildEnhancedPrompt(
      observation,
      patientData,
      previousObservations,
      carePlanData,
      fluidBalanceData,
      goalsData
    );

    console.log('[news2-ai-recommendations] Calling Gemini API with enhanced context...');

    // Call Gemini API with enhanced function calling
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
            maxOutputTokens: 3000,
          },
          tools: [{
            functionDeclarations: [{
              name: 'provide_enhanced_care_recommendations',
              description: 'Provide comprehensive, personalized care recommendations based on NEWS2 assessment and full care plan context',
              parameters: {
                type: 'object',
                properties: {
                  immediate_actions: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Urgent actions required within the next hour (empty if none)'
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
                        items: { type: 'string' },
                        description: 'Specific vital signs or symptoms to watch'
                      }
                    },
                    required: ['frequency', 'focus_areas']
                  },
                  care_suggestions: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'General supportive care and comfort measures'
                  },
                  personalized_care_adjustments: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Specific care adjustments based on patient preferences, dietary needs, mobility, personal care requirements'
                  },
                  hydration_nutrition_actions: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Specific actions related to fluid intake, diet, and nutrition based on current readings and dietary requirements'
                  },
                  mobility_safety_measures: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Mobility support, fall prevention, equipment checks based on risk assessments'
                  },
                  comfort_wellbeing_suggestions: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Actions to support comfort, pain management, sleep, emotional wellbeing'
                  },
                  goal_alignment_notes: {
                    type: 'string',
                    description: 'How this situation relates to patient care goals and progress'
                  },
                  cultural_religious_considerations: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Any cultural or religious considerations for care actions'
                  },
                  communication_tips: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'How to communicate with patient about the situation (language, style, preferences)'
                  },
                  escalation_criteria: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Warning signs that require immediate clinical attention'
                  },
                  positive_observations: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'What is going well (encouragement)'
                  },
                  clinical_reasoning: {
                    type: 'string',
                    description: 'Brief explanation of the recommendations (2-3 sentences)'
                  },
                  next_review_time: {
                    type: 'string',
                    description: 'When to reassess (e.g., "in 1 hour", "in 4 hours", "next scheduled visit")'
                  }
                },
                required: ['immediate_actions', 'monitoring_plan', 'care_suggestions', 'clinical_reasoning', 'escalation_criteria', 'positive_observations']
              }
            }]
          }],
          toolConfig: {
            functionCallingConfig: {
              mode: 'ANY',
              allowedFunctionNames: ['provide_enhanced_care_recommendations']
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
    if (!functionCall || functionCall.name !== 'provide_enhanced_care_recommendations') {
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
      context_used: contextUsed,
      generated_at: new Date().toISOString(),
      model_used: 'gemini-2.0-flash-exp'
    };

    console.log('[news2-ai-recommendations] Enhanced recommendations generated successfully');

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
          escalation_criteria: ['Any sudden deterioration', 'Difficulty breathing', 'Chest pain', 'Altered consciousness'],
          positive_observations: [],
          clinical_reasoning: 'Unable to generate AI recommendations. Please use clinical judgment.',
          generated_at: new Date().toISOString(),
          model_used: 'fallback'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});

function buildEnhancedPrompt(
  observation: any,
  patientData: any,
  previousObservations: any[],
  carePlanData: any,
  fluidBalanceData: any,
  goalsData: any[]
): string {
  const client = patientData?.client;
  const age = client?.date_of_birth 
    ? Math.floor((Date.now() - new Date(client.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : 'unknown';

  let prompt = `You are an expert clinical AI assistant analyzing NEWS2 vital signs observations with comprehensive care plan context.

PATIENT CONTEXT:
- Age: ${age} years
- Medical Conditions: ${client?.medical_conditions || 'None recorded'}
- Current Medications: ${client?.medications || 'None recorded'}

CURRENT NEWS2 OBSERVATION:
- Total Score: ${observation.total_score}
- Risk Level: ${observation.risk_level}
- Respiration Rate: ${observation.respiration_rate} breaths/min
- SpO2: ${observation.spo2_scale_1 || observation.spo2_scale_2}%${observation.on_oxygen ? ' (on supplemental oxygen)' : ''}
- Systolic BP: ${observation.systolic_bp} mmHg
- Pulse: ${observation.pulse_rate} bpm
- Consciousness: ${observation.consciousness || 'Alert'}
- Temperature: ${observation.temperature}°C
`;

  // Add trend analysis
  if (previousObservations.length > 0) {
    prompt += `\nRECENT TREND:\n`;
    previousObservations.forEach((obs, idx) => {
      prompt += `- ${idx + 1} observation(s) ago: Score ${obs.total_score} (${obs.risk_level})\n`;
    });
  }

  // Add personal care context
  if (carePlanData?.personal_care) {
    const pc = carePlanData.personal_care;
    prompt += `\nPERSONAL CARE NEEDS:
- Mobility Level: ${pc.mobility_level || 'Not specified'}
- Bathing Assistance: ${pc.bathing_preferences || 'Not specified'}
- Toileting Assistance: ${pc.toileting_assistance_level || 'Not specified'}
- Continence Status: ${pc.continence_status || 'Not specified'}
- Sleep Patterns: ${pc.sleep_patterns || 'Not specified'}
- Pain Management: ${pc.pain_management || 'Not specified'}
`;
  }

  // Add dietary & hydration context
  if (carePlanData?.dietary_requirements || fluidBalanceData) {
    prompt += `\nDIETARY & HYDRATION:`;
    
    if (carePlanData?.dietary_requirements) {
      const dr = carePlanData.dietary_requirements;
      prompt += `
- Allergies: ${dr.allergies || 'None known'}
- Food Restrictions: ${dr.restrictions || 'None'}
- Nutritional Risk: ${dr.malnutrition_risk_level || 'Not assessed'}
- Swallowing Difficulties: ${dr.swallowing_difficulties ? 'Yes - ' + dr.swallowing_notes : 'No'}
- Choking Risk: ${dr.choking_risk ? 'YES - High Risk' : 'No'}
`;
    }

    if (fluidBalanceData) {
      const totalIntake = fluidBalanceData.intake.reduce((sum: number, r: any) => sum + (r.amount_ml || 0), 0);
      const totalOutput = fluidBalanceData.output.reduce((sum: number, r: any) => sum + (r.amount_ml || 0), 0);
      const balance = totalIntake - totalOutput;
      const target = fluidBalanceData.target?.daily_intake_target_ml || 2000;

      prompt += `
- Today's Fluid Intake: ${totalIntake}ml (Target: ${target}ml)
- Today's Fluid Output: ${totalOutput}ml
- Fluid Balance: ${balance > 0 ? '+' : ''}${balance}ml
- Hydration Status: ${balance < -500 ? 'NEGATIVE BALANCE - CONCERN' : totalIntake < (target * 0.7) ? 'Below target' : 'Adequate'}
`;

      if (fluidBalanceData.urinary.length > 0) {
        const latest = fluidBalanceData.urinary[0];
        prompt += `- Latest Urinary Observation: ${latest.colour}, ${latest.odour}${latest.discomfort_observations ? ', ' + latest.discomfort_observations : ''}\n`;
      }
    }
  }

  // Add activities & engagement
  if (carePlanData?.about_me) {
    const am = carePlanData.about_me;
    prompt += `\nACTIVITIES & ENGAGEMENT:
- Hobbies/Interests: ${am.hobbies || 'Not recorded'}
- Social Preferences: ${am.social_preferences || 'Not recorded'}
`;
  }

  if (carePlanData?.equipment) {
    const eq = carePlanData.equipment;
    prompt += `- Mobility Aids: ${eq.mobility_aids || 'None'}\n`;
  }

  // Add care goals
  if (goalsData.length > 0) {
    prompt += `\nCARE GOALS:\n`;
    goalsData.forEach((goal) => {
      prompt += `- ${goal.description} (Status: ${goal.status}, Progress: ${goal.progress || 0}%)\n`;
    });
  }

  // Add risk assessments
  if (carePlanData?.risk_assessments) {
    const ra = carePlanData.risk_assessments;
    prompt += `\nKNOWN RISKS:
- Falls Risk: ${ra.falls_risk_level || 'Not assessed'}
- Pressure Sores Risk: ${ra.pressure_sore_risk || 'Not assessed'}
- Other Risks: ${ra.other_risks || 'None recorded'}
`;
  }

  // Add cultural & communication
  if (carePlanData?.general) {
    const gen = carePlanData.general;
    prompt += `\nCULTURAL & COMMUNICATION:
- Communication Preferences: ${gen.communication_preferences || 'Not specified'}
- Language: ${gen.language_preferences || 'English'}
`;
  }

  prompt += `\nINSTRUCTIONS:
Provide comprehensive, personalized care recommendations that:

1. **PERSONALIZATION**: Reference specific care plan details where relevant
   - If patient likes tea and is dehydrated, suggest offering preferred beverages
   - If patient uses walking frame, remind staff to ensure it's accessible
   - Consider dietary restrictions and swallowing difficulties in all suggestions

2. **RISK-AWARE**: Factor in known risk assessments
   - If falls risk is high + NEWS2 shows dizziness → emphasize supervision when mobilizing
   - If swallowing difficulty + dehydration → suggest appropriate fluid consistency
   - If pressure sore risk + reduced mobility → remind about repositioning

3. **GOAL-ALIGNED**: Relate recommendations to patient's care goals where relevant

4. **CULTURALLY SENSITIVE**: Respect any cultural or religious preferences

5. **PRACTICAL**: Be specific and actionable for care staff, not generic advice

6. **EMPATHETIC**: Use a person-centered approach that maintains dignity

Provide your response using the 'provide_enhanced_care_recommendations' function.`;

  return prompt;
}

function getFallbackRecommendations(totalScore: number, riskLevel: string): AIRecommendations {
  let immediateActions: string[] = [];
  let frequency = 'Every 4 hours';
  
  if (riskLevel === 'high' || totalScore >= 7) {
    immediateActions = [
      'Contact senior clinician immediately',
      'Increase monitoring frequency',
      'Ensure emergency equipment is accessible'
    ];
    frequency = 'Hourly or more frequently as clinically indicated';
  } else if (riskLevel === 'medium' || totalScore >= 5) {
    immediateActions = [
      'Inform registered nurse or care team lead',
      'Increase monitoring frequency'
    ];
    frequency = 'Every 2 hours';
  }

  return {
    immediate_actions: immediateActions,
    monitoring_plan: {
      frequency,
      focus_areas: ['All vital signs', 'Consciousness level', 'Overall condition']
    },
    care_suggestions: [
      'Ensure patient comfort and safety',
      'Monitor fluid intake',
      'Provide reassurance'
    ],
    escalation_criteria: [
      'Any sudden deterioration',
      'Difficulty breathing',
      'Chest pain',
      'Altered consciousness',
      'Significant change in vital signs'
    ],
    positive_observations: totalScore < 5 ? ['Vital signs stable', 'Patient comfortable'] : [],
    clinical_reasoning: 'Fallback recommendations generated. Please use clinical judgment and escalate as appropriate.',
    generated_at: new Date().toISOString(),
    model_used: 'fallback'
  };
}
