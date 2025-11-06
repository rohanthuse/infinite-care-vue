# Med-Infinite Email Branding Setup Guide

## ✅ Completed Steps

All custom application email templates have been updated with Med-Infinite branding:

1. ✅ **Shared Email Template Helper** (`supabase/functions/_shared/email-template.ts`)
   - Reusable branded HTML template with Med-Infinite logo and colors
   - Consistent header, footer, and styling across all emails

2. ✅ **Updated Edge Functions:**
   - ✅ `send-third-party-invitation` - Third-party access invitations
   - ✅ `send-carer-invitation` - Carer onboarding invitations
   - ✅ `send-invoice-emails` - Client invoice notifications
   - ✅ `send-training-metrics` - Training compliance reports

---

## 🔧 Required Setup Steps

### Step 1: Verify Your Domain in Resend

**CRITICAL:** You must verify `med-infinite.care` in Resend to send emails from your custom domain.

1. Go to: https://resend.com/domains
2. Click **"Add Domain"**
3. Enter: `med-infinite.care`
4. Resend will provide DNS records to add:

**Add these records to your DNS provider:**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| TXT | @ | `v=spf1 include:amazonses.com ~all` | 3600 |
| CNAME | resend._domainkey | `[provided by Resend]` | 3600 |
| TXT | _dmarc | `v=DMARC1; p=none;` | 3600 |

5. Wait for DNS propagation (5-60 minutes)
6. Click **"Verify"** in Resend dashboard
7. Once verified, update all edge functions to use: `Med-Infinite <noreply@med-infinite.care>`

**Until domain is verified, emails will send from:**
- `Med-Infinite <onboarding@resend.dev>` (Resend's default domain)

---

### Step 2: Customize Supabase Auth Email Templates

Auth emails (password reset, signup confirmation, etc.) must be customized in your Supabase Dashboard.

#### Access Email Templates

1. Go to: https://supabase.com/dashboard/project/vcrjntfjsmpoupgairep/auth/templates
2. You'll see 5 email templates:
   - **Confirm signup**
   - **Invite user**
   - **Magic Link**
   - **Change Email Address**
   - **Reset Password**

#### Template 1: Password Reset

**Subject:** `Reset Your Med-Infinite Password`

**Body:**
```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 40px 32px; text-align: center;">
    <h1 style="color: #ffffff; font-size: 32px; font-weight: bold; margin: 0;">Med-Infinite</h1>
    <p style="color: #e0e7ff; font-size: 14px; margin: 8px 0 0 0;">Healthcare Management System</p>
  </div>
  
  <!-- Content -->
  <div style="padding: 40px 32px;">
    <h2 style="color: #1f2937; margin-bottom: 24px;">Reset Your Password</h2>
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
      We received a request to reset your password for your Med-Infinite account.
    </p>
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
      Click the button below to create a new password:
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
        Reset Password
      </a>
    </div>
    
    <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 24px 0;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        <strong>⏰ Note:</strong> This link will expire in 60 minutes for security reasons.
      </p>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
      If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
    </p>
    
    <p style="color: #6b7280; font-size: 14px;">
      If the button doesn't work, copy and paste this link: <br>
      <span style="color: #2563eb; word-break: break-all;">{{ .ConfirmationURL }}</span>
    </p>
  </div>
  
  <!-- Footer -->
  <div style="background-color: #f9fafb; padding: 32px; text-align: center; border-top: 1px solid #e5e7eb;">
    <p style="font-size: 12px; color: #6b7280; margin: 8px 0;"><strong>Med-Infinite Healthcare Management</strong></p>
    <p style="font-size: 12px; color: #6b7280; margin: 8px 0;">
      <a href="https://med-infinite.care" style="color: #2563eb; text-decoration: none;">www.med-infinite.care</a>
    </p>
    <p style="font-size: 12px; color: #6b7280; margin: 16px 0 8px 0;">
      This is an automated email. Please do not reply directly to this message.
    </p>
    <p style="font-size: 12px; color: #9ca3af; margin: 8px 0;">
      © 2025 Med-Infinite. All rights reserved.
    </p>
  </div>
</div>
```

#### Template 2: Confirm Signup

**Subject:** `Confirm Your Med-Infinite Account`

**Body:**
```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 40px 32px; text-align: center;">
    <h1 style="color: #ffffff; font-size: 32px; font-weight: bold; margin: 0;">Med-Infinite</h1>
    <p style="color: #e0e7ff; font-size: 14px; margin: 8px 0 0 0;">Healthcare Management System</p>
  </div>
  
  <!-- Content -->
  <div style="padding: 40px 32px;">
    <h2 style="color: #1f2937; margin-bottom: 24px;">Welcome to Med-Infinite!</h2>
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
      Thank you for signing up with Med-Infinite Healthcare Management System.
    </p>
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
      To complete your account setup and verify your email address, please click the button below:
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
        Confirm Email Address
      </a>
    </div>
    
    <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 24px 0;">
      <h3 style="color: #1e40af; margin: 0 0 12px 0; font-size: 16px;">What's next?</h3>
      <ul style="color: #1e40af; margin: 0; padding-left: 20px; font-size: 14px;">
        <li>Complete your profile</li>
        <li>Set up your preferences</li>
        <li>Access your personalized dashboard</li>
      </ul>
    </div>
    
    <p style="color: #6b7280; font-size: 14px;">
      If the button doesn't work, copy and paste this link: <br>
      <span style="color: #2563eb; word-break: break-all;">{{ .ConfirmationURL }}</span>
    </p>
  </div>
  
  <!-- Footer -->
  <div style="background-color: #f9fafb; padding: 32px; text-align: center; border-top: 1px solid #e5e7eb;">
    <p style="font-size: 12px; color: #6b7280; margin: 8px 0;"><strong>Med-Infinite Healthcare Management</strong></p>
    <p style="font-size: 12px; color: #6b7280; margin: 8px 0;">
      <a href="https://med-infinite.care" style="color: #2563eb; text-decoration: none;">www.med-infinite.care</a>
    </p>
    <p style="font-size: 12px; color: #6b7280; margin: 16px 0 8px 0;">
      This is an automated email. Please do not reply directly to this message.
    </p>
    <p style="font-size: 12px; color: #9ca3af; margin: 8px 0;">
      © 2025 Med-Infinite. All rights reserved.
    </p>
  </div>
</div>
```

#### Template 3: Magic Link

**Subject:** `Your Med-Infinite Sign-In Link`

**Body:**
```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 40px 32px; text-align: center;">
    <h1 style="color: #ffffff; font-size: 32px; font-weight: bold; margin: 0;">Med-Infinite</h1>
    <p style="color: #e0e7ff; font-size: 14px; margin: 8px 0 0 0;">Healthcare Management System</p>
  </div>
  
  <!-- Content -->
  <div style="padding: 40px 32px;">
    <h2 style="color: #1f2937; margin-bottom: 24px;">Sign In to Med-Infinite</h2>
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
      Click the button below to sign in to your Med-Infinite account:
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
        Sign In to Med-Infinite
      </a>
    </div>
    
    <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 24px 0;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        <strong>⏰ Note:</strong> This link will expire in 60 minutes.
      </p>
    </div>
    
    <p style="color: #6b7280; font-size: 14px;">
      If you didn't request this, please ignore this email.
    </p>
  </div>
  
  <!-- Footer -->
  <div style="background-color: #f9fafb; padding: 32px; text-align: center; border-top: 1px solid #e5e7eb;">
    <p style="font-size: 12px; color: #6b7280; margin: 8px 0;"><strong>Med-Infinite Healthcare Management</strong></p>
    <p style="font-size: 12px; color: #6b7280; margin: 8px 0;">
      <a href="https://med-infinite.care" style="color: #2563eb; text-decoration: none;">www.med-infinite.care</a>
    </p>
    <p style="font-size: 12px; color: #9ca3af; margin: 8px 0;">
      © 2025 Med-Infinite. All rights reserved.
    </p>
  </div>
</div>
```

#### Template 4: Change Email Address

**Subject:** `Confirm Your New Med-Infinite Email Address`

**Body:**
```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 40px 32px; text-align: center;">
    <h1 style="color: #ffffff; font-size: 32px; font-weight: bold; margin: 0;">Med-Infinite</h1>
    <p style="color: #e0e7ff; font-size: 14px; margin: 8px 0 0 0;">Healthcare Management System</p>
  </div>
  
  <!-- Content -->
  <div style="padding: 40px 32px;">
    <h2 style="color: #1f2937; margin-bottom: 24px;">Confirm Email Change</h2>
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
      We received a request to change the email address for your Med-Infinite account.
    </p>
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
      Click the button below to confirm this change:
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
        Confirm New Email
      </a>
    </div>
    
    <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 24px 0;">
      <p style="margin: 0; color: #991b1b; font-size: 14px;">
        <strong>⚠️ Important:</strong> If you didn't request this change, please contact support immediately and change your password.
      </p>
    </div>
  </div>
  
  <!-- Footer -->
  <div style="background-color: #f9fafb; padding: 32px; text-align: center; border-top: 1px solid #e5e7eb;">
    <p style="font-size: 12px; color: #6b7280; margin: 8px 0;"><strong>Med-Infinite Healthcare Management</strong></p>
    <p style="font-size: 12px; color: #6b7280; margin: 8px 0;">
      <a href="https://med-infinite.care" style="color: #2563eb; text-decoration: none;">www.med-infinite.care</a>
    </p>
    <p style="font-size: 12px; color: #9ca3af; margin: 8px 0;">
      © 2025 Med-Infinite. All rights reserved.
    </p>
  </div>
</div>
```

#### Template 5: Invite User

**Subject:** `You've Been Invited to Med-Infinite`

**Body:**
```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 40px 32px; text-align: center;">
    <h1 style="color: #ffffff; font-size: 32px; font-weight: bold; margin: 0;">Med-Infinite</h1>
    <p style="color: #e0e7ff; font-size: 14px; margin: 8px 0 0 0;">Healthcare Management System</p>
  </div>
  
  <!-- Content -->
  <div style="padding: 40px 32px;">
    <h2 style="color: #1f2937; margin-bottom: 24px;">You've Been Invited!</h2>
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
      You have been invited to join Med-Infinite Healthcare Management System.
    </p>
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
      Click the button below to accept your invitation and set up your account:
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
        Accept Invitation
      </a>
    </div>
    
    <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 24px 0;">
      <h3 style="color: #1e40af; margin: 0 0 12px 0; font-size: 16px;">Getting Started:</h3>
      <ul style="color: #1e40af; margin: 0; padding-left: 20px; font-size: 14px;">
        <li>Create your secure password</li>
        <li>Complete your profile</li>
        <li>Access your dashboard</li>
      </ul>
    </div>
  </div>
  
  <!-- Footer -->
  <div style="background-color: #f9fafb; padding: 32px; text-align: center; border-top: 1px solid #e5e7eb;">
    <p style="font-size: 12px; color: #6b7280; margin: 8px 0;"><strong>Med-Infinite Healthcare Management</strong></p>
    <p style="font-size: 12px; color: #6b7280; margin: 8px 0;">
      <a href="https://med-infinite.care" style="color: #2563eb; text-decoration: none;">www.med-infinite.care</a>
    </p>
    <p style="font-size: 12px; color: #9ca3af; margin: 8px 0;">
      © 2025 Med-Infinite. All rights reserved.
    </p>
  </div>
</div>
```

---

## 🧪 Testing Checklist

After completing the setup above, test all email types:

### Custom Application Emails

- [ ] **Third-Party Invitation**: Trigger from admin dashboard → Check branding, colors, button
- [ ] **Carer Invitation**: Send carer invite → Verify "Med-Infinite" (not "CarePortal")
- [ ] **Invoice Email**: Generate invoice → Check branded template with Med-Infinite colors
- [ ] **Training Metrics**: Send training report → Verify header/footer branding

### Supabase Auth Emails

- [ ] **Password Reset**: Use "Forgot Password" → Check Med-Infinite branded email
- [ ] **Sign Up Confirmation**: Create new account → Verify confirmation email branding
- [ ] **Magic Link**: Request magic link → Check branding
- [ ] **Email Change**: Change email address → Verify confirmation email

### Email Rendering Tests

- [ ] **Desktop Gmail**: Open emails, check formatting
- [ ] **Mobile Gmail**: Verify responsive design
- [ ] **Outlook**: Check if images/colors load correctly
- [ ] **Apple Mail**: Test on iPhone/iPad
- [ ] **Spam Check**: Verify emails land in inbox (not spam folder)

### Domain Verification Tests

Once domain is verified in Resend:

- [ ] Update all edge functions `from:` field to use `@med-infinite.care`
- [ ] Send test emails from custom domain
- [ ] Check email headers to confirm `med-infinite.care` as sender
- [ ] Verify SPF, DKIM, DMARC records pass authentication

---

## 📝 After Domain Verification

Once `med-infinite.care` is verified in Resend, update the `from:` field in all edge functions:

**Change from:**
```typescript
from: "Med-Infinite <onboarding@resend.dev>"
```

**To:**
```typescript
from: "Med-Infinite <noreply@med-infinite.care>"
```

**Or use different addresses for different purposes:**
- `Med-Infinite <noreply@med-infinite.care>` - General notifications
- `Med-Infinite <hello@med-infinite.care>` - Welcome emails
- `Med-Infinite <support@med-infinite.care>` - Support-related emails
- `Med-Infinite <billing@med-infinite.care>` - Invoice emails

---

## 🎨 Brand Colors Reference

All Med-Infinite emails use this consistent color palette:

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Primary Blue | `#2563eb` | Buttons, links, primary actions |
| Dark Blue | `#1e40af` | Header gradients, hover states |
| Light Blue | `#e0e7ff` | Taglines, subtle accents |
| Success Green | `#059669` | Positive indicators |
| Warning Amber | `#f59e0b` | Warnings, expiring items |
| Danger Red | `#dc2626` | Errors, urgent actions |
| Dark Slate | `#1f2937` | Headings |
| Medium Gray | `#374151` | Body text |
| Light Gray | `#6b7280` | Secondary text |

---

## 🔗 Quick Links

- **Resend Dashboard**: https://resend.com/emails
- **Resend Domains**: https://resend.com/domains
- **Supabase Auth Templates**: https://supabase.com/dashboard/project/vcrjntfjsmpoupgairep/auth/templates
- **Edge Function Logs**: https://supabase.com/dashboard/project/vcrjntfjsmpoupgairep/functions

---

## 🆘 Troubleshooting

### Emails not sending
- Check RESEND_API_KEY is configured correctly
- Verify edge function logs for errors
- Ensure Resend account has credits/is not suspended

### Emails going to spam
- Verify SPF, DKIM, DMARC records in DNS
- Warm up your domain by sending gradually increasing volume
- Avoid spam trigger words in subject lines
- Ensure unsubscribe link is present (for marketing emails)

### Custom domain not working
- Verify all DNS records are correctly added
- Wait 24-72 hours for DNS propagation
- Check domain verification status in Resend dashboard
- Use [DNSChecker.org](https://dnschecker.org) to verify records

### Images not loading
- Ensure email HTML uses inline styles (not external CSS)
- Host images on HTTPS URLs
- Use absolute URLs for all resources
- Test in multiple email clients

---

## ✅ Summary

**Completed:**
- ✅ Created shared Med-Infinite email template helper
- ✅ Updated all 4 custom edge functions with branding
- ✅ Edge functions will deploy automatically

**You need to do:**
1. ⏳ Verify `med-infinite.care` domain in Resend (requires DNS access)
2. ⏳ Copy/paste auth email templates into Supabase Dashboard
3. ⏳ Test all email types
4. ⏳ Update edge functions to use `@med-infinite.care` after verification

**Total time estimate:** 30-60 minutes

---

**Need help?** Contact your system administrator or check the Resend/Supabase documentation for troubleshooting.
