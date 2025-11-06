/**
 * Domain utility functions for URL generation
 * Handles proper domain resolution for development and production environments
 */

/**
 * Get the base URL for the application
 * Uses environment variables when available, falls back to window.location.origin only for localhost
 */
export const getBaseUrl = (): string => {
  // For server-side edge functions, use SITE_URL environment variable
  if (typeof window === 'undefined') {
    // This will only work in edge functions where Deno is available
    try {
      const siteUrl = (globalThis as any).Deno?.env?.get('SITE_URL');
      if (siteUrl) {
        return siteUrl;
      }
      // Fallback for edge functions without SITE_URL
      const supabaseUrl = (globalThis as any).Deno?.env?.get('SUPABASE_URL');
      if (supabaseUrl) {
        // Extract the project ID and use the custom domain format
        const projectId = supabaseUrl.split('//')[1]?.split('.')[0];
        return `https://${projectId}.med-infinite.care`;
      }
    } catch (e) {
      // Ignore errors when Deno is not available
    }
    return 'https://med-infinite.care';
  }

  // For client-side code, prioritize VITE_SITE_URL environment variable
  const siteUrl = import.meta.env.VITE_SITE_URL;
  if (siteUrl) {
    return siteUrl;
  }

  // Only use window.location.origin for true local development (localhost)
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';

  if (isLocalhost) {
    return window.location.origin;
  }

  // For all other environments (including preview), use the custom domain
  return 'https://med-infinite.care';
};

/**
 * Generate a shareable URL for client profiles
 */
export const generateShareableUrl = (clientId: string, token?: string): string => {
  const baseUrl = getBaseUrl();
  const tokenParam = token ? `?token=${token}` : '';
  return `${baseUrl}/shared/client/${clientId}${tokenParam}`;
};

/**
 * Generate invitation URLs for carers
 */
export const generateCarerInvitationUrl = (token: string): string => {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/carer-invitation?token=${token}`;
};

/**
 * Generate invitation URLs for third-party access
 */
export const generateThirdPartyInvitationUrl = (token: string): string => {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/third-party-login?token=${token}`;
};

/**
 * Check if we're in development mode
 */
export const isDevelopmentMode = (): boolean => {
  if (typeof window === 'undefined') {
    return false; // Server-side is always production-like
  }
  
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname.includes('preview');
};