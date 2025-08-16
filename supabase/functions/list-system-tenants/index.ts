import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    console.log('[list-system-tenants] Starting optimized tenant fetch...')
    
    // Single optimized query using CTEs to get all data efficiently
    const { data: tenantsData, error: tenantsErr } = await supabaseAdmin.rpc('get_optimized_tenant_data')

    if (tenantsErr) {
      console.error('[list-system-tenants] Error from optimized query:', tenantsErr)
      
      // Fallback to basic organization fetch if custom function fails
      console.log('[list-system-tenants] Falling back to basic organization fetch...')
      const { data: orgs, error: orgErr } = await supabaseAdmin
        .from('organizations')
        .select('id, name, slug, contact_email, subscription_plan, subscription_status, created_at')
        .order('created_at', { ascending: false })

      if (orgErr) {
        console.error('[list-system-tenants] Error fetching organizations:', orgErr)
        return new Response(
          JSON.stringify({ success: false, error: orgErr.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Return basic data without user counts for now
      const tenants = (orgs || []).map((org) => ({
        ...org,
        activeUsers: 0,
        users: [],
      }))

      return new Response(
        JSON.stringify({ success: true, tenants }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[list-system-tenants] Successfully fetched ${tenantsData?.length || 0} tenants`)
    const tenants = tenantsData || []

    return new Response(
      JSON.stringify({ success: true, tenants }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    console.error('[list-system-tenants] Unexpected error:', e)
    return new Response(
      JSON.stringify({ success: false, error: e.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
