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

    // Fetch current tenant data to detect status changes
    const { data: currentTenant, error: fetchError } = await supabaseAdmin
      .from('organizations')
      .select('name, subscription_status')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('[update-system-tenant] Fetch current tenant error:', fetchError)
      return new Response(JSON.stringify({ success: false, error: 'Failed to fetch current tenant data' }), {
        status: 500,
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

    const statusChanged = 'subscription_status' in filteredUpdates && 
                         currentTenant.subscription_status !== filteredUpdates.subscription_status

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

    // Log status change to audit logs and create notifications
    if (statusChanged && requesterId) {
      const auditLogEntry = {
        system_user_id: requesterId,
        action: 'update_tenant_status',
        resource_type: 'organization',
        resource_id: id,
        details: {
          tenant_name: currentTenant.name,
          old_status: currentTenant.subscription_status,
          new_status: filteredUpdates.subscription_status
        }
      }

      const { error: auditError } = await supabaseAdmin
        .from('system_audit_logs')
        .insert(auditLogEntry)

      if (auditError) {
        console.error('[update-system-tenant] Audit log error:', auditError)
        // Don't fail the request if audit logging fails
      } else {
        console.log('[update-system-tenant] Audit log created for status change:', auditLogEntry)
      }

      // Create notifications for all system admins about status change
      const { data: systemUsers, error: sysUserError } = await supabaseAdmin
        .from('system_users')
        .select('auth_user_id')
        .eq('is_active', true)

      if (!sysUserError && systemUsers && systemUsers.length > 0) {
        const notifications = systemUsers.map(sysUser => ({
          user_id: sysUser.auth_user_id,
          type: 'tenant_status_change',
          category: filteredUpdates.subscription_status === 'suspended' ? 'system' : 'info',
          priority: filteredUpdates.subscription_status === 'suspended' ? 'high' : 'medium',
          title: 'Tenant Status Changed',
          message: `Tenant "${currentTenant.name}" status changed to ${filteredUpdates.subscription_status}`,
          data: {
            tenant_id: id,
            tenant_name: currentTenant.name,
            old_status: currentTenant.subscription_status,
            new_status: filteredUpdates.subscription_status
          }
        }))

        const { error: notifError } = await supabaseAdmin
          .from('notifications')
          .insert(notifications)

        if (notifError) {
          console.error('[update-system-tenant] Notification creation error:', notifError)
        } else {
          console.log(`[update-system-tenant] Created ${notifications.length} status change notifications`)
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      tenant: data,
      previous_status: statusChanged ? currentTenant.subscription_status : undefined
    }), {
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