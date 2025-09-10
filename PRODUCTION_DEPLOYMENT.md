# CoachFlow Production Deployment Guide

## 📋 Prerequisites

### System Requirements
- Node.js 20+ (LTS recommended)
- Docker 24+ and Docker Compose
- PostgreSQL 15+ (Supabase recommended)
- Redis 7+ (for caching and sessions)
- SSL Certificate (Let's Encrypt recommended)

### Required Services
- **Database**: Supabase or self-hosted PostgreSQL
- **Email**: Resend, SendGrid, or SMTP
- **AI**: OpenAI API
- **Monitoring**: Sentry (recommended)
- **Analytics**: Google Analytics, Mixpanel (optional)
- **CDN**: Cloudflare or AWS CloudFront (optional)

## 🚀 Quick Deployment with Docker

### 1. Environment Configuration
```bash
# Copy production configuration
cp production.config.sample .env.production

# Edit with your production values
nano .env.production
```

### 2. Build and Deploy
```bash
# Build production image
npm run docker:build

# Start production services
npm run docker:compose

# Check health
curl -f http://localhost:3000/api/health
```

### 3. Verify Deployment
```bash
# Check container status
docker ps

# View logs
docker-compose logs coachflow

# Run health check
npm run health:check
```

## 🔧 Manual Deployment

### 1. Environment Setup
```bash
# Install dependencies
npm ci --production

# Set environment variables
export NODE_ENV=production
export NEXT_PUBLIC_APP_URL=https://your-domain.com
# ... (copy all variables from production.config.sample)
```

### 2. Build Application
```bash
# Type check
npm run type-check

# Lint
npm run lint

# Run tests
npm run test:ci

# Build for production
npm run build:prod
```

### 3. Start Production Server
```bash
# Start with PM2 (recommended)
pm2 start npm --name "coachflow" -- run start:prod

# Or start directly
npm run start:prod
```

## 🛠️ Infrastructure Configuration

### Nginx Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name coachflow.com;
    
    ssl_certificate /etc/letsencrypt/live/coachflow.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/coachflow.com/privkey.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Static assets with long cache
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name coachflow.com www.coachflow.com;
    return 301 https://coachflow.com$request_uri;
}
```

### Systemd Service (Alternative to PM2)
```ini
[Unit]
Description=CoachFlow Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/coachflow
ExecStart=/usr/bin/npm run start:prod
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
EnvironmentFile=/var/www/coachflow/.env.production

[Install]
WantedBy=multi-user.target
```

## 🔐 Security Configuration

### SSL Certificate Setup (Let's Encrypt)
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d coachflow.com -d www.coachflow.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Firewall Configuration
```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Application specific
sudo ufw allow 3000  # If not using reverse proxy
sudo ufw allow 6379  # Redis (localhost only)
```

### Environment Security
```bash
# Set secure permissions
chmod 600 .env.production
chown www-data:www-data .env.production

# Secure log files
mkdir -p logs
chmod 755 logs
chown www-data:www-data logs
```

## 📊 Monitoring & Logging

### Application Monitoring
```javascript
// Sentry configuration (already integrated)
// Monitor errors, performance, and user sessions

// Health check endpoint
// GET /api/health returns application status
```

### Log Management
```bash
# Application logs
tail -f logs/app.log

# Access logs
tail -f /var/log/nginx/access.log

# Error logs
tail -f /var/log/nginx/error.log

# System logs
journalctl -u coachflow -f
```

### Performance Monitoring
- **Sentry**: Error tracking and performance monitoring
- **Google Analytics**: User behavior and page views
- **New Relic**: Application performance monitoring (optional)
- **Prometheus + Grafana**: Infrastructure monitoring (optional)

## 💾 Database Management

### Backup Strategy
```bash
# Daily automated backup
0 2 * * * /usr/local/bin/backup-database.sh

# Manual backup
pg_dump $DATABASE_URL > backups/coachflow-$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backups/coachflow-20240101.sql
```

### Migration Management
```bash
# Run database migrations
npm run db:migrate

# Seed production data
npm run db:seed

# Check database status
npm run db:status
```

## 🚦 Health Checks & Monitoring

### Built-in Health Check
```bash
# HTTP health check
curl -f http://localhost:3000/api/health

# Returns:
{
  "overall": "healthy",
  "database": "connected",
  "redis": "connected",
  "ai_service": "available",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### External Monitoring
- **Uptime monitoring**: Pingdom, UptimeRobot
- **Performance monitoring**: New Relic, DataDog
- **Log aggregation**: Loggly, Papertrail

## 🔄 Deployment Automation

### GitHub Actions (CI/CD)
```yaml
name: Production Deployment

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:ci
      
      - name: Build application
        run: npm run build:prod
      
      - name: Deploy to server
        run: |
          # Add your deployment script here
          echo "Deploy to production server"
```

### Blue-Green Deployment
```bash
# Build new version
docker build -t coachflow:blue .

# Test new version
docker run -d --name coachflow-blue -p 3001:3000 coachflow:blue

# Health check new version
curl -f http://localhost:3001/api/health

# Switch traffic (update load balancer)
# Stop old version
docker stop coachflow-green
docker rm coachflow-green

# Promote blue to green
docker tag coachflow:blue coachflow:green
```

## 🎯 Performance Optimization

### Caching Strategy
- **Static Assets**: CDN + Long cache headers
- **API Responses**: Redis caching
- **Database Queries**: Query optimization + connection pooling
- **Image Optimization**: Next.js Image optimization + WebP/AVIF

### Load Balancing
```yaml
# docker-compose.yml (multiple instances)
version: '3.8'
services:
  coachflow-1:
    build: .
    ports:
      - "3001:3000"
  
  coachflow-2:
    build: .
    ports:
      - "3002:3000"
  
  nginx:
    image: nginx
    depends_on:
      - coachflow-1
      - coachflow-2
```

## 🔍 Troubleshooting

### Common Issues
1. **Port already in use**: `sudo lsof -i :3000`
2. **Permission denied**: Check file permissions and user ownership
3. **Database connection**: Verify connection strings and network access
4. **Memory issues**: Monitor with `htop`, consider increasing limits

### Debug Commands
```bash
# Check application status
docker-compose ps

# View real-time logs
docker-compose logs -f coachflow

# Inspect container
docker exec -it coachflow-container /bin/sh

# Database connection test
npm run db:test

# Performance analysis
npm run build:analyze
```

### Rollback Procedure
```bash
# Stop current version
docker-compose down

# Revert to previous image
docker tag coachflow:previous coachflow:latest

# Restart services
docker-compose up -d

# Verify rollback
curl -f http://localhost:3000/api/health
```

## 📋 Production Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] SSL certificate installed
- [ ] Database migrations run
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance testing done
- [ ] Backup strategy implemented

### Post-Deployment
- [ ] Health check passing
- [ ] Monitoring alerts configured
- [ ] Error tracking active
- [ ] Performance metrics baseline established
- [ ] Documentation updated
- [ ] Team notified

### Ongoing Maintenance
- [ ] Regular security updates
- [ ] Database optimization
- [ ] Log rotation configured
- [ ] Backup verification
- [ ] Performance monitoring
- [ ] User feedback monitoring

## 📞 Support & Maintenance

### Regular Tasks
- **Daily**: Monitor logs, check health metrics
- **Weekly**: Review performance metrics, security updates
- **Monthly**: Database maintenance, backup verification
- **Quarterly**: Security audit, dependency updates

### Emergency Contacts
- **DevOps Team**: [contact-info]
- **Database Admin**: [contact-info]
- **Security Team**: [contact-info]

### Escalation Procedures
1. **Level 1**: Application restart, basic troubleshooting
2. **Level 2**: Infrastructure investigation, rollback if needed
3. **Level 3**: Emergency response, full system recovery

---

**Note**: This guide assumes a standard production deployment. Adjust configurations based on your specific infrastructure and requirements.