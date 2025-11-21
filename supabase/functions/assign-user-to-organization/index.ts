// Supabase Edge Function: assign-user-to-organization
// Links a system user to an organization via system_user_organizations table
// CORS enabled for browser calls
// Includes audit trail logging

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-system-session-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log('[assign-user-to-organization] Function invoked');
  
  if (req.method === 'OPTIONS') {
    console.log('[assign-user-to-organization] CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[assign-user-to-organization] Parsing request body...');
    
    // Check content-type header
    const contentType = req.headers.get('content-type');
    console.log('[assign-user-to-organization] Content-Type:', contentType);
    
    // Read raw body to check if it exists
    const rawBody = await req.text();
    console.log('[assign-user-to-organization] Raw body length:', rawBody?.length || 0);
    console.log('[assign-user-to-organization] Raw body content:', rawBody);
    
    if (!rawBody || rawBody.trim() === '') {
      console.error('[assign-user-to-organization] Empty request body received');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Empty request body. Please ensure system_user_id, organization_id, and role are provided.' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    
    // Parse JSON from raw body
    let parsedBody;
    try {
      parsedBody = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('[assign-user-to-organization] JSON parse error:', parseError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Invalid JSON in request body: ${parseError.message}` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    
    const { system_user_id, organization_id, role } = parsedBody;
    console.log('[assign-user-to-organization] Request params:', { system_user_id, organization_id, role });

    if (!system_user_id || !organization_id) {
      console.error('[assign-user-to-organization] Missing required parameters');
      return new Response(JSON.stringify({ success: false, error: 'Missing system_user_id or organization_id' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[assign-user-to-organization] Missing environment variables');
      return new Response(JSON.stringify({ success: false, error: 'Missing Supabase environment variables' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log('[assign-user-to-organization] Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { 'x-client-info': 'assign-user-to-organization' } },
    });

    // First, check if assignment already exists
    console.log('[assign-user-to-organization] Checking for existing assignment...');
    const { data: existingAssignment } = await supabase
      .from('system_user_organizations')
      .select('*')
      .eq('system_user_id', system_user_id)
      .eq('organization_id', organization_id)
      .single();

    if (existingAssignment) {
      console.log('[assign-user-to-organization] Assignment already exists, updating role...');
      const { error: updateError } = await supabase
        .from('system_user_organizations')
        .update({ role: role || 'member', updated_at: new Date().toISOString() })
        .eq('system_user_id', system_user_id)
        .eq('organization_id', organization_id);

      if (updateError) {
        console.error('[assign-user-to-organization] Update error:', updateError);
        return new Response(JSON.stringify({ success: false, error: updateError.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }

      console.log('[assign-user-to-organization] Successfully updated existing assignment');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'User assignment updated successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Create new assignment in system_user_organizations
    console.log('[assign-user-to-organization] Creating new assignment...');
    const { data: newAssignment, error: insertError } = await supabase
      .from('system_user_organizations')
      .insert({
        system_user_id,
        organization_id,
        role: role || 'member'
      })
      .select()
      .single();

    if (insertError) {
      console.error('[assign-user-to-organization] Insert error:', insertError);
      
      // Log failure to audit trail if table exists
      try {
        await supabase.from('system_user_organization_audit').insert({
          system_user_id,
          organization_id,
          action: 'assigned',
          new_role: role || 'member',
          success: false,
          error_message: insertError.message,
          metadata: {
            source: 'edge_function',
            error_code: insertError.code,
          }
        });
      } catch (err) {
        console.error('[assign-user-to-organization] Audit log error:', err);
      }
      
      return new Response(JSON.stringify({ success: false, error: insertError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log('[assign-user-to-organization] Successfully created assignment:', newAssignment);

    // Also create entry in organization_members for consistency
    console.log('[assign-user-to-organization] Creating organization_members entry...');
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        user_id: system_user_id,
        organization_id,
        role: role || 'member'
      })
      .catch(err => {
        console.log('[assign-user-to-organization] organization_members insert failed (might not exist):', err);
        return { error: null }; // Don't fail if this table doesn't exist
      });

    if (memberError) {
      console.log('[assign-user-to-organization] organization_members error (non-critical):', memberError);
    }

    // Log success to audit trail
    try {
      await supabase.from('system_user_organization_audit').insert({
        system_user_id,
        organization_id,
        action: 'assigned',
        new_role: role || 'member',
        success: true,
        metadata: {
          source: 'edge_function',
          assignment: newAssignment,
        }
      });
    } catch (err) {
      console.error('[assign-user-to-organization] Audit log error:', err);
    }

    console.log('[assign-user-to-organization] Assignment completed successfully');
    return new Response(JSON.stringify({ 
      success: true, 
      relation: newAssignment,
      message: 'User successfully assigned to organization'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    console.error('[assign-user-to-organization] unexpected error:', e);
    return new Response(JSON.stringify({ success: false, error: String(e) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
