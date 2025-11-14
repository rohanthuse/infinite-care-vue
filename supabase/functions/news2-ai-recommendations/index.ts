import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { corsHeaders } from '../_shared/cors.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
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

const activeRequests = new Map<string, Promise<Response>>();

async function callOpenAIWithRetry(
  systemPrompt: string, 
  userPrompt: string, 
  tools: any[], 
  maxRetries = 2, 
  requestId: string
) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`[news2-ai-recommendations][${requestId}] OpenAI API call attempt ${attempt + 1}/${maxRetries}`);
      
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-5-2025-08-07',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          tools: tools,
          tool_choice: { 
            type: 'function', 
            function: { name: 'provide_enhanced_care_recommendations' } 
          },
          max_completion_tokens: 16000,
        }),
      });

      const data = await response.json();

      // Log response status and basic info for debugging
      console.log(`[news2-ai-recommendations][${requestId}] OpenAI status: ${response.status}, has choices: ${!!data.choices}, has error: ${!!data.error}`);
      
      // If there's an error in the response body, log it
      if (data.error) {
        console.error(`[news2-ai-recommendations][${requestId}] OpenAI returned error:`, JSON.stringify(data.error, null, 2));
      }

      if (response.status === 429) {
        if (attempt < maxRetries - 1) {
          const waitTime = Math.pow(2, attempt) * 2000;
          console.log(`[news2-ai-recommendations][${requestId}] Rate limited (429), retrying after ${waitTime}ms`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }

      if (response.status === 503) {
        if (attempt < maxRetries - 1) {
          const waitTime = Math.pow(2, attempt) * 2000;
          console.log(`[news2-ai-recommendations][${requestId}] Service unavailable (503), retrying after ${waitTime}ms`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }

      if (!response.ok) {
        const errorMsg = data.error?.message || JSON.stringify(data);
        console.error(`[news2-ai-recommendations][${requestId}] OpenAI API error: ${response.status}`, errorMsg);
        throw new Error(`OpenAI API error: ${response.status} - ${errorMsg}`);
      }

      return data;
    } catch (error) {
      console.error(`[news2-ai-recommendations][${requestId}] Attempt ${attempt + 1} failed:`, error);
      if (attempt === maxRetries - 1) throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

function buildSystemPrompt(): string {
  return `You are an expert clinical AI assistant specializing in NEWS2 (National Early Warning Score 2) monitoring and personalized patient care.

ROLE & EXPERTISE:
- Expert in NHS NEWS2 protocols and early warning systems
- Specialist in geriatric care, vital signs interpretation, and care planning
- Trained in person-centered care approaches
- Knowledgeable about fluid balance, nutrition, mobility, and holistic wellbeing

CRITICAL INSTRUCTIONS:
1. Provide SPECIFIC, ACTIONABLE recommendations based on the patient's current vital signs
2. ALWAYS consider the patient's individual care plan, preferences, history, and goals
3. ESCALATE concerns immediately for high NEWS2 scores (7+ = RED, 5-6 = AMBER)
4. Be empathetic, person-centered, and culturally sensitive
5. Reference SPECIFIC vital sign values and trends in your recommendations
6. Consider ALL aspects of care: physical, emotional, social, and spiritual
7. Align recommendations with the patient's documented goals and preferences

RESPONSE FORMAT:
You MUST use the provide_enhanced_care_recommendations function with ALL required fields completed.`;
}

function buildUserPrompt(
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

  let medicalConditions = 'None recorded';
  let medications = 'None recorded';
  
  if (carePlanData) {
    if (carePlanData.general?.medical_history) {
      medicalConditions = carePlanData.general.medical_history;
    }
    if (carePlanData.general?.current_medications) {
      medications = carePlanData.general.current_medications;
    }
    if (carePlanData.about_me?.health_conditions) {
      const aboutMeConditions = carePlanData.about_me.health_conditions;
      if (medicalConditions === 'None recorded') {
        medicalConditions = aboutMeConditions;
      } else {
        medicalConditions += ' | ' + aboutMeConditions;
      }
    }
    if (carePlanData.risk_assessments) {
      const riskInfo = [];
      if (carePlanData.risk_assessments.falls_risk_level && carePlanData.risk_assessments.falls_risk_level !== 'low') {
        riskInfo.push('Falls Risk (' + carePlanData.risk_assessments.falls_risk_level + ')');
      }
      if (carePlanData.risk_assessments.pressure_sore_risk && carePlanData.risk_assessments.pressure_sore_risk !== 'low') {
        riskInfo.push('Pressure Sore Risk (' + carePlanData.risk_assessments.pressure_sore_risk + ')');
      }
      if (carePlanData.dietary_requirements?.choking_risk) {
        riskInfo.push('Choking Risk');
      }
      if (riskInfo.length > 0) {
        medicalConditions += (medicalConditions === 'None recorded' ? '' : ' | ') + 'Risk Factors: ' + riskInfo.join(', ');
      }
    }
  }

  let prompt = `PATIENT CONTEXT:
- Name: ${client?.first_name} ${client?.last_name}
- Age: ${age} years
- Gender: ${client?.gender || 'Not specified'}
- Medical Conditions: ${medicalConditions}
- Medications: ${medications}

CURRENT NEWS2 OBSERVATION (Score: ${observation.total_score}, Risk: ${observation.risk_level}):
- Respiration: ${observation.respiration_rate}/min
- SpO2: ${observation.spo2_scale_1 || observation.spo2_scale_2}%${observation.on_oxygen ? ' (on O2)' : ''}
- BP: ${observation.systolic_bp} mmHg
- Pulse: ${observation.pulse_rate} bpm
- Consciousness: ${observation.consciousness || 'Alert'}
- Temperature: ${observation.temperature}°C
`;

  if (previousObservations.length > 0) {
    prompt += `\nRECENT TREND:\n`;
    previousObservations.forEach((obs, idx) => {
      prompt += `- ${idx + 1} obs ago: Score ${obs.total_score} (${obs.risk_level})\n`;
    });
  }

  if (carePlanData?.personal_care) {
    const pc = carePlanData.personal_care;
    prompt += `\nPERSONAL CARE:
- Mobility: ${pc.mobility_level || 'Not specified'}
- Continence: ${pc.continence_status || 'Not specified'}
`;
  }

  if (carePlanData?.dietary_requirements || fluidBalanceData) {
    prompt += `\nDIETARY & HYDRATION:`;
    if (carePlanData?.dietary_requirements) {
      const dr = carePlanData.dietary_requirements;
      prompt += `
- Allergies: ${dr.allergies || 'None'}
- Choking Risk: ${dr.choking_risk ? 'YES - HIGH RISK' : 'No'}
`;
    }
    if (fluidBalanceData) {
      const totalIntake = fluidBalanceData.intake.reduce((sum: number, r: any) => sum + (r.amount_ml || 0), 0);
      const totalOutput = fluidBalanceData.output.reduce((sum: number, r: any) => sum + (r.amount_ml || 0), 0);
      const target = fluidBalanceData.target?.daily_intake_target_ml || 2000;
      prompt += `
- Fluid Intake: ${totalIntake}ml (Target: ${target}ml)
- Balance: ${totalIntake - totalOutput > 0 ? '+' : ''}${totalIntake - totalOutput}ml
`;
    }
  }

  if (goalsData.length > 0) {
    prompt += `\nCARE GOALS:\n`;
    goalsData.forEach((goal, idx) => {
      prompt += `${idx + 1}. ${goal.description} (${goal.status})\n`;
    });
  }

  prompt += `\nProvide detailed, personalized clinical recommendations using the provide_enhanced_care_recommendations function.`;

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  console.log(`[news2-ai-recommendations][${requestId}] Request received`);

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { observation_id, news2_patient_id, include_client_context = true, include_history = true } = await req.json();

    const requestKey = `${observation_id}-${news2_patient_id}`;

    if (activeRequests.has(requestKey)) {
      console.log(`[news2-ai-recommendations][${requestId}] Duplicate request detected`);
      return new Response(
        JSON.stringify({ error: 'Request already in progress' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[news2-ai-recommendations][${requestId}] Generating for observation: ${observation_id}`);

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const { data: observation, error: obsError } = await supabase
      .from('news2_observations')
      .select('*')
      .eq('id', observation_id)
      .single();

    if (obsError || !observation) {
      throw new Error('Observation not found');
    }

    const { data: patientData } = await supabase
      .from('news2_patients')
      .select(`*, client:clients!inner(id,first_name,last_name,date_of_birth,gender,mobility_status,gp_details)`)
      .eq('id', news2_patient_id)
      .single();

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

    if (clientId && include_client_context) {
      try {
        const { data: carePlan } = await supabase
          .from('client_care_plans')
          .select('id,title,status,personal_care,dietary_requirements,about_me,general,risk_assessments,service_plans,equipment')
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

        const { data: goals } = await supabase
          .from('client_care_plan_goals')
          .select('description,status,progress,notes')
          .eq('care_plan_id', carePlan?.id || '')
          .order('created_at', { ascending: false })
          .limit(5);

        if (goals && goals.length > 0) {
          goalsData = goals;
          contextUsed.goals = true;
        }

        const today = new Date().toISOString().split('T')[0];
        
        const { data: intakeRecords } = await supabase
          .from('fluid_intake_records')
          .select('amount_ml,fluid_type,time')
          .eq('client_id', clientId)
          .eq('record_date', today)
          .order('time', { ascending: false })
          .limit(5);

        const { data: outputRecords } = await supabase
          .from('fluid_output_records')
          .select('amount_ml,output_type,appearance,time')
          .eq('client_id', clientId)
          .eq('record_date', today)
          .order('time', { ascending: false })
          .limit(5);

        const { data: urinaryRecords } = await supabase
          .from('urinary_output_records')
          .select('colour,odour,discomfort_observations,time')
          .eq('client_id', clientId)
          .eq('record_date', today)
          .order('time', { ascending: false })
          .limit(3);

        const { data: targetData } = await supabase
          .from('fluid_balance_targets')
          .select('daily_intake_target_ml,daily_output_target_ml')
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
        console.warn('[news2-ai-recommendations] Could not fetch care plan context:', error);
      }
    }

    let previousObservations: any[] = [];
    if (include_history) {
      const { data: prevObs } = await supabase
        .from('news2_observations')
        .select('total_score,risk_level,recorded_at')
        .eq('news2_patient_id', news2_patient_id)
        .neq('id', observation_id)
        .order('recorded_at', { ascending: false })
        .limit(3);
      
      previousObservations = prevObs || [];
    }

    const userPrompt = buildUserPrompt(
      observation,
      patientData,
      previousObservations,
      carePlanData,
      fluidBalanceData,
      goalsData
    );

    console.log(`[news2-ai-recommendations][${requestId}] Calling OpenAI API...`);

    const processRequest = async (): Promise<Response> => {
      try {
        const systemPrompt = buildSystemPrompt();

        const tools = [{
          type: 'function',
          function: {
            name: 'provide_enhanced_care_recommendations',
            description: 'Provide comprehensive, personalized clinical care recommendations',
            parameters: {
              type: 'object',
              properties: {
                immediate_actions: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Urgent actions required'
                },
                monitoring_plan: {
                  type: 'object',
                  properties: {
                    frequency: { type: 'string' },
                    focus_areas: { type: 'array', items: { type: 'string' } }
                  },
                  required: ['frequency', 'focus_areas']
                },
                care_suggestions: {
                  type: 'array',
                  items: { type: 'string' }
                },
                escalation_criteria: {
                  type: 'array',
                  items: { type: 'string' }
                },
                positive_observations: {
                  type: 'array',
                  items: { type: 'string' }
                },
                clinical_reasoning: {
                  type: 'string'
                },
                personalized_care_adjustments: {
                  type: 'array',
                  items: { type: 'string' }
                },
                hydration_nutrition_actions: {
                  type: 'array',
                  items: { type: 'string' }
                },
                mobility_safety_measures: {
                  type: 'array',
                  items: { type: 'string' }
                },
                comfort_wellbeing_suggestions: {
                  type: 'array',
                  items: { type: 'string' }
                },
                goal_alignment_notes: {
                  type: 'string'
                },
                cultural_religious_considerations: {
                  type: 'array',
                  items: { type: 'string' }
                },
                communication_tips: {
                  type: 'array',
                  items: { type: 'string' }
                },
                next_review_time: {
                  type: 'string'
                }
              },
              required: ['immediate_actions', 'monitoring_plan', 'care_suggestions', 'clinical_reasoning', 'escalation_criteria', 'positive_observations']
            }
          }
        }];

        const data = await callOpenAIWithRetry(systemPrompt, userPrompt, tools, 2, requestId);

        // Log the full OpenAI response for debugging
        console.log(`[news2-ai-recommendations][${requestId}] OpenAI response:`, JSON.stringify({
          id: data.id,
          model: data.model,
          choices: data.choices?.map((c: any) => ({
            index: c.index,
            finish_reason: c.finish_reason,
            message: {
              role: c.message?.role,
              content: c.message?.content?.substring(0, 200), // First 200 chars
              tool_calls: c.message?.tool_calls
            }
          })),
          usage: data.usage,
          error: data.error
        }, null, 2));

        // Monitor token usage to catch future issues
        if (data.usage) {
          const reasoningTokens = data.usage.completion_tokens_details?.reasoning_tokens || 0;
          const outputTokens = data.usage.completion_tokens - reasoningTokens;
          console.log(`[news2-ai-recommendations][${requestId}] Token usage: ${reasoningTokens} reasoning + ${outputTokens} output = ${data.usage.completion_tokens} total`);
          
          // Warning if we're getting close to the limit
          if (data.usage.completion_tokens > 16000 * 0.9) {
            console.warn(`[news2-ai-recommendations][${requestId}] Warning: Using ${Math.round(data.usage.completion_tokens / 16000 * 100)}% of token limit`);
          }
        }

        const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
        
        // Check if response was cut off due to token limit
        if (data.choices?.[0]?.finish_reason === 'length') {
          console.error(`[news2-ai-recommendations][${requestId}] Response was truncated due to token limit!`);
          throw new Error('AI response exceeded token limit. Please try again or contact support.');
        }
        if (!toolCall || toolCall.function?.name !== 'provide_enhanced_care_recommendations') {
          console.error(`[news2-ai-recommendations][${requestId}] No valid tool call`);
          return new Response(
            JSON.stringify({ recommendations: getFallbackRecommendations(observation.total_score, observation.risk_level) }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const functionArgs = JSON.parse(toolCall.function.arguments);

        const recommendations: AIRecommendations = {
          ...functionArgs,
          context_used: contextUsed,
          generated_at: new Date().toISOString(),
          model_used: 'gpt-5-2025-08-07'
        };

        console.log(`[news2-ai-recommendations][${requestId}] Success!`);

        return new Response(
          JSON.stringify({ recommendations }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error(`[news2-ai-recommendations][${requestId}] Error:`, error);
        throw error;
      }
    };

    const requestPromise = processRequest();
    activeRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      setTimeout(() => activeRequests.delete(requestKey), 2000);
    }

  } catch (error: any) {
    console.error(`[news2-ai-recommendations] Error:`, error);
    
    let statusCode = 500;
    let errorMessage = 'Unable to generate AI recommendations.';
    
    if (error.message?.includes('404')) {
      statusCode = 404;
      errorMessage = 'OpenAI API endpoint not found.';
    } else if (error.message?.includes('401') || error.message?.includes('authentication')) {
      statusCode = 401;
      errorMessage = 'OpenAI API authentication failed.';
    } else if (error.message?.includes('429') || error.message?.includes('rate limit')) {
      statusCode = 429;
      errorMessage = 'Too many requests to OpenAI.';
    }

    let fallbackRecommendations: AIRecommendations;
    
    try {
      const requestBody = await req.clone().json();
      const { observation_id } = requestBody;
      
      if (observation_id) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: observation } = await supabase
          .from('news2_observations')
          .select('total_score, risk_level')
          .eq('id', observation_id)
          .single();
        
        if (observation) {
          fallbackRecommendations = {
            ...getFallbackRecommendations(observation.total_score, observation.risk_level),
            positive_observations: observation.total_score === 0 
              ? ['All vital signs within normal parameters']
              : [],
            model_used: 'fallback-protocol-based'
          };
        } else {
          throw new Error('Could not fetch observation');
        }
      } else {
        throw new Error('No observation_id');
      }
    } catch {
      fallbackRecommendations = {
        immediate_actions: ['Contact clinical team', 'Continue monitoring'],
        monitoring_plan: {
          frequency: 'As per care plan',
          focus_areas: ['Monitor vital signs', 'Watch for changes']
        },
        care_suggestions: ['Follow care protocols', 'Document observations'],
        escalation_criteria: ['Any deterioration', 'Any concerns'],
        positive_observations: [],
        clinical_reasoning: `AI temporarily unavailable (${errorMessage}). Use clinical judgment.`,
        generated_at: new Date().toISOString(),
        model_used: 'fallback-generic'
      };
    }
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: error.message,
        recommendations: fallbackRecommendations
      }),
      { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
