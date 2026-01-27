import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[process-system-notifications] Starting system notification processing...');

    // 1. Process subscription expiry notifications
    console.log('[process-system-notifications] Processing subscription expiry notifications...');
    const { data: expiryData, error: expiryError } = await supabase.rpc('process_subscription_expiry_notifications');
    
    if (expiryError) {
      console.error('[process-system-notifications] Expiry notification error:', expiryError);
    } else {
      console.log('[process-system-notifications] Subscription expiry notifications:', expiryData);
    }

    // 2. Check for pending agreements
    console.log('[process-system-notifications] Checking for pending agreements...');
    const { data: agreementData, error: agreementError } = await supabase.rpc('check_pending_agreements');
    
    if (agreementError) {
      console.error('[process-system-notifications] Pending agreement error:', agreementError);
    } else {
      console.log('[process-system-notifications] Pending agreement notifications:', agreementData);
    }

    // 3. Process subscription expiry (mark as inactive)
    console.log('[process-system-notifications] Processing subscription expiry...');
    const { data: processData, error: processError } = await supabase.rpc('process_subscription_expiry');
    
    if (processError) {
      console.error('[process-system-notifications] Subscription expiry error:', processError);
    } else {
      console.log('[process-system-notifications] Subscription expiry processed:', processData);
    }

    // 4. Process care plan review alerts for carers
    console.log('[process-system-notifications] Processing care plan review alerts...');
    const { data: reviewAlertData, error: reviewAlertError } = await supabase.rpc('process_care_plan_review_alerts');
    
    if (reviewAlertError) {
      console.error('[process-system-notifications] Care plan review alert error:', reviewAlertError);
    } else {
      console.log('[process-system-notifications] Care plan review alerts processed:', reviewAlertData);
    }

    console.log('[process-system-notifications] All notification processing complete');

    return new Response(
      JSON.stringify({
        success: true,
        subscription_expiry_notifications: expiryData,
        pending_agreement_notifications: agreementData,
        subscription_expiry_processed: processData,
        care_plan_review_alerts: reviewAlertData,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('[process-system-notifications] Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});