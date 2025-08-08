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

    // Try to get the user from the Authorization header (optional but required for authorization)
    const authHeader = req.headers.get('Authorization')
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader ?? '' } }
    })

    const { data: userData, error: userErr } = await supabaseUser.auth.getUser()
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const userId = userData.user.id

    // Ensure only super admins can update tenants
    const { data: roles, error: roleErr } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)

    if (roleErr || !roles?.some(r => r.role === 'super_admin')) {
      return new Response(JSON.stringify({ success: false, error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()
    const { id, ...updates } = body || {}

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: 'Missing tenant id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const allowed = [
      'name', 'subdomain', 'contact_email', 'contact_phone', 'address', 'billing_email',
      'subscription_plan', 'subscription_status', 'logo_url', 'primary_color', 'secondary_color', 'slug'
    ] as const

    const filteredUpdates: Record<string, any> = {}
    for (const key of allowed) {
      if (key in updates) filteredUpdates[key] = updates[key]
    }

    filteredUpdates.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('organizations')
      .update(filteredUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[update-system-tenant] Update error:', error)
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: true, tenant: data }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (e) {
    console.error('[update-system-tenant] Unexpected error:', e)
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})