# Deployment Guide 🚀

This guide covers deploying Saathi Voice backend to production.

---

## Pre-Deployment Checklist

- [ ] All API keys acquired and tested
- [ ] Database schema tested locally
- [ ] Voice IDs configured for all roles
- [ ] Environment variables documented
- [ ] CORS origins configured for production domains
- [ ] Rate limiting configured (if needed)
- [ ] SSL certificates ready
- [ ] Monitoring/logging solution chosen
- [ ] Backup strategy defined

---

## Option 1: Railway (Easiest)

**Best for**: Quick deployment, automatic scaling, managed PostgreSQL

### Steps

1. **Prepare your code**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

2. **Create Railway account**
- Go to [railway.app](https://railway.app)
- Sign up with GitHub

3. **Create new project**
- Click "New Project"
- Select "Deploy from GitHub repo"
- Choose your repo
- Railway auto-detects Node.js

4. **Add PostgreSQL**
- In your project, click "New"
- Select "Database" → "PostgreSQL"
- Railway provisions a database

5. **Set environment variables**

Go to your service → Variables → Raw Editor:

```env
# Railway provides DATABASE_URL automatically
# Add these manually:
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx
ELEVENLABS_API_KEY=xxxxx
VOICE_ID_DAUGHTER=xxxxx
VOICE_ID_SON=xxxxx
VOICE_ID_MOTHER=xxxxx
VOICE_ID_FATHER=xxxxx
VOICE_ID_HUSBAND=xxxxx
VOICE_ID_WIFE=xxxxx
VOICE_ID_FRIEND=xxxxx
VOICE_ID_GRANDFATHER=xxxxx
VOICE_ID_GRANDMOTHER=xxxxx
NODE_ENV=production
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

6. **Update database connection** (if using Railway's DATABASE_URL)

Edit `config/database.js`:
```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
```

7. **Run database migrations**

Railway CLI method:
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Run schema
railway run psql $DATABASE_URL -f database/schema.sql
```

8. **Deploy**
- Railway auto-deploys on git push
- Monitor logs in Railway dashboard

**Cost**: ~$5-20/month depending on usage

---

## Option 2: Render (Free Tier Available)

**Best for**: Free tier, simple deployment, managed PostgreSQL

### Steps

1. **Create Render account**
- Go to [render.com](https://render.com)
- Sign up with GitHub

2. **Create PostgreSQL database**
- Dashboard → New → PostgreSQL
- Choose Free tier ($0/month) or Starter ($7/month)
- Note the connection details

3. **Create Web Service**
- Dashboard → New → Web Service
- Connect your GitHub repo
- Settings:
  - **Name**: saathi-voice-api
  - **Environment**: Node
  - **Build Command**: `npm install`
  - **Start Command**: `npm start`
  - **Plan**: Free ($0) or Starter ($7)

4. **Add environment variables**
```env
DATABASE_URL=<from-render-postgres>
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx
ELEVENLABS_API_KEY=xxxxx
VOICE_ID_DAUGHTER=xxxxx
# ... all other voice IDs
NODE_ENV=production
ALLOWED_ORIGINS=https://your-frontend.com
```

5. **Run database schema**
```bash
# Using Render Shell
# In your web service dashboard, go to "Shell" tab
# Or use psql locally
psql $DATABASE_URL -f database/schema.sql
```

6. **Deploy**
- Render auto-deploys on git push to main branch

**Free Tier Limitations**:
- Spins down after 15 min inactivity
- First request after spin-down is slow (~30s)
- 512MB RAM

**Upgrade to Starter ($7/month)** for always-on service.

---

## Option 3: AWS EC2 + RDS (Full Control)

**Best for**: Production apps, high traffic, full customization

### Architecture
```
User → Route 53 (DNS) → ALB (Load Balancer) → EC2 (Node.js) → RDS (PostgreSQL)
                              ↓
                         CloudWatch (Monitoring)
```

### Steps

**1. Create RDS PostgreSQL Database**

```bash
# Via AWS Console:
# Services → RDS → Create Database
# - Engine: PostgreSQL 14
# - Template: Free tier (for testing) or Production
# - DB instance: db.t3.micro (1GB RAM)
# - Storage: 20GB SSD
# - VPC: Default
# - Public access: No (for security)
# - Initial database name: saathi_voice

# Note the endpoint URL and credentials
```

**2. Launch EC2 Instance**

```bash
# Via AWS Console:
# Services → EC2 → Launch Instance
# - AMI: Ubuntu Server 22.04 LTS
# - Instance type: t3.small (2GB RAM) or larger
# - Key pair: Create new or use existing
# - Security group:
#   - SSH (22) from your IP
#   - HTTP (80) from anywhere
#   - HTTPS (443) from anywhere
#   - Custom TCP (3000) from anywhere (for testing)
```

**3. Connect and Setup Server**

```bash
# SSH into instance
ssh -i your-key.pem ubuntu@<ec2-public-ip>

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL client (for running migrations)
sudo apt install -y postgresql-client

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx (reverse proxy)
sudo apt install -y nginx

# Install certbot (SSL certificates)
sudo apt install -y certbot python3-certbot-nginx
```

**4. Deploy Application**

```bash
# Clone your repo
git clone <your-repo-url>
cd saathi-voice-backend

# Install dependencies
npm install --production

# Create .env file
nano .env
```

Paste your environment variables:
```env
PORT=3000
NODE_ENV=production

# Database (RDS endpoint)
DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_PORT=5432
DB_NAME=saathi_voice
DB_USER=postgres
DB_PASSWORD=your-rds-password

# API Keys
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx
ELEVENLABS_API_KEY=xxxxx
# ... all voice IDs

ALLOWED_ORIGINS=https://yourdomain.com
```

**5. Run Database Migrations**

```bash
# From EC2 instance
PGPASSWORD=your-password psql -h your-rds-endpoint.rds.amazonaws.com -U postgres -d saathi_voice -f database/schema.sql
```

**6. Start Application with PM2**

```bash
# Start app
pm2 start server.js --name saathi-voice

# Configure auto-restart on system reboot
pm2 startup
# Copy and run the command PM2 outputs

# Save PM2 process list
pm2 save

# Monitor logs
pm2 logs saathi-voice
```

**7. Configure Nginx Reverse Proxy**

```bash
sudo nano /etc/nginx/sites-available/saathi-voice
```

Paste this config:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeouts for voice processing
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/saathi-voice /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**8. Setup SSL with Let's Encrypt**

```bash
sudo certbot --nginx -d api.yourdomain.com
# Follow prompts to get free SSL certificate
```

**9. Configure CloudWatch Monitoring** (Optional)

Install CloudWatch agent:
```bash
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb
```

**Cost Estimate**:
- EC2 t3.small: ~$15/month
- RDS db.t3.micro: ~$15/month
- Data transfer: ~$5-10/month
- **Total**: ~$35-40/month

---

## Option 4: DigitalOcean App Platform

**Best for**: Balance of simplicity and control

### Steps

1. **Create DigitalOcean account**

2. **Create Managed PostgreSQL Database**
- Create → Databases → PostgreSQL
- Plan: Basic ($15/month)
- Note connection details

3. **Create App**
- Create → Apps → GitHub
- Select repository
- Detect Node.js automatically

4. **Configure**
- Build Command: `npm install`
- Run Command: `npm start`
- Environment Variables: (same as above)
- Resource Size: Basic ($5/month)

5. **Run migrations**
```bash
# Use doctl CLI or connection string
psql $DATABASE_URL -f database/schema.sql
```

**Cost**: ~$20/month (App $5 + Database $15)

---

## Post-Deployment

### 1. Test All Endpoints

```bash
# Health check
curl https://api.yourdomain.com/api/health

# Get roles
curl https://api.yourdomain.com/api/roles

# Create test user
curl -X POST https://api.yourdomain.com/api/users \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","name":"Test User"}'
```

### 2. Monitor Logs

**Railway/Render**: Built-in dashboard

**AWS**: CloudWatch Logs
```bash
# On EC2
pm2 logs saathi-voice --lines 100
```

### 3. Set Up Alerts

**Critical alerts**:
- Server down
- High error rate
- Database connection issues
- Crisis alerts (high severity)

**CloudWatch Example**:
- Metric: HTTPCode_Target_5XX_Count
- Threshold: > 10 in 5 minutes
- Action: SNS → Email

### 4. Backup Database

**Automated backups** (recommended):

Railway/Render: Automatic daily backups included

AWS RDS:
```bash
# Enable automated backups in RDS settings
# Retention period: 7 days minimum
```

Manual backup:
```bash
# From local machine
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### 5. Security Hardening

- [ ] Enable HTTPS only
- [ ] Implement rate limiting
- [ ] Add API authentication (JWT)
- [ ] Regular dependency updates
- [ ] Rotate API keys quarterly
- [ ] Enable database encryption at rest
- [ ] Configure firewall rules (AWS Security Groups)
- [ ] Set up Web Application Firewall (WAF)

---

## Scaling Strategies

### Vertical Scaling
- Upgrade server size (more CPU/RAM)
- Railway/Render: Change plan in dashboard
- AWS: Change EC2 instance type

### Horizontal Scaling
- Add more server instances
- Use load balancer to distribute traffic
- AWS: Auto Scaling Group + Application Load Balancer

### Database Scaling
- Read replicas for analytics queries
- Connection pooling (already implemented via pg Pool)
- RDS: Add read replicas in AWS console

---

## Troubleshooting Production Issues

### Issue: 504 Gateway Timeout

**Cause**: Voice processing takes too long

**Solution**:
```nginx
# In Nginx config, increase timeouts
proxy_connect_timeout 600s;
proxy_send_timeout 600s;
proxy_read_timeout 600s;
```

### Issue: Out of Memory

**Cause**: Too many concurrent requests

**Solution**:
- Upgrade server RAM
- Implement request queuing
- Add rate limiting

### Issue: Database Connection Pool Exhausted

**Cause**: Too many connections

**Solution** (in `config/database.js`):
```javascript
const pool = new Pool({
  max: 50, // Increase pool size
  idleTimeoutMillis: 30000,
});
```

### Issue: High API Costs

**Cause**: Too many API calls to Claude/Whisper/ElevenLabs

**Solution**:
- Implement caching for common responses
- Rate limit users
- Use cheaper models for simple queries
- Consider self-hosted Whisper

---

## Cost Optimization

### Strategy 1: Use Free Tiers
- Render Free (with limitations)
- Vercel for frontend
- Supabase for database (free PostgreSQL)

### Strategy 2: Reserved Instances (AWS)
- 1-year commitment: ~30% savings
- 3-year commitment: ~50% savings

### Strategy 3: Spot Instances (AWS)
- Up to 90% cheaper than on-demand
- Good for non-critical workloads
- Not recommended for production API

### Strategy 4: Optimize API Usage
- Cache TTS audio for common phrases
- Batch requests when possible
- Use Claude Haiku for simple queries (cheaper)

---

## Monitoring Dashboard Setup

### Recommended Tools

1. **Free Options**
   - PM2 Plus (free tier)
   - Grafana Cloud (free tier)
   - UptimeRobot (uptime monitoring)

2. **Paid Options**
   - DataDog ($15/month)
   - New Relic ($25/month)
   - AWS CloudWatch

### Key Metrics to Track

```javascript
// In server.js, add metrics middleware
const responseTime = require('response-time');
const prometheus = require('prom-client');

// Prometheus metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

app.use(responseTime((req, res, time) => {
  httpRequestDuration
    .labels(req.method, req.route?.path || req.path, res.statusCode)
    .observe(time / 1000);
}));
```

---

## Rollback Plan

If deployment fails:

1. **Quick rollback** (Railway/Render)
   - Dashboard → Deployments → Revert to previous

2. **Manual rollback** (AWS)
```bash
# SSH into EC2
cd saathi-voice-backend
git log --oneline
git checkout <previous-commit-hash>
pm2 restart saathi-voice
```

3. **Database rollback**
```bash
# Restore from backup
psql $DATABASE_URL < backup-20250523.sql
```

---

## Final Checklist

Before going live:

- [ ] All API endpoints tested in production
- [ ] SSL certificate installed and working
- [ ] Database backups scheduled
- [ ] Monitoring and alerts configured
- [ ] Error logging working
- [ ] Rate limiting enabled
- [ ] CORS configured correctly
- [ ] Crisis helpline numbers verified for target country
- [ ] Terms of Service and Privacy Policy live
- [ ] User testing completed
- [ ] Load testing done
- [ ] Rollback plan documented
- [ ] Team knows how to check logs and restart services

---

**You're ready to deploy! 🚀**
