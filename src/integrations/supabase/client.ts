
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://vcrjntfjsmpoupgairep.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc1MiOiJzdXBhYmFzZSIsInJlZiI6InZjcmpudGZqc21wb3VwZ2FpcmVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NjcxNDAsImV4cCI6MjA2NTU0MzE0MH0.2AACIZItTsFj2-1LGMy0fRcYKvtXd9FtyrRDnkLGsP0"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
