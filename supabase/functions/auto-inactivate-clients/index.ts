import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's date in ISO format (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];

    console.log(`[auto-inactivate-clients] Running for date: ${today}`);

    // Find clients whose active_until date has passed and status is still Active
    const { data: clientsToInactivate, error: fetchError } = await supabase
      .from('clients')
      .select('id, first_name, last_name, active_until')
      .lt('active_until', today)
      .eq('status', 'Active');

    if (fetchError) {
      console.error('[auto-inactivate-clients] Error fetching clients:', fetchError);
      throw fetchError;
    }

    console.log(`[auto-inactivate-clients] Found ${clientsToInactivate?.length || 0} clients to inactivate`);

    if (!clientsToInactivate || clientsToInactivate.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No clients to inactivate',
          inactivatedCount: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Update status to Inactive for these clients
    const clientIds = clientsToInactivate.map(c => c.id);
    
    const { error: updateError } = await supabase
      .from('clients')
      .update({ status: 'Inactive' })
      .in('id', clientIds);

    if (updateError) {
      console.error('[auto-inactivate-clients] Error updating clients:', updateError);
      throw updateError;
    }

    // Log the inactivated clients
    clientsToInactivate.forEach(client => {
      console.log(`[auto-inactivate-clients] Inactivated client: ${client.first_name} ${client.last_name} (ID: ${client.id}, active_until: ${client.active_until})`);
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully inactivated ${clientsToInactivate.length} client(s)`,
        inactivatedCount: clientsToInactivate.length,
        inactivatedClients: clientsToInactivate.map(c => ({
          id: c.id,
          name: `${c.first_name} ${c.last_name}`,
          active_until: c.active_until
        }))
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('[auto-inactivate-clients] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
