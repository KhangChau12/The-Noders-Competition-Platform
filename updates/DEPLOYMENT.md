# Deployment Guide

Complete guide for deploying the AI Competition Platform to production.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Supabase Setup](#supabase-setup)
- [Vercel Deployment](#vercel-deployment)
- [Post-Deployment](#post-deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ Supabase account ([Sign up](https://supabase.com/))
- ✅ Vercel account ([Sign up](https://vercel.com/))
- ✅ GitHub repository with your code
- ✅ Custom domain (optional but recommended)
- ✅ SMTP credentials (optional, for custom emails)

---

## Supabase Setup

### 1. Create Production Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click **"New Project"**
3. Configure:
   - **Name**: `competition-platform-prod`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Start with Free tier, upgrade as needed

4. Wait 2-3 minutes for initialization

### 2. Database Migration

**Via Supabase Dashboard** (Recommended for first deployment):

1. Go to **SQL Editor**
2. Open `supabase/migrations/001_initial_schema.sql` from your project
3. Copy entire contents
4. Paste into SQL Editor
5. Click **"Run"**
6. Verify success (check for green checkmarks)

**Via Supabase CLI** (For updates):

```bash
# Install CLI
npm install -g supabase

# Login
supabase login

# Link to production project
supabase link --project-ref YOUR_PROJECT_REF

# Push migration
supabase db push
```

### 3. Create Storage Buckets

1. Go to **Storage** in Supabase Dashboard
2. Create these buckets:

| Bucket Name | Public | Purpose |
|-------------|--------|---------|
| `submissions` | ❌ No | User CSV submissions |
| `answer-keys` | ❌ No | Admin answer keys (secret) |
| `avatars` | ✅ Yes | User/team profile pictures |
| `competition-assets` | ✅ Yes | Competition images, docs |

3. Configure Storage Policies (RLS already set in migration)

### 4. Deploy Edge Function

```bash
# Deploy validate-csv function
supabase functions deploy validate-csv --project-ref YOUR_PROJECT_REF

# Verify deployment
supabase functions list
```

### 5. Configure Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure **Email Templates**:

**Confirm Signup Template**:
```html
<h2>Confirm your email</h2>
<p>Follow this link to confirm your email:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>
<p>If you didn't sign up, please ignore this email.</p>
```

**Reset Password Template**:
```html
<h2>Reset your password</h2>
<p>Follow this link to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>If you didn't request this, please ignore this email.</p>
```

4. **URL Configuration**:
   - Site URL: `https://your-domain.com`
   - Redirect URLs: Add `https://your-domain.com/auth/callback`

### 6. Get API Credentials

1. Go to **Project Settings** → **API**
2. Copy these values (you'll need them for Vercel):
   - **URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` ⚠️ Keep secret!

---

## Vercel Deployment

### 1. Push to GitHub

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Import Project to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 3. Add Environment Variables

Click **"Environment Variables"** and add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

⚠️ **Important**: Select **"Production"**, **"Preview"**, and **"Development"** for all variables.

### 4. Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. Vercel will provide a URL: `https://your-project.vercel.app`

### 5. Configure Custom Domain (Optional)

1. Go to **Project Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration steps:
   - **Type**: `A` record
   - **Name**: `@` (root) or `www`
   - **Value**: Vercel IP (provided in dashboard)
   - **TTL**: 3600

4. Wait for DNS propagation (5-60 minutes)
5. Vercel auto-provisions SSL certificate

### 6. Update Environment Variables

After custom domain is configured:

```env
NEXT_PUBLIC_SITE_URL=https://your-custom-domain.com
```

Update in Vercel → **Settings** → **Environment Variables** → **Redeploy**

---

## Post-Deployment

### 1. Create First Admin User

1. Visit your production site
2. Sign up with email: `admin@yourcompany.com`
3. Verify email
4. Go to Supabase SQL Editor
5. Run:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@yourcompany.com';
```

6. Log out and log in again to see admin dashboard

### 2. Test Core Functionality

✅ **Authentication**:
- [ ] Sign up with new email
- [ ] Verify email works
- [ ] Login with credentials
- [ ] Password reset flow

✅ **Competitions**:
- [ ] Create a test competition
- [ ] Upload answer key
- [ ] Browse competitions (public)

✅ **Submissions**:
- [ ] Register for competition
- [ ] Upload CSV file
- [ ] Verify validation works
- [ ] Check leaderboard updates

✅ **Admin**:
- [ ] Access admin dashboard
- [ ] Approve registrations
- [ ] View analytics

### 3. Configure SMTP (Optional)

For custom branded emails:

1. **Get SMTP Credentials** (e.g., SendGrid, Mailgun, Gmail)
2. Go to Supabase → **Authentication** → **Settings**
3. Enable **"Custom SMTP"**
4. Configure:
   ```
   Host: smtp.sendgrid.net
   Port: 587
   User: apikey
   Password: YOUR_API_KEY
   Sender: noreply@your-domain.com
   ```

### 4. Set Up Backups

**Supabase Automatic Backups**:
- Free tier: Daily backups (7-day retention)
- Pro tier: Hourly backups (30-day retention)
- Access: Supabase Dashboard → **Database** → **Backups**

**Manual Backup**:
```bash
# Export database
supabase db dump -f backup.sql

# Store in secure location
```

---

## Monitoring

### 1. Supabase Monitoring

**Dashboard**: Supabase → **Reports**

Monitor:
- Database size
- API requests
- Storage usage
- Edge Function invocations

**Alerts**:
- Set up email alerts for resource limits
- Pro tier: Slack/Discord webhooks

### 2. Vercel Analytics

**Enable**:
1. Vercel Dashboard → **Analytics** → **Enable**
2. Free tier: Basic metrics
3. Pro tier: Real User Monitoring (RUM)

**Monitor**:
- Page load times
- Error rates
- Traffic sources
- Device/browser breakdown

### 3. Application Logs

**Vercel Logs**:
```bash
# Install Vercel CLI
npm install -g vercel

# View real-time logs
vercel logs YOUR_PROJECT_URL --follow
```

**Supabase Logs**:
- Database queries: **Database** → **Logs**
- Edge Functions: **Edge Functions** → **Logs**
- Auth events: **Authentication** → **Logs**

### 4. Error Tracking (Optional)

**Integrate Sentry**:

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  environment: process.env.NODE_ENV,
});
```

---

## Troubleshooting

### Issue: "Unable to connect to Supabase"

**Check**:
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check anon key matches project
3. Ensure Supabase project is running (not paused)

**Fix**:
```bash
# Verify connection
curl https://YOUR_PROJECT.supabase.co/rest/v1/
```

### Issue: "Email verification not working"

**Check**:
1. SMTP configured correctly
2. Site URL matches production domain
3. Redirect URLs include `/auth/callback`

**Fix**:
- Supabase → **Authentication** → **URL Configuration**
- Update Site URL and Redirect URLs
- Test with a new signup

### Issue: "RLS policy blocking queries"

**Check**:
1. User is authenticated (`auth.uid()` returns value)
2. RLS policies exist for table
3. User has correct role

**Debug**:
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- View policies
SELECT * FROM pg_policies WHERE tablename = 'YOUR_TABLE';
```

### Issue: "Edge Function timeout"

**Check**:
1. CSV file size (max 10MB)
2. Function logs for errors
3. Answer key exists for phase

**Fix**:
- Increase function timeout (Supabase Dashboard)
- Optimize CSV parsing logic
- Add better error handling

### Issue: "Build fails on Vercel"

**Check**:
1. TypeScript errors: `npm run type-check`
2. Missing dependencies: `npm install`
3. Environment variables set

**Debug**:
```bash
# Test build locally
npm run build

# Check Vercel build logs
vercel logs --build
```

---

## Scaling Considerations

### When to Upgrade Supabase

**From Free to Pro** ($25/month) when:
- Database size > 500 MB
- API requests > 50k/day
- Storage > 1 GB
- Need more than 500k Edge Function invocations/month

### When to Upgrade Vercel

**From Free to Pro** ($20/month per member) when:
- Need more than 100 GB bandwidth/month
- Team collaboration features
- Advanced analytics
- Password protection for previews

### Optimization Tips

**Database**:
- Create indexes on frequently queried columns
- Use connection pooling
- Archive old competitions

**Frontend**:
- Enable Vercel Image Optimization
- Use dynamic imports for heavy components
- Implement pagination for large lists

**Caching**:
- Cache leaderboard queries (5 minutes)
- Use SWR/React Query for data fetching
- Enable Vercel Edge Caching

---

## Rollback Procedure

If deployment fails:

1. **Revert Vercel Deployment**:
   ```bash
   # List deployments
   vercel ls

   # Promote previous deployment
   vercel promote PREVIOUS_DEPLOYMENT_URL
   ```

2. **Restore Database**:
   ```bash
   # Restore from backup
   supabase db restore --backup-id BACKUP_ID
   ```

3. **Notify Users**:
   - Add status banner to site
   - Email admin users
   - Update social media

---

## Security Checklist

Before going live:

- [ ] All environment variables set correctly
- [ ] Service role key not exposed in client code
- [ ] RLS policies enabled on all tables
- [ ] Email verification required for signups
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] Rate limiting configured (Supabase auto-applies)
- [ ] CORS configured properly
- [ ] No hardcoded secrets in code
- [ ] Admin account uses strong password
- [ ] Backup strategy in place

---

## Support

If you encounter issues:

1. Check Supabase Status: https://status.supabase.com/
2. Check Vercel Status: https://vercel-status.com/
3. Search GitHub Issues
4. Contact support:
   - Supabase: support@supabase.com
   - Vercel: support@vercel.com

---

**Deployment Checklist**: ✅ Complete all steps before launching!
