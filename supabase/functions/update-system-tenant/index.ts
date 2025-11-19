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

    // Parse body early so we can read potential system session token
    const body = await req.json().catch(() => ({})) as any

    // Try to get the user from the Authorization header (optional but required for authorization)
    const authHeader = req.headers.get('Authorization')
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader ?? '' } }
    })

    const { data: userData, error: userErr } = await supabaseUser.auth.getUser()

    let authorized = false
    let isSupabaseAuthUser = false
    let requesterId: string | null = null

    if (!userErr && userData?.user) {
      // Authenticated via Supabase Auth
      isSupabaseAuthUser = true
      requesterId = userData.user.id

      // Ensure only super admins can update tenants (auth users path)
      const { data: roles, error: roleErr } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', requesterId)

      if (roleErr) {
        console.error('[update-system-tenant] Role fetch error:', roleErr)
      }
      authorized = !!roles?.some((r: any) => r.role === 'super_admin')
    } else {
      // Fallback: validate system session token (system admin area)
      const sessionToken = body?.session_token || body?.system_session_token ||
        req.headers.get('x-system-session') || req.headers.get('x-system-session-token')

      if (sessionToken) {
        const { data: sessionRes, error: sessionErr } = await supabaseAdmin.rpc('system_validate_session', {
          p_session_token: sessionToken as string,
        })

        if (sessionErr) {
          console.error('[update-system-tenant] system_validate_session error:', sessionErr)
        }

        if ((sessionRes as any)?.success) {
          const roles = (((sessionRes as any).user?.roles) || []) as string[]
          requesterId = (sessionRes as any).user?.id ?? null
          authorized = roles.includes('super_admin')
        }
      }
    }

    if (!authorized) {
      const status = (userErr || (!authHeader && !body?.session_token)) ? 401 : 403
      return new Response(JSON.stringify({ success: false, error: status === 401 ? 'Unauthorized' : 'Forbidden' }), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { id, ...updates } = body || {}

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: 'Missing tenant id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const allowed = [
      'name', 'subdomain', 'contact_email', 'contact_phone', 'address', 'billing_email',
      'subscription_status', 'logo_url', 'primary_color', 'secondary_color', 'slug'
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