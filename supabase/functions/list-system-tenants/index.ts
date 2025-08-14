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
      .select('id, name, slug, contact_email, subscription_plan, subscription_status, created_at')
      .order('created_at', { ascending: false })

    if (orgErr) {
      console.error('[list-system-tenants] Error fetching organizations:', orgErr)
      return new Response(
        JSON.stringify({ success: false, error: orgErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch system user relations and active users
    const { data: rels, error: relErr } = await supabaseAdmin
      .from('system_user_organizations')
      .select('organization_id, system_user_id')

    if (relErr) {
      console.error('[list-system-tenants] Error fetching system_user_organizations:', relErr)
    }

    const { data: sysUsers, error: suErr } = await supabaseAdmin
      .from('system_users')
      .select('id, is_active')

    if (suErr) {
      console.error('[list-system-tenants] Error fetching system_users:', suErr)
    }

    const activeUserIds = new Set((sysUsers || []).filter((u: any) => u.is_active).map((u: any) => u.id))

    const memberCounts: Record<string, number> = {}
    for (const r of (rels || []) as any[]) {
      if (activeUserIds.has(r.system_user_id)) {
        memberCounts[r.organization_id] = (memberCounts[r.organization_id] || 0) + 1
      }
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
