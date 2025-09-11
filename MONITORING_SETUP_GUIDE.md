# 📊 CoachFlow Monitoring & Alerting Setup Guide

## 🎯 Monitoring Overview

Comprehensive production monitoring system with:
- **Error Tracking**: Sentry integration with custom alerting
- **Performance Monitoring**: Real-time metrics and bottleneck detection  
- **Health Monitoring**: System health checks and uptime tracking
- **Security Monitoring**: Authentication failures and security events
- **Business Monitoring**: User flows and critical business metrics

## 🚨 Critical Alerts Setup

### Step 1: Sentry Configuration (Error Tracking)

1. **Create Sentry Project**
   ```bash
   # Visit https://sentry.io/organizations/your-org/projects/
   # Create new project: "coachflow-production"
   ```

2. **Configure Environment Variables**
   ```bash
   SENTRY_DSN=https://your-dsn-here@sentry.io/project-id
   SENTRY_ORG=your-organization
   SENTRY_PROJECT=coachflow-production
   ```

3. **Install Sentry Dependencies**
   ```bash
   npm install @sentry/nextjs
   ```

### Step 2: Notification Channels

#### Slack Integration (Recommended)
1. Create Slack webhook: https://api.slack.com/incoming-webhooks
2. Set environment variables:
   ```bash
   ALERT_WEBHOOK_URL=https://hooks.slack.com/services/your/slack/webhook
   SECURITY_ALERT_WEBHOOK_URL=https://hooks.slack.com/services/security/channel/webhook
   ```

#### Discord Integration (Alternative)
```bash
ALERT_WEBHOOK_URL=https://discord.com/api/webhooks/your/discord/webhook
SECURITY_ALERT_WEBHOOK_URL=https://discord.com/api/webhooks/security/channel/webhook
```

### Step 3: Monitoring Dashboard Access

Create admin user account in production:
```sql
-- Run in Supabase SQL Editor
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';
```

Access monitoring dashboard: `https://coachflow.com/api/monitoring/dashboard`

## 🎛️ Alert Configuration

### Error Alert Thresholds

| Severity | Threshold | Time Window | Action |
|----------|-----------|-------------|---------|
| **Critical** | 1 error | 5 minutes | Immediate Slack + SMS |
| **High** | 10 errors | 1 hour | Slack notification |
| **Medium** | 25 errors | 1 hour | Slack notification |
| **Low** | 50 errors | 1 hour | Email digest |

### Alert Types

#### 🔥 Critical Alerts (Immediate Response)
- Security events (unauthorized access attempts)
- Database connection failures
- Memory usage >500MB
- Authentication system failures
- Payment processing errors (future)

#### ⚠️ High Priority Alerts (15-30 min response)
- Application errors affecting user flows
- Business logic violations (coach self-acceptance)
- Performance degradation >5s response times
- High error rates >5%

#### 📊 Medium Priority Alerts (1-2 hour response)
- API performance issues >2s response times
- Elevated memory usage >300MB
- Non-critical validation errors
- Third-party service issues

## 📈 Monitoring Metrics

### System Health KPIs
- **Uptime**: Target >99.9% (8.7 hours downtime/year)
- **Response Time**: API <500ms, Pages <2s
- **Error Rate**: <0.1% for critical flows
- **Memory Usage**: <500MB average, <300MB warning threshold

### Business KPIs
- **User Signup Success Rate**: >95%
- **Application Submission Success**: >98%
- **Authentication Success Rate**: >99%
- **Search Performance**: <1s average

### Performance KPIs
- **Database Query Time**: <200ms average
- **Cache Hit Rate**: >80%
- **CDN Performance**: <100ms static assets
- **Third-party API Response**: <1s average

## 🛠️ Monitoring Dashboard

### Admin Dashboard Features
- **Real-time System Health**: Service status and uptime
- **Error Analytics**: Error trends, types, and patterns
- **Performance Metrics**: Response times, throughput, bottlenecks
- **Database Metrics**: Query performance, connection counts
- **Security Events**: Authentication failures, suspicious activity
- **Business Metrics**: User flows, conversion rates

### Access URL
`https://coachflow.com/api/monitoring/dashboard?timeframe=24h`

### API Parameters
- `timeframe`: `1h` | `24h` | `7d`
- Returns JSON with all monitoring data

## 🚨 Incident Response Procedures

### Severity 1 - Critical (Immediate Response)
**Examples**: Security breach, data loss, complete system outage
1. **Immediate**: Check Slack alerts and system status
2. **Within 5 minutes**: Access monitoring dashboard
3. **Within 10 minutes**: Identify root cause
4. **Within 15 minutes**: Implement fix or rollback
5. **Within 30 minutes**: Post-incident communication

### Severity 2 - High (15-30 minutes)
**Examples**: Major feature broken, high error rates
1. **Within 15 minutes**: Assess impact and scope
2. **Within 30 minutes**: Implement fix
3. **Within 1 hour**: Monitor for resolution
4. **Within 4 hours**: Post-incident review

### Severity 3 - Medium (1-2 hours)
**Examples**: Performance degradation, minor bugs
1. **Within 2 hours**: Investigate and plan fix
2. **Within 8 hours**: Implement solution
3. **Within 24 hours**: Deploy fix

## 📱 Alert Escalation

### Level 1: Development Team
- Slack notifications for all alerts
- Dashboard monitoring
- First response within SLA

### Level 2: Technical Lead
- Escalate if Level 1 doesn't respond within 30 minutes
- SMS alerts for critical issues
- Decision authority for rollbacks

### Level 3: Emergency Response
- Escalate if issue persists >2 hours
- Emergency contacts activated
- Executive notification for business impact

## 🔍 Troubleshooting Guides

### High Memory Usage
1. Check `/api/monitoring/dashboard` for memory metrics
2. Look for memory leaks in error logs
3. Review recent deployments and code changes
4. Consider scaling if legitimate usage increase

### Database Performance Issues
1. Check slow query logs in monitoring dashboard
2. Review database metrics and connection counts
3. Check for missing indexes or inefficient queries
4. Monitor connection pool usage

### Authentication Failures
1. Check Sentry for authentication error patterns
2. Review security events in monitoring dashboard
3. Verify Supabase service status
4. Check for suspicious IP addresses

### Performance Degradation
1. Monitor API response times in dashboard
2. Check for database query bottlenecks
3. Review third-party service performance
4. Analyze error rates and patterns

## 🧪 Testing Your Monitoring

### 1. Test Error Tracking
```javascript
// Test error in browser console
throw new Error('Test monitoring error')
```

### 2. Test Performance Monitoring
```javascript
// Simulate slow operation
await new Promise(resolve => setTimeout(resolve, 6000))
```

### 3. Test Health Checks
```bash
curl https://coachflow.com/api/health
# Should return system health status
```

### 4. Test Admin Dashboard
```bash
curl -H "Authorization: Bearer admin-token" \
     https://coachflow.com/api/monitoring/dashboard
```

## 📊 Monitoring Checklist

### Pre-Production
- [ ] Sentry project configured and tested
- [ ] Slack/Discord webhooks set up and tested
- [ ] Admin users created in production database
- [ ] Error tracking middleware integrated
- [ ] Health check endpoints working
- [ ] Monitoring dashboard accessible

### Post-Deployment Day 1
- [ ] Verify all alerts are working
- [ ] Check error rates are <0.1%
- [ ] Monitor performance metrics
- [ ] Validate security event tracking
- [ ] Test incident response procedures

### Ongoing (Weekly)
- [ ] Review error trends and patterns
- [ ] Check performance metrics and optimization opportunities
- [ ] Validate alert threshold effectiveness
- [ ] Update monitoring based on usage patterns
- [ ] Review and update incident response procedures

## 📈 Monitoring Evolution

### Phase 1 (Launch)
- Basic error tracking and alerting
- System health monitoring
- Critical business flow monitoring

### Phase 2 (Growth)
- Advanced analytics and trending
- Predictive alerting based on patterns
- Custom business metrics dashboards
- Integration with business intelligence tools

### Phase 3 (Scale)
- Machine learning for anomaly detection
- Advanced performance profiling
- Automated incident response
- Full observability stack with tracing

---

## 🆘 Emergency Contacts

In case of critical system failures:

1. **Technical Lead**: [Your contact info]
2. **Product Owner**: [Your contact info]  
3. **Infrastructure Team**: [Your contact info]
4. **On-call Rotation**: [Your contact info]

---

**📞 Remember**: When in doubt, alert early and often. False positives are better than missed incidents in production!