import { supabase } from '@/integrations/supabase/client';

interface CarePlanKeyContact {
  id?: string;
  first_name: string;
  surname: string;
  relationship?: string;
  is_next_of_kin?: boolean;
  gender?: string;
  email?: string;
  phone?: string;
  contact_type: string;
  address?: string;
  preferred_communication?: string;
  notes?: string;
}

interface CarePlanAutoSaveData {
  about_me?: {
    has_key_safe?: string;
    key_safe_code?: string;
    home_type?: string;
    living_status?: string;
    living_arrangement?: string;
    is_visually_impaired?: string;
    vision_description?: string;
    is_hearing_impaired?: string;
    hearing_description?: string;
    requires_interpreter?: string;
    mobility?: string;
    communication_needs?: string;
    how_i_communicate?: string;
    how_to_communicate_with_me?: string;
    ethnicity?: string;
    has_dnr?: string;
    has_respect?: string;
    has_dols?: string;
    has_lpa?: string;
    lpa_type?: string;
    lpa_holder_name?: string;
    lpa_holder_phone?: string;
    lpa_holder_email?: string;
    life_history?: string;
    personality_traits?: string;
    communication_style?: string;
    likes?: string;
    dislikes?: string;
    dos?: string;
    donts?: string;
  };
  gp_info?: {
    gp_name?: string;
    gp_phone?: string;
    gp_address?: string;
    surgery_name?: string;
  };
  pharmacy_info?: {
    pharmacy_name?: string;
    pharmacy_address?: string;
    pharmacy_phone?: string;
  };
  general?: {
    main_reasons_for_care?: string;
  };
  personal_info?: {
    religion?: string;
    marital_status?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    emergency_contact_relationship?: string;
    next_of_kin_name?: string;
    next_of_kin_phone?: string;
    next_of_kin_relationship?: string;
  };
  key_contacts?: CarePlanKeyContact[];
}

// Helper to convert yes/no/unknown string to boolean
const yesNoToBoolean = (value: string | undefined): boolean | undefined => {
  if (value === 'yes') return true;
  if (value === 'no') return false;
  return undefined;
};

/**
 * Syncs care plan auto_save_data to the client_personal_info table.
 * Called when a care plan is finalized or approved.
 */
export const syncCarePlanToClientProfile = async (
  carePlanId: string,
  clientId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('[syncCarePlanToClientProfile] Starting sync for care plan:', carePlanId, 'client:', clientId);

    // Fetch the care plan with auto_save_data
    const { data: carePlan, error: fetchError } = await supabase
      .from('client_care_plans')
      .select('auto_save_data')
      .eq('id', carePlanId)
      .single();

    if (fetchError) {
      console.error('[syncCarePlanToClientProfile] Error fetching care plan:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!carePlan?.auto_save_data) {
      console.log('[syncCarePlanToClientProfile] No auto_save_data found, skipping sync');
      return { success: true };
    }

    const autoSaveData = carePlan.auto_save_data as CarePlanAutoSaveData;
    const aboutMe = autoSaveData.about_me || {};
    const gpInfo = autoSaveData.gp_info || {};
    const pharmacyInfo = autoSaveData.pharmacy_info || {};
    const general = autoSaveData.general || {};
    const personalInfo = autoSaveData.personal_info || {};

    // Build the update payload - only include fields that have values
    const updateData: Record<string, any> = {
      client_id: clientId,
      updated_at: new Date().toISOString(),
    };

    // My Home fields
    if (aboutMe.has_key_safe !== undefined) {
      updateData.has_key_safe = yesNoToBoolean(aboutMe.has_key_safe);
    }
    if (aboutMe.key_safe_code) {
      updateData.key_safe_location = aboutMe.key_safe_code;
    }
    if (aboutMe.home_type) {
      updateData.property_type = aboutMe.home_type;
    }
    if (aboutMe.living_arrangement) {
      updateData.living_arrangement = aboutMe.living_arrangement;
    }

    // Accessibility and Communication fields
    if (aboutMe.is_visually_impaired !== undefined) {
      updateData.vision_difficulties = yesNoToBoolean(aboutMe.is_visually_impaired);
    }
    if (aboutMe.vision_description) {
      updateData.vision_description = aboutMe.vision_description;
    }
    if (aboutMe.is_hearing_impaired !== undefined) {
      updateData.hearing_difficulties = yesNoToBoolean(aboutMe.is_hearing_impaired);
    }
    if (aboutMe.hearing_description) {
      updateData.hearing_description = aboutMe.hearing_description;
    }
    if (aboutMe.requires_interpreter !== undefined) {
      updateData.interpreter_required = yesNoToBoolean(aboutMe.requires_interpreter);
    }
    if (aboutMe.mobility) {
      updateData.mobility_aids = aboutMe.mobility;
    }
    if (aboutMe.communication_needs) {
      updateData.preferred_communication_method = aboutMe.communication_needs;
    }
    if (aboutMe.how_i_communicate) {
      updateData.how_i_communicate = aboutMe.how_i_communicate;
    }
    if (aboutMe.how_to_communicate_with_me) {
      updateData.how_to_communicate_with_me = aboutMe.how_to_communicate_with_me;
    }
    if (aboutMe.communication_style) {
      updateData.communication_style = aboutMe.communication_style;
    }

    // Background & Identity fields
    if (aboutMe.ethnicity) {
      updateData.ethnicity = aboutMe.ethnicity;
    }

    // Legal Directives fields
    if (aboutMe.has_dnr !== undefined) {
      updateData.has_dnr = yesNoToBoolean(aboutMe.has_dnr);
    }
    if (aboutMe.has_respect !== undefined) {
      updateData.has_respect = yesNoToBoolean(aboutMe.has_respect);
    }
    if (aboutMe.has_dols !== undefined) {
      updateData.has_dols = yesNoToBoolean(aboutMe.has_dols);
    }
    if (aboutMe.has_lpa !== undefined) {
      updateData.has_lpa = yesNoToBoolean(aboutMe.has_lpa);
    }
    if (aboutMe.lpa_type) {
      updateData.lpa_type = aboutMe.lpa_type;
    }
    if (aboutMe.lpa_holder_name) {
      updateData.lpa_holder_name = aboutMe.lpa_holder_name;
    }
    if (aboutMe.lpa_holder_phone) {
      updateData.lpa_holder_phone = aboutMe.lpa_holder_phone;
    }
    if (aboutMe.lpa_holder_email) {
      updateData.lpa_holder_email = aboutMe.lpa_holder_email;
    }

    // Life & Personality fields
    if (aboutMe.life_history) {
      updateData.life_history = aboutMe.life_history;
    }
    if (aboutMe.personality_traits) {
      updateData.personality_traits = aboutMe.personality_traits;
    }

    // Do's & Don'ts fields
    if (aboutMe.likes) {
      updateData.likes_preferences = aboutMe.likes;
    }
    if (aboutMe.dislikes) {
      updateData.dislikes_restrictions = aboutMe.dislikes;
    }
    if (aboutMe.dos) {
      updateData.dos = aboutMe.dos;
    }
    if (aboutMe.donts) {
      updateData.donts = aboutMe.donts;
    }

    // GP fields
    if (gpInfo.gp_name) {
      updateData.gp_name = gpInfo.gp_name;
    }
    if (gpInfo.surgery_name) {
      updateData.gp_surgery_name = gpInfo.surgery_name;
    }
    if (gpInfo.gp_address) {
      updateData.gp_surgery_address = gpInfo.gp_address;
    }
    if (gpInfo.gp_phone) {
      updateData.gp_surgery_phone = gpInfo.gp_phone;
    }

    // Pharmacy fields
    if (pharmacyInfo.pharmacy_name) {
      updateData.pharmacy_name = pharmacyInfo.pharmacy_name;
    }
    if (pharmacyInfo.pharmacy_address) {
      updateData.pharmacy_address = pharmacyInfo.pharmacy_address;
    }
    if (pharmacyInfo.pharmacy_phone) {
      updateData.pharmacy_phone = pharmacyInfo.pharmacy_phone;
    }

    // General information
    if (general.main_reasons_for_care) {
      updateData.main_reasons_for_care = general.main_reasons_for_care;
    }

    // Personal info fields
    if (personalInfo.religion) {
      updateData.religion = personalInfo.religion;
    }
    if (personalInfo.marital_status) {
      updateData.marital_status = personalInfo.marital_status;
    }
    if (personalInfo.emergency_contact_name) {
      updateData.emergency_contact_name = personalInfo.emergency_contact_name;
    }
    if (personalInfo.emergency_contact_phone) {
      updateData.emergency_contact_phone = personalInfo.emergency_contact_phone;
    }
    if (personalInfo.emergency_contact_relationship) {
      updateData.emergency_contact_relationship = personalInfo.emergency_contact_relationship;
    }
    if (personalInfo.next_of_kin_name) {
      updateData.next_of_kin_name = personalInfo.next_of_kin_name;
    }
    if (personalInfo.next_of_kin_phone) {
      updateData.next_of_kin_phone = personalInfo.next_of_kin_phone;
    }
    if (personalInfo.next_of_kin_relationship) {
      updateData.next_of_kin_relationship = personalInfo.next_of_kin_relationship;
    }

    // Only proceed if we have data to sync (more than just client_id and updated_at)
    if (Object.keys(updateData).length <= 2) {
      console.log('[syncCarePlanToClientProfile] No data to sync');
      return { success: true };
    }

    console.log('[syncCarePlanToClientProfile] Syncing data:', updateData);

    // Upsert to client_personal_info - use type assertion for the dynamic object
    const { error: upsertError } = await supabase
      .from('client_personal_info')
      .upsert(updateData as any, { onConflict: 'client_id' });

    if (upsertError) {
      console.error('[syncCarePlanToClientProfile] Error upserting data:', upsertError);
      return { success: false, error: upsertError.message };
    }

    console.log('[syncCarePlanToClientProfile] Successfully synced care plan data to client profile');
    
    // Sync key contacts from care plan to client_key_contacts table
    const keyContacts = autoSaveData.key_contacts || [];
    if (keyContacts.length > 0) {
      console.log('[syncCarePlanToClientProfile] Syncing key contacts:', keyContacts.length);
      
      // Delete existing contacts for this client (replace strategy)
      const { error: deleteError } = await supabase
        .from('client_key_contacts')
        .delete()
        .eq('client_id', clientId);

      if (deleteError) {
        console.error('[syncCarePlanToClientProfile] Error deleting existing contacts:', deleteError);
        // Continue anyway - we'll still try to insert new contacts
      }

      // Insert new contacts from care plan
      const contactsToInsert = keyContacts.map((contact: CarePlanKeyContact) => ({
        client_id: clientId,
        first_name: contact.first_name,
        surname: contact.surname,
        relationship: contact.relationship || null,
        is_next_of_kin: contact.is_next_of_kin || false,
        gender: contact.gender || null,
        email: contact.email || null,
        phone: contact.phone || null,
        contact_type: contact.contact_type,
        address: contact.address || null,
        preferred_communication: contact.preferred_communication || null,
        notes: contact.notes || null,
      }));

      const { error: insertError } = await supabase
        .from('client_key_contacts')
        .insert(contactsToInsert);

      if (insertError) {
        console.error('[syncCarePlanToClientProfile] Error inserting key contacts:', insertError);
      } else {
        console.log('[syncCarePlanToClientProfile] Successfully synced key contacts');
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('[syncCarePlanToClientProfile] Unexpected error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
