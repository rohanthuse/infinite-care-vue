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

    // Upsert relation to avoid duplicates
    const { data, error } = await supabase
      .from('system_user_organizations')
      .upsert(
        [{ system_user_id, organization_id, role: role || 'member' }],
        { onConflict: 'system_user_id,organization_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('[assign-user-to-organization] upsert error:', error);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true, relation: data }), {
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
