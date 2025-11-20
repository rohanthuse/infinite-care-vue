import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { getSystemSessionToken } from '@/utils/systemSession';

const SUPABASE_URL = "https://vcrjntfjsmpoupgairep.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjcmpudGZqc21wb3VwZ2FpcmVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NjcxNDAsImV4cCI6MjA2NTU0MzE0MH0.2AACIZItTsFj2-1LGMy0fRcYKvtXd9FtyrRDnkLGsP0";

// Unified Supabase client with proper authentication configuration
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: localStorage,
    storageKey: 'supabase.auth.token',
  },
  global: {
    headers: {
      'apikey': SUPABASE_PUBLISHABLE_KEY,
    },
    // Add fetch wrapper to include dynamic session token headers
    fetch: (url: RequestInfo | URL, options?: RequestInit) => {
      const sessionToken = getSystemSessionToken();
      const headers = new Headers(options?.headers);
      
      if (sessionToken) {
        headers.set('x-system-session-token', sessionToken);
      }
      
      return fetch(url, {
        ...options,
        headers,
      });
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});