# Supabase Email Verification Configuration

## Current Flow
1. User signs up → Redirects to `/verify-email` page
2. User clicks confirmation link in email → Goes to `/auth/callback?code=xxx`
3. Callback exchanges code for session → Redirects to `/dashboard`

## Required Supabase Configuration

### 1. Navigate to Supabase Dashboard
Go to: https://app.supabase.com/project/YOUR_PROJECT_ID/auth/url-configuration

### 2. Configure URL Settings

**Site URL** (for production):
```
https://your-production-domain.com
```

**Site URL** (for development):
```
http://localhost:3000
```

**Redirect URLs** (add these):
```
http://localhost:3000/auth/callback
https://your-production-domain.com/auth/callback
```

### 3. Email Templates (Optional)

Go to: Authentication → Email Templates

**Confirm signup template** should redirect to:
```
{{ .ConfirmationURL }}
```

This will automatically use the correct redirect URL configured above.

### 4. Environment Variables

Make sure your `.env.local` has:
```env
NEXT_PUBLIC_SUPABASE_URL=https://ggqoyetdqdzyujtlycmm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # or your production URL
```

## Testing Email Verification

### Development Testing
1. Sign up at: http://localhost:3000/signup
2. Check console or Supabase logs for confirmation link
3. In Supabase Dashboard → Authentication → Users, you can manually confirm users

### To manually confirm a user:
1. Go to Supabase Dashboard → Authentication → Users
2. Find the user
3. Click the three dots → "Confirm email"

## Email Provider Setup (Production)

For production, configure a custom SMTP provider:
1. Go to: Project Settings → Auth → SMTP Settings
2. Enable custom SMTP
3. Add your SMTP credentials (Gmail, SendGrid, AWS SES, etc.)

**Gmail Example:**
- Host: smtp.gmail.com
- Port: 587
- Username: your-email@gmail.com
- Password: App Password (not your regular password!)

## Troubleshooting

### Issue: Email verification link doesn't work
**Solution:** Make sure the redirect URL in Supabase Dashboard includes `/auth/callback`

### Issue: User stuck on verify-email page
**Solution:** Check Supabase → Authentication → Users to see if email is confirmed

### Issue: No email received
**Solutions:**
- Check spam folder
- Check Supabase logs for email errors
- Verify SMTP settings (production)
- Use manual confirmation (development)

### Issue: After clicking link, user not logged in
**Solution:** Check that `/auth/callback` route is properly configured and code exchange is working

## Current Configuration Status

✅ `/auth/callback` route exists and handles code exchange
✅ `/verify-email` page shows instructions to user
✅ Signup action sets `emailRedirectTo` correctly
✅ Password validation updated to 6 characters minimum

⚠️ **YOU NEED TO DO:** Configure Supabase Dashboard URL settings (see steps 1-2 above)
