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

    // Fetch organizations
    const { data: orgs, error: orgErr } = await supabaseAdmin
      .from('organizations')
      .select('id, name, subdomain, contact_email, subscription_plan, subscription_status, created_at')
      .order('created_at', { ascending: false })

    if (orgErr) {
      console.error('[list-system-tenants] Error fetching organizations:', orgErr)
      return new Response(
        JSON.stringify({ success: false, error: orgErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch active member counts
    const { data: members, error: memErr } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id, status')
      .eq('status', 'active')

    if (memErr) {
      console.error('[list-system-tenants] Error fetching members:', memErr)
    }

    const memberCounts: Record<string, number> = {}
    for (const m of members || []) {
      memberCounts[m.organization_id] = (memberCounts[m.organization_id] || 0) + 1
    }

    const tenants = (orgs || []).map((org) => ({
      ...org,
      activeUsers: memberCounts[org.id] || 0,
    }))

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
