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

    // Fetch real tenant users (staff, clients, admins) for each organization
    const memberCounts: Record<string, number> = {}
    const userDetails: Record<string, any[]> = {}
    
    for (const org of (orgs || [])) {
      // Get branches for this organization
      const { data: branches, error: branchErr } = await supabaseAdmin
        .from('branches')
        .select('id')
        .eq('organization_id', org.id)

      if (branchErr) {
        console.error(`[list-system-tenants] Error fetching branches for org ${org.id}:`, branchErr)
        continue
      }

      const branchIds = (branches || []).map(b => b.id)
      let totalUsers = 0
      const orgUsers: any[] = []

      if (branchIds.length > 0) {
        // Count and fetch staff
        const { data: staff, error: staffErr } = await supabaseAdmin
          .from('staff')
          .select('id, first_name, last_name, email, last_login_at, status')
          .in('branch_id', branchIds)
          .eq('status', 'Active')

        if (!staffErr && staff) {
          totalUsers += staff.length
          orgUsers.push(...staff.map(s => ({ ...s, user_type: 'staff' })))
        }

        // Count and fetch clients
        const { data: clients, error: clientErr } = await supabaseAdmin
          .from('clients')
          .select('id, first_name, last_name, email, last_login_at')
          .in('branch_id', branchIds)

        if (!clientErr && clients) {
          totalUsers += clients.length
          orgUsers.push(...clients.map(c => ({ ...c, user_type: 'client' })))
        }

        // Count and fetch branch admins
        const { data: admins, error: adminErr } = await supabaseAdmin
          .from('admin_branches')
          .select(`
            admin_id,
            admin_profiles:admin_id (
              id, first_name, last_name, email, last_login_at
            )
          `)
          .in('branch_id', branchIds)

        if (!adminErr && admins) {
          const adminUsers = admins
            .filter(a => a.admin_profiles)
            .map(a => ({ 
              ...a.admin_profiles, 
              user_type: 'admin' 
            }))
          totalUsers += adminUsers.length
          orgUsers.push(...adminUsers)
        }
      }

      memberCounts[org.id] = totalUsers
      userDetails[org.id] = orgUsers
    }

    const tenants = (orgs || []).map((org) => ({
      ...org,
      activeUsers: memberCounts[org.id] || 0,
      users: userDetails[org.id] || [],
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
