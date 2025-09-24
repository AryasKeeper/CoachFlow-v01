# CoachFlow Deployment Guide for Vercel

## Pre-Deployment Checklist

### 1. Environment Variables (Required for Vercel)

Add these environment variables in your Vercel project settings:

#### Essential Variables:
```env
# Application
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
NODE_ENV=production

# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Authentication
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=generate_a_32_char_secret

# AI Chat (Optional but recommended)
OPENAI_API_KEY=your_openai_key
AI_MODEL=gpt-4o

# Error Tracking (Optional but recommended)
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

### 2. Supabase Configuration

1. **Update Authentication Providers:**
   - Go to Supabase Dashboard > Authentication > URL Configuration
   - Add your Vercel URL to:
     - Site URL: `https://your-app-name.vercel.app`
     - Redirect URLs: 
       - `https://your-app-name.vercel.app/auth/callback`
       - `https://your-app-name.vercel.app/auth/sign-in`
       - `https://your-app-name.vercel.app/auth/sign-up`

2. **Enable Row Level Security (RLS):**
   - Ensure all tables have RLS enabled
   - Verify policies are working correctly

3. **Storage Buckets:**
   - Create `avatars` bucket if not exists
   - Set public access for avatars bucket

### 3. Pre-Deployment Code Changes

#### Update next.config.ts for production:
```typescript
const nextConfig = {
  images: {
    domains: [
      'localhost',
      'your-supabase-project.supabase.co',
      'lh3.googleusercontent.com', // for Google avatars
      'avatars.githubusercontent.com', // for GitHub avatars
    ],
  },
}
```

### 4. Test User Accounts for Family

Create these test accounts in Supabase Auth:
1. **Test Coach Account**
   - Email: `testcoach@example.com`
   - Password: `TestCoach123!`
   - Profile: Complete with sample data

2. **Test Organization Account**
   - Email: `testorg@example.com`
   - Password: `TestOrg123!`
   - Profile: Sample school/club

3. **Test Admin Account** (optional)
   - Email: `testadmin@example.com`
   - Password: `TestAdmin123!`

### 5. Family Testing Guide

Create a simple guide for your family testers:

```markdown
# Welcome to CoachFlow Testing!

## Getting Started
1. Visit: https://your-app-name.vercel.app
2. Use one of these test accounts:
   - Coach: testcoach@example.com / TestCoach123!
   - Organization: testorg@example.com / TestOrg123!

## What to Test
- [ ] Sign up as a new coach
- [ ] Complete coach profile
- [ ] Upload verification documents
- [ ] Browse job listings
- [ ] Apply for a coaching position
- [ ] Sign up as an organization
- [ ] Post a job listing
- [ ] Review coach applications
- [ ] Test messaging between users

## Please Note
- Some features may be slow on first load
- Report any errors or confusing parts
- Test on both mobile and desktop
```

### 6. Deployment Steps

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Deploy to Vercel:**
   - Import project from GitHub
   - Add all environment variables
   - Deploy

3. **Post-Deployment:**
   - Test authentication flow
   - Verify database connections
   - Check image uploads
   - Test critical user journeys

### 7. Monitoring Setup

1. **Vercel Analytics** (automatic)
2. **Sentry Error Tracking:**
   - Create new project at sentry.io
   - Add DSN to environment variables
3. **Uptime Monitoring:**
   - Use Vercel's built-in monitoring
   - Or add external service like UptimeRobot

### 8. Known Issues to Address

- [ ] Rate limiting not configured for production
- [ ] Email service not set up (using Supabase Auth emails)
- [ ] Payment processing not implemented
- [ ] Some loading states need optimization

### 9. Emergency Rollback

If something goes wrong:
1. Vercel Dashboard > Deployments
2. Find last working deployment
3. Click "..." menu > "Promote to Production"

## Security Checklist

- [x] Environment variables set in Vercel (not in code)
- [x] Supabase RLS policies active
- [x] API routes have authentication checks
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Security headers in vercel.json

## Performance Considerations

- Images are optimized with Next.js Image component
- Database queries use proper indexes
- Static pages are pre-rendered where possible
- API routes are edge-optimized

---

**Support:** If family members encounter issues, they can:
1. Take a screenshot
2. Note what they were trying to do
3. Send feedback via messaging in the app or email
