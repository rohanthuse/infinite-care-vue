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
    const { id, systemSessionToken } = body || {}
    
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
        
        if (!authErr && authResult?.success && authResult?.user?.id) {
          userId = authResult.user.id
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
      .from('system_user_roles')
      .select('role')
      .eq('system_user_id', userId)

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

    // Use comprehensive cascade delete function to handle all dependencies
    console.log('[delete-system-tenant] Starting cascade delete for organization:', id)
    
    // Set a longer statement timeout for this operation (60 seconds)
    await supabaseAdmin.rpc('exec_sql', { 
      sql: 'SET statement_timeout = 60000' 
    }).catch(() => {
      // If exec_sql doesn't exist, try setting it directly in the connection
      console.log('[delete-system-tenant] Could not set timeout via exec_sql')
    })
    
    const { data: deleteResult, error: deleteErr } = await supabaseAdmin.rpc('delete_organization_cascade', {
      p_organization_id: id,
      p_system_user_id: userId
    })

    if (deleteErr) {
      console.error('[delete-system-tenant] RPC error:', deleteErr)
      return new Response(JSON.stringify({ success: false, error: deleteErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!deleteResult?.success) {
      console.error('[delete-system-tenant] Delete failed:', deleteResult?.error)
      return new Response(JSON.stringify({ success: false, error: deleteResult?.error || 'Delete failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('[delete-system-tenant] Successfully deleted organization:', deleteResult?.organization_name)

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