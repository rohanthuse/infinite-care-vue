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
        .select('id, name, slug, contact_email, contact_phone, subscription_plan, subscription_status, subscription_expires_at, settings, created_at')
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
                  last_activity_at
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
              if (!session.last_activity_at) return false
              const lastActivity = new Date(session.last_activity_at)
              const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              return lastActivity > thirtyDaysAgo
            })
          })?.length || 0

          // Fetch subscription plan details
          let planDetails = { max_users: null, price_monthly: null, price_yearly: null }
          if (org.subscription_plan_id || org.subscription_plan) {
            const planQuery = supabaseAdmin
              .from('subscription_plans')
              .select('max_users, price_monthly, price_yearly')
            
            if (org.subscription_plan_id) {
              planQuery.eq('id', org.subscription_plan_id)
            } else {
              planQuery.eq('name', org.subscription_plan)
            }
            
            const { data: plan } = await planQuery.single()
            if (plan) {
              planDetails = plan
            }
          }

          // Fetch branches count
          const { count: totalBranches } = await supabaseAdmin
            .from('branches')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.id)

          // Fetch clients counts
          const { count: totalClients } = await supabaseAdmin
            .from('clients')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.id)

          const { count: activeClients } = await supabaseAdmin
            .from('clients')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.id)
            .eq('status', 'Active')

          // Check if tenant has agreements
          const { count: agreementCount } = await supabaseAdmin
            .from('system_tenant_agreements')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', org.id)

          return {
            ...org,
            subscription_expires_at: org.subscription_expires_at,
            subscription_duration: org.settings?.subscription_duration || null,
            billing_cycle: org.settings?.billing_cycle || 'monthly',
            total_users: totalUsers || 0,
            active_users: activeUsers,
            super_admin_first_name: null,
            super_admin_last_name: null,
            super_admin_email: null,
            plan_max_users: planDetails.max_users,
            plan_price_monthly: planDetails.price_monthly,
            plan_price_yearly: planDetails.price_yearly,
            total_branches: totalBranches || 0,
            total_clients: totalClients || 0,
            active_clients: activeClients || 0,
            has_agreement: (agreementCount || 0) > 0,
          }
        } catch (error) {
          console.error(`[list-system-tenants] Error calculating user counts for org ${org.id}:`, error)
          return {
            ...org,
            subscription_expires_at: org.subscription_expires_at,
            subscription_duration: org.settings?.subscription_duration || null,
            billing_cycle: org.settings?.billing_cycle || 'monthly',
            total_users: 0,
            active_users: 0,
            super_admin_first_name: null,
            super_admin_last_name: null,
            super_admin_email: null,
            plan_max_users: null,
            plan_price_monthly: null,
            plan_price_yearly: null,
            total_branches: 0,
            total_clients: 0,
            active_clients: 0,
            has_agreement: false,
          }
        }
      }))

      return new Response(
        JSON.stringify({ success: true, tenants: tenantsWithCounts }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[list-system-tenants] Successfully fetched ${tenantsData?.length || 0} tenants with optimized data`)
    
    // Format the optimized data to ensure proper number formatting and include all new fields
    const formattedTenants = (tenantsData || []).map((tenant: any) => ({
      ...tenant,
      subscription_expires_at: tenant.subscription_expires_at,
      subscription_duration: tenant.settings?.subscription_duration || null,
      billing_cycle: tenant.settings?.billing_cycle || 'monthly',
      total_users: parseInt(tenant.total_users) || 0,
      active_users: parseInt(tenant.active_users) || 0,
      super_admin_first_name: tenant.super_admin_first_name,
      super_admin_last_name: tenant.super_admin_last_name,
      super_admin_email: tenant.super_admin_email,
      plan_max_users: tenant.plan_max_users,
      plan_price_monthly: tenant.plan_price_monthly ? parseFloat(tenant.plan_price_monthly) : null,
      plan_price_yearly: tenant.plan_price_yearly ? parseFloat(tenant.plan_price_yearly) : null,
      total_branches: parseInt(tenant.total_branches) || 0,
      total_clients: parseInt(tenant.total_clients) || 0,
      active_clients: parseInt(tenant.active_clients) || 0,
      has_agreement: tenant.has_agreement || false,
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
