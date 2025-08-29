# Authentication Setup

## Environment Variables

This app uses Supabase for authentication. The following configuration is hardcoded in the client:

- **Supabase URL**: `https://vcrjntfjsmpoupgairep.supabase.co`
- **Supabase Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## Supabase Configuration Required

### URL Configuration in Supabase Dashboard

1. Go to **Authentication → URL Configuration** in your Supabase project
2. Set the following:

**Site URL**:
- For development: `http://localhost:8080` (or your Lovable preview URL)
- For production: Your deployed app URL

**Redirect URLs** (add all that apply):
- `http://localhost:8080/auth/callback`
- `https://your-lovable-preview-url.lovableproject.com/auth/callback`
- `https://your-production-domain.com/auth/callback`

## Features

✅ **Reliable sign-in** across Chrome, Safari, and Brave browsers
✅ **Session restoration** on page refresh  
✅ **Clean logout** that works every time
✅ **Single source of truth** for authentication state
✅ **Proper timeout handling** (5-second safety timeout)
✅ **Cross-browser compatibility** with localStorage persistence
✅ **Robust error handling** and user feedback

## Usage

```tsx
import { useAuth } from '@/contexts/UnifiedAuthProvider';

const MyComponent = () => {
  const { user, session, loading, signIn, signOut } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in</div>;
  
  return <div>Welcome, {user.email}!</div>;
};
```

## Testing Checklist

- [ ] Fresh load (no session): shows login, can sign in, lands on dashboard
- [ ] Refresh on protected route: stays signed in and renders content  
- [ ] Logout then login again: no stuck loading states
- [ ] Safari/Brave private window compatibility
- [ ] Cross-tab session synchronization