import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create admin client with service role key to bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { 
      name, 
      subdomain, 
      contactEmail, 
      contactPhone, 
      address, 
      subscriptionPlan,
      creatorEmail,
      creatorUserId
    } = await req.json()

    console.log('Creating organization with data:', { name, subdomain, contactEmail })

    // Validate required fields
    if (!name || !subdomain || !contactEmail) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: name, subdomain, and contactEmail are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if subdomain already exists
    const { data: existingOrg } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('subdomain', subdomain)
      .single()

    if (existingOrg) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Subdomain already exists' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create the organization
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name,
        subdomain,
        slug: subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        contact_email: contactEmail,
        contact_phone: contactPhone,
        address,
        subscription_plan: subscriptionPlan || 'basic',
        subscription_status: 'active'
      })
      .select()
      .single()

    if (orgError) {
      console.error('Error creating organization:', orgError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to create organization: ${orgError.message}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Successfully created organization:', organization.id)

    // Attempt to add the creator as an owner member of the organization
    try {
      let ownerUserId = creatorUserId || null

      if (!ownerUserId && creatorEmail) {
        const { data: userRes, error: userLookupError } = await supabaseAdmin.auth.admin.getUserByEmail(creatorEmail)
        if (userLookupError) {
          console.warn('Warning: could not look up creator by email:', userLookupError.message)
        }
        if (userRes?.user?.id) {
          ownerUserId = userRes.user.id
        }
      }

      if (ownerUserId) {
        const { error: memberErr } = await supabaseAdmin
          .from('organization_members')
          .insert({
            organization_id: organization.id,
            user_id: ownerUserId,
            role: 'owner',
            status: 'active',
            joined_at: new Date().toISOString()
          })

        if (memberErr) {
          console.warn('Warning: organization created but failed to add owner membership:', memberErr.message)
        } else {
          console.log('Added owner membership for user:', ownerUserId)
        }
      } else {
        console.log('No creator user identified; skipping owner membership creation')
      }
    } catch (mErr) {
      console.warn('Non-fatal error while adding owner membership:', mErr)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: organization,
        message: 'Organization created successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in create-system-tenant function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Internal server error: ${error.message}` 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})