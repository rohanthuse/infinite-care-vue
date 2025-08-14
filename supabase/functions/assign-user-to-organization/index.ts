// Supabase Edge Function: assign-user-to-organization
// Links a system user to an organization via system_user_organizations table
// CORS enabled for browser calls

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { system_user_id, organization_id, role } = await req.json();

    if (!system_user_id || !organization_id) {
      return new Response(JSON.stringify({ success: false, error: 'Missing system_user_id or organization_id' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ success: false, error: 'Missing Supabase environment variables' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { 'x-client-info': 'assign-user-to-organization' } },
    });

    // Use the new sync function to handle both system_user_organizations AND organization_members
    const { data: syncResult, error: syncError } = await supabase.rpc(
      'sync_system_user_to_organization',
      {
        p_system_user_id: system_user_id,
        p_organization_id: organization_id,
        p_role: role || 'member'
      }
    );

    if (syncError) {
      console.error('[assign-user-to-organization] sync error:', syncError);
      return new Response(JSON.stringify({ success: false, error: syncError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Check if the sync was successful
    if (!syncResult?.success) {
      console.error('[assign-user-to-organization] sync failed:', syncResult);
      return new Response(JSON.stringify({ success: false, error: syncResult?.error || 'Sync operation failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      relation: syncResult,
      message: 'User successfully assigned to organization with auth setup'
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
