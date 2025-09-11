# 🚀 CoachFlow Production Deployment Guide

## 📋 Pre-Deployment Checklist

### ⚠️ CRITICAL - Complete BEFORE Deployment

- [ ] **🛡️ Apply Security Fixes**: Run `supabase/DEPLOY_SECURITY_FIXES.sql`
- [ ] **📈 Apply Performance Optimizations**: Run `supabase/DEPLOY_PERFORMANCE_OPTIMIZATIONS.sql`  
- [ ] **🔧 Fix Turbopack Configuration**: Ensure `next.config.ts` has proper `turbopack.root`
- [ ] **🧠 Resolve Memory Leaks**: Verify health monitor cleanup functions are implemented

### 🔐 Security Requirements (MUST BE DONE)

1. **Database Security** 🚨
   - [ ] Backup database in Supabase Dashboard
   - [ ] Apply RLS security fixes from `DEPLOY_SECURITY_FIXES.sql`
   - [ ] Verify coaches cannot accept their own applications
   - [ ] Test authentication flows still work

2. **Environment Security**
   - [ ] Generate strong JWT secrets (minimum 32 characters)
   - [ ] Set up proper CORS origins
   - [ ] Configure CSP headers
   - [ ] Enable HTTPS enforcement

## 🌍 Environment Setup

### Step 1: Create Production Environment Variables

Create `.env.production` with these REQUIRED variables:

```bash
# =============================================================================
# PRODUCTION ENVIRONMENT - CoachFlow
# =============================================================================

# Environment
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Application
NEXT_PUBLIC_APP_URL=https://coachflow.com
NEXT_PUBLIC_APP_NAME=CoachFlow
NEXT_PUBLIC_APP_DESCRIPTION="Find and hire the perfect coach for your needs"

# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Security
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long_production_ready
NEXTAUTH_SECRET=your_nextauth_secret_minimum_32_characters_production_ready
NEXTAUTH_URL=https://coachflow.com

# AI (OpenAI)
OPENAI_API_KEY=your_openai_api_key_here
AI_MODEL=gpt-4o

# Email (Resend recommended)
EMAIL_PROVIDER=resend
RESEND_API_KEY=your_resend_api_key_here
EMAIL_FROM=noreply@coachflow.com

# Security Headers
FORCE_HTTPS=true
HSTS_MAX_AGE=31536000

# Performance
ENABLE_COMPRESSION=true
CACHE_MAX_AGE=31536000

# Monitoring (Critical for production)
SENTRY_DSN=your_sentry_dsn_here
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
SENTRY_ORG=origvmi-2c
SENTRY_PROJECT=javascript-nextjs
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# Feature Flags
FEATURE_AI_CHAT=true
FEATURE_MESSAGING=true
FEATURE_VIDEO_CALLS=false
FEATURE_PAYMENTS=false
```

### Step 2: Vercel Deployment Configuration

#### 2.1 Install Vercel CLI
```bash
npm i -g vercel
vercel login
```

#### 2.2 Link Project
```bash
cd /path/to/coachflow
vercel link
```

#### 2.3 Set Environment Variables
```bash
# Copy from .env.production - DO NOT commit secrets!
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add JWT_SECRET
vercel env add NEXTAUTH_SECRET
vercel env add OPENAI_API_KEY
vercel env add RESEND_API_KEY
vercel env add SENTRY_DSN
# ... add all production variables
```

#### 2.4 Configure Domain
```bash
vercel domains add coachflow.com
vercel domains add www.coachflow.com
```

### Step 3: Database Preparation

#### 3.1 Apply Security Fixes (CRITICAL)
1. Open [Supabase SQL Editor](https://supabase.com/dashboard)
2. Run `supabase/DEPLOY_SECURITY_FIXES.sql`
3. Verify no errors occur
4. Test that security policies work

#### 3.2 Apply Performance Optimizations
1. Run `supabase/DEPLOY_PERFORMANCE_OPTIMIZATIONS.sql`
2. Monitor for completion (may take 5-10 minutes)
3. Verify indexes are created successfully

#### 3.3 Production Configuration
```sql
-- Set connection limits for production
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
SELECT pg_reload_conf();
```

## 🚀 Deployment Process

### Step 1: Test Production Build
```bash
# Test build locally first
npm run build:prod
npm run start:prod
```

### Step 2: Deploy to Vercel
```bash
# Deploy to production
vercel --prod

# Or set up automatic deployment from main branch
# (Recommended for production)
```

### Step 3: Verify Deployment

#### 3.1 Health Checks
- [ ] Visit https://coachflow.com/api/health
- [ ] Should return system health status
- [ ] Check all services are "healthy"

#### 3.2 Authentication Testing
- [ ] Test coach signup flow
- [ ] Test org signup flow  
- [ ] Verify email verification works
- [ ] Test password reset functionality

#### 3.3 Security Validation
- [ ] Test that unauthenticated users cannot view profiles
- [ ] Verify coaches cannot accept their own applications
- [ ] Confirm orgs can accept/reject applications
- [ ] Test admin access (if applicable)

#### 3.4 Performance Testing
```bash
# Test key endpoints
curl -w "%{time_total}" https://coachflow.com/api/health
curl -w "%{time_total}" https://coachflow.com/

# Should be:
# Health endpoint: <100ms
# Homepage: <2s
# API calls: <500ms
```

## 📊 Production Monitoring Setup

### Step 1: Error Monitoring (Sentry)
1. Create Sentry project
2. Configure DSN in environment variables
3. Test error reporting works

### Step 2: Analytics (Google Analytics)
1. Set up GA4 property
2. Configure tracking ID
3. Verify events are being tracked

### Step 3: Uptime Monitoring
Set up monitoring for:
- [ ] `https://coachflow.com/api/health` (every 1 minute)
- [ ] `https://coachflow.com/` (every 5 minutes)
- [ ] Database connectivity (via health endpoint)

### Step 4: Performance Monitoring
Monitor:
- [ ] API response times
- [ ] Database query performance
- [ ] Memory usage patterns
- [ ] Error rates

## 🔧 Post-Deployment Tasks

### Immediate (Day 1)
- [ ] Verify all critical user flows work
- [ ] Monitor error rates and fix any issues
- [ ] Set up SSL certificate (auto with Vercel)
- [ ] Configure custom domain DNS

### Week 1
- [ ] Monitor performance metrics
- [ ] Optimize slow queries identified in monitoring
- [ ] Set up automated backups
- [ ] Create incident response procedures

### Month 1
- [ ] Security audit and penetration testing
- [ ] Performance optimization based on real usage
- [ ] User feedback collection and analysis
- [ ] Scaling plan based on usage patterns

## 🚨 Rollback Plan

If issues occur, rollback procedure:

1. **Immediate Rollback**
   ```bash
   # Rollback to previous deployment
   vercel rollback
   ```

2. **Database Rollback** (if needed)
   - Restore from Supabase backup
   - Re-apply security fixes after restoration

3. **DNS Rollback** (if needed)
   - Point domain back to maintenance page
   - Investigate and fix issues
   - Redeploy when ready

## 📈 Success Metrics

### Technical KPIs
- [ ] **Uptime**: >99.9%
- [ ] **Response Time**: API <500ms, Pages <2s
- [ ] **Error Rate**: <0.1%
- [ ] **Memory Usage**: <500MB average

### Security KPIs
- [ ] **Zero** critical vulnerabilities
- [ ] **Zero** data breaches
- [ ] **100%** authentication required for sensitive data
- [ ] **Audit logs** functioning properly

## 🛠️ Development vs Production Differences

| Aspect | Development | Production |
|--------|-------------|------------|
| Database | Local/Dev instance | Production Supabase |
| SSL | HTTP allowed | HTTPS only |
| Caching | Disabled | Enabled |
| Monitoring | Basic logs | Full monitoring stack |
| Security | Relaxed CORS | Strict security headers |
| Performance | Debug mode | Optimized build |

---

## ⚠️ CRITICAL WARNINGS

1. **🔒 NEVER commit production secrets** to version control
2. **🛡️ ALWAYS apply security fixes** before going live
3. **📊 ALWAYS monitor** production metrics after deployment
4. **💾 ALWAYS backup** database before major changes
5. **🧪 ALWAYS test** in staging environment first

---

**✅ Ready for Production?** Only deploy if ALL checklist items are complete!