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
      
      // Fallback to basic organization fetch with manual user counting
      console.log('[list-system-tenants] Falling back to basic organization fetch...')
      const { data: orgs, error: orgErr } = await supabaseAdmin
        .from('organizations')
        .select('id, name, slug, contact_email, contact_phone, subscription_plan, subscription_status, created_at')
        .order('created_at', { ascending: false })

      if (orgErr) {
        console.error('[list-system-tenants] Error fetching organizations:', orgErr)
        return new Response(
          JSON.stringify({ success: false, error: orgErr.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Calculate user counts manually for each organization
      const tenantsWithCounts = await Promise.all((orgs || []).map(async (org) => {
        try {
          // Get total users for this organization
          const { count: totalUsers } = await supabaseAdmin
            .from('system_user_organizations')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.id)

          // Get users with their session data to determine activity
          const { data: userSessions } = await supabaseAdmin
            .from('system_user_organizations')
            .select(`
              system_user_id,
              system_users!inner(
                id,
                is_active,
                system_sessions(
                  last_activity_at,
                  is_active
                )
              )
            `)
            .eq('organization_id', org.id)
            .eq('system_users.is_active', true)

          // Count active users (with sessions in last 30 days)
          const activeUsers = userSessions?.filter(userOrg => {
            const user = userOrg.system_users
            if (!user?.system_sessions || !Array.isArray(user.system_sessions)) return false
            
            return user.system_sessions.some((session: any) => {
              if (!session.is_active || !session.last_activity_at) return false
              const lastActivity = new Date(session.last_activity_at)
              const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              return lastActivity > thirtyDaysAgo
            })
          })?.length || 0

          return {
            ...org,
            total_users: totalUsers || 0,
            active_users: activeUsers,
            recent_activity_count: activeUsers
          }
        } catch (error) {
          console.error(`[list-system-tenants] Error calculating user counts for org ${org.id}:`, error)
          return {
            ...org,
            total_users: 0,
            active_users: 0,
            recent_activity_count: 0
          }
        }
      }))

      return new Response(
        JSON.stringify({ success: true, tenants: tenantsWithCounts }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[list-system-tenants] Successfully fetched ${tenantsData?.length || 0} tenants with optimized data`)
    
    // Format the optimized data to ensure proper number formatting
    const formattedTenants = (tenantsData || []).map((tenant: any) => ({
      ...tenant,
      total_users: parseInt(tenant.total_users) || 0,
      active_users: parseInt(tenant.active_users) || 0,
      recent_activity_count: parseInt(tenant.recent_activity_count) || 0
    }))

    return new Response(
      JSON.stringify({ success: true, tenants: formattedTenants }),
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
