# 🚀 Vercel Deployment Checklist

## Pre-Deployment Steps

### 1. ✅ Environment Variables
Add these in Vercel Dashboard > Settings > Environment Variables:

```env
# Core (Required)
NEXT_PUBLIC_APP_URL=https://[your-project].vercel.app
NEXT_PUBLIC_SUPABASE_URL=[your-supabase-url]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]

# Authentication (Required)
NEXTAUTH_URL=https://[your-project].vercel.app
NEXTAUTH_SECRET=[generate-32-char-secret]

# Optional but Recommended
OPENAI_API_KEY=[your-openai-key]
SENTRY_DSN=[your-sentry-dsn]
NEXT_PUBLIC_SENTRY_DSN=[your-sentry-dsn]
```

### 2. ✅ Supabase Setup
- [ ] Update Redirect URLs in Supabase Dashboard
- [ ] Enable RLS on all tables
- [ ] Create storage buckets (avatars)
- [ ] Run any pending migrations

### 3. ✅ Code Preparation
- [x] Image domains configured in next.config.ts
- [x] Security headers in vercel.json
- [x] SEO metadata updated
- [x] Error boundaries added
- [x] Loading states implemented

### 4. ✅ Git Repository
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

## Deployment Steps

### 1. Import to Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Select "Next.js" as framework preset
4. Add environment variables
5. Deploy!

### 2. Configure Domain (Optional)
1. Go to Settings > Domains
2. Add custom domain
3. Configure DNS records

### 3. Post-Deployment Testing

#### Critical Paths to Test:
- [ ] Sign up as new coach
- [ ] Sign up as new organization
- [ ] Complete profile setup
- [ ] Upload verification documents
- [ ] Post a job listing
- [ ] Apply for a job
- [ ] Send a message
- [ ] Sign out and sign in

#### Mobile Testing:
- [ ] Test on iPhone Safari
- [ ] Test on Android Chrome
- [ ] Check responsive design
- [ ] Test touch interactions

## Monitoring Setup

### 1. Vercel Analytics (Automatic)
- Web Vitals tracking
- Real User Monitoring

### 2. Sentry Error Tracking
- [ ] Create project at sentry.io
- [ ] Add DSN to environment variables
- [ ] Test error reporting

### 3. Uptime Monitoring
- [ ] Enable Vercel's monitoring
- [ ] Or use UptimeRobot/Pingdom

## Rollback Plan

If issues occur:
1. Vercel Dashboard > Deployments
2. Find last working deployment
3. Three dots menu > "Promote to Production"

## Production Environment Variables

Once testing is complete, update these:
```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://coachflow.com
# Update all callback URLs to production domain
```

## Family Testing Resources

- Testing Guide: `FAMILY_TESTING_GUIDE.md`
- Test Accounts:
  - Coach: testcoach@example.com / TestCoach123!
  - Org: testorg@example.com / TestOrg123!

## Support & Troubleshooting

Common Issues:
1. **Blank page** - Check browser console for errors
2. **Auth issues** - Verify Supabase redirect URLs
3. **Images not loading** - Check image domain config
4. **Slow loading** - Normal on first visit (cold start)

---

Ready to deploy? Let's go! 🎉
