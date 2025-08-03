import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClientPersonalCare } from '@/hooks/useClientPersonalCare';
import { useClientDietaryRequirements } from '@/hooks/useClientDietaryRequirements';

interface CarePlanDataEnhancerProps {
  carePlanId: string;
  clientId: string;
}

/**
 * Component to enhance care plan data by pulling from client-specific tables
 * and updating the auto_save_data field with comprehensive information
 */
export const CarePlanDataEnhancer: React.FC<CarePlanDataEnhancerProps> = ({
  carePlanId,
  clientId
}) => {
  const { data: personalCare } = useClientPersonalCare(clientId);
  const { data: dietaryRequirements } = useClientDietaryRequirements(clientId);

  useEffect(() => {
    const enhanceCarePlanData = async () => {
      if (!carePlanId || !clientId) return;

      try {
        // Get current care plan
        const { data: carePlan, error: carePlanError } = await supabase
          .from('client_care_plans')
          .select('auto_save_data')
          .eq('id', carePlanId)
          .single();

        if (carePlanError) {
          console.error('Error fetching care plan:', carePlanError);
          return;
        }

        const currentAutoSaveData = (carePlan?.auto_save_data as any) || {};

        // Enhance with personal care data
        const enhancedPersonalCare = personalCare ? {
          bathing_preferences: personalCare.bathing_preferences,
          assistance_level: personalCare.dressing_assistance_level,
          behavioral_notes: personalCare.behavioral_notes,
          comfort_measures: personalCare.comfort_measures,
          hygiene_needs: personalCare.personal_hygiene_needs,
          mobility_requirements: personalCare.continence_status,
          daily_routines: {
            morning: 'Standard morning routine',
            evening: 'Standard evening routine', 
            bedtime: personalCare.sleep_patterns
          },
          assistance_levels: {
            bathing: personalCare.bathing_preferences || 'Independent',
            dressing: personalCare.dressing_assistance_level || 'Independent',
            toileting: personalCare.toileting_assistance_level || 'Independent',
            mobility: 'Independent'
          }
        } : currentAutoSaveData.personal_care || {};

        // Enhance with dietary requirements data
        const enhancedDietaryRequirements = dietaryRequirements ? {
          dietary_restrictions: dietaryRequirements.dietary_restrictions,
          food_allergies: dietaryRequirements.food_allergies,
          food_preferences: dietaryRequirements.food_preferences,
          texture_preference: dietaryRequirements.texture_modifications,
          special_equipment: dietaryRequirements.special_equipment_needed,
          nutritional_supplements: dietaryRequirements.supplements,
          meal_plans: dietaryRequirements.meal_schedule || {
            breakfast: 'Standard breakfast',
            lunch: 'Standard lunch',
            dinner: 'Standard dinner',
            snacks: 'As needed'
          },
          feeding_assistance: {
            required: dietaryRequirements.feeding_assistance_required || false,
            level: dietaryRequirements.feeding_assistance_required ? 'Partial assistance' : 'Independent',
            equipment: dietaryRequirements.special_equipment_needed
          }
        } : currentAutoSaveData.dietary_requirements || {};

        // Create enhanced auto_save_data
        const enhancedAutoSaveData = {
          ...currentAutoSaveData,
          personal_care: enhancedPersonalCare,
          dietary_requirements: enhancedDietaryRequirements,
          // Add sample data for other sections if not present
          personal_info: currentAutoSaveData.personal_info || {
            emergency_contacts: [
              {
                name: 'Emergency Contact',
                relationship: 'Next of Kin',
                phone: 'To be updated'
              }
            ],
            communication_preferences: {
              language: 'English',
              method: 'Phone',
              interpreter_needed: false
            },
            personal_preferences: {
              hobbies: 'To be assessed',
              music: 'To be assessed',
              pets: 'None noted'
            },
            mobility_aids: ['To be assessed during care plan setup']
          },
          medical_info: currentAutoSaveData.medical_info || {
            conditions: ['To be assessed during medical review'],
            allergies: ['No known allergies'],
            healthcare_providers: [
              {
                name: 'Primary Care Provider',
                specialty: 'General Practice',
                phone: 'To be updated'
              }
            ],
            medical_history: 'Medical history to be documented during assessment'
          },
          // Enhanced metadata
          last_enhanced: new Date().toISOString(),
          data_completeness: {
            personal_info: !!currentAutoSaveData.personal_info,
            medical_info: !!currentAutoSaveData.medical_info,
            personal_care: !!personalCare,
            dietary_requirements: !!dietaryRequirements
          }
        };

        // Update the care plan with enhanced data
        const { error: updateError } = await supabase
          .from('client_care_plans')
          .update({ 
            auto_save_data: enhancedAutoSaveData,
            updated_at: new Date().toISOString()
          })
          .eq('id', carePlanId);

        if (updateError) {
          console.error('Error updating care plan with enhanced data:', updateError);
        } else {
          console.log('Care plan data enhanced successfully');
        }

      } catch (error) {
        console.error('Error enhancing care plan data:', error);
      }
    };

    enhanceCarePlanData();
  }, [carePlanId, clientId, personalCare, dietaryRequirements]);

  // This component doesn't render anything
  return null;
};