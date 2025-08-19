
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      throw new Error('Method not allowed. Use POST.');
    }

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      throw new Error('Invalid JSON in request body');
    }

    const { clientId, password, adminId } = requestBody;

    // Validate required fields
    if (!clientId) {
      throw new Error('Client ID is required');
    }
    if (!password) {
      throw new Error('Password is required');
    }
    if (!adminId) {
      throw new Error('Admin ID is required');
    }

    console.log('[setup-client-auth] Processing request for client:', clientId);
    console.log('[setup-client-auth] Admin ID:', adminId);

    // Validate environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[setup-client-auth] Missing environment variables');
      throw new Error('Server configuration error');
    }

    // Create admin Supabase client with service role
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('[setup-client-auth] Calling safe_setup_client_auth function');
    
    // Use the existing database function that handles all the complexity
    const { data: result, error } = await supabaseAdmin.rpc('safe_setup_client_auth', {
      p_client_id: clientId,
      p_password: password,
      p_admin_id: adminId
    });

    if (error) {
      console.error('[setup-client-auth] Database function error:', error);
      throw new Error(`Authentication setup failed: ${error.message}`);
    }

    if (!result?.success) {
      console.error('[setup-client-auth] Database function returned error:', result?.error);
      throw new Error(result?.error || 'Authentication setup failed');
    }

    console.log('[setup-client-auth] Setup successful:', result);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: result.message || 'Client authentication setup completed successfully',
        auth_user_id: result.auth_user_id,
        user_created: result.user_created || false,
        client_linked: result.client_linked || true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('[setup-client-auth] Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Return appropriate error response
    const isClientError = error.message.includes('required') || 
                         error.message.includes('Invalid') || 
                         error.message.includes('Method not allowed') ||
                         error.message.includes('Insufficient permissions') ||
                         error.message.includes('not found');

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
        type: isClientError ? 'validation_error' : 'server_error'
      }),
      {
        status: isClientError ? 400 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
