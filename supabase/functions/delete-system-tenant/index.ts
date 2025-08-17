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

    // Validate user (must be super_admin) - support both standard auth and system session
    const authHeader = req.headers.get('Authorization')
    const body = await req.json()
    const { id, systemSessionToken, password } = body || {}
    
    let userId = null;
    let hasValidAuth = false;

    // Try standard Supabase authentication first
    if (authHeader) {
      const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } }
      })

      const { data: userData, error: userErr } = await supabaseUser.auth.getUser()
      if (!userErr && userData?.user) {
        userId = userData.user.id
        hasValidAuth = true
      }
    }

    // If standard auth failed, try system session token
    if (!hasValidAuth && systemSessionToken) {
      try {
        const { data: authResult, error: authErr } = await supabaseAdmin.rpc('system_validate_session', {
          p_session_token: systemSessionToken
        })
        
        if (!authErr && authResult?.user_id) {
          userId = authResult.user_id
          hasValidAuth = true
        }
      } catch (err) {
        console.error('[delete-system-tenant] System auth error:', err)
      }
    }

    if (!hasValidAuth || !userId) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if user has super_admin role
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

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: 'Missing tenant id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!password) {
      return new Response(JSON.stringify({ success: false, error: 'Password confirmation required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Validate password for extra security
    if (systemSessionToken) {
      try {
        const { data: passwordValid, error: passwordErr } = await supabaseAdmin.rpc('system_validate_password', {
          p_session_token: systemSessionToken,
          p_password: password
        })
        
        if (passwordErr || !passwordValid) {
          return new Response(JSON.stringify({ success: false, error: 'Invalid password' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      } catch (err) {
        console.error('[delete-system-tenant] Password validation error:', err)
        return new Response(JSON.stringify({ success: false, error: 'Password validation failed' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // Delete members first to avoid FK constraints, then delete org
    const { error: memErr } = await supabaseAdmin
      .from('organization_members')
      .delete()
      .eq('organization_id', id)

    if (memErr) {
      console.error('[delete-system-tenant] Error deleting members:', memErr)
      return new Response(JSON.stringify({ success: false, error: memErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { error: orgErr } = await supabaseAdmin
      .from('organizations')
      .delete()
      .eq('id', id)

    if (orgErr) {
      console.error('[delete-system-tenant] Error deleting organization:', orgErr)
      return new Response(JSON.stringify({ success: false, error: orgErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (e) {
    console.error('[delete-system-tenant] Unexpected error:', e)
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})