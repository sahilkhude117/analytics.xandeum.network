# Deployment Guide

Complete step-by-step guide to deploy the Xandeum pNodes Analytics Platform.

## Prerequisites

Install the following before starting:

1. **Bun** (recommended) or Node.js 20+
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Supabase CLI**
   ```bash
   npm install -g supabase
   ```

3. **Accounts Required:**
   - [Supabase](https://supabase.com) - Database and Edge Functions
   - [Upstash](https://upstash.com) - Redis caching
   - [IP Geolocation API](https://ipgeolocation.io) (optional) - For geo-enrichment

---

## Step 1: Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd analytics.xandeum.network

# Install dependencies
bun install

# Copy environment template
cp .env.example .env
```

---

## Step 2: Environment Variables

Edit `.env` with your credentials:

### Supabase (Required)
```env
# Get from: Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."

# Get from: Supabase Dashboard → Settings → Database → Connection String
DATABASE_URL="postgres://postgres.xxxxx:[PASSWORD]@xxxxx.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxxxx:[PASSWORD]@xxxxx.supabase.com:5432/postgres"
```

### Upstash Redis (Required)
```env
# Get from: Upstash Dashboard → Database → REST API
UPSTASH_REDIS_REST_URL="https://xxxxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AXXXxxxx..."
```

### Bootstrap Nodes (Required)
```env
# Primary pNode for network discovery
PRPC_BOOTSTRAP_URL="http://173.212.207.32:6000/rpc"

# Fallback nodes (comma-separated)
PRPC_FALLBACK_URLS="http://152.53.155.15:6000/rpc,http://77.53.105.8:6000/rpc"

# RPC configuration
PRPC_TIMEOUT_MS="10000"
PRPC_MAX_RETRIES="3"
```

### Optional
```env
IP_API_KEY="your_key_here"  # For geo-enrichment
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

---

## Step 3: Database Setup

### 3.1 Create Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose organization, name, region, and password
4. Wait for provisioning (~2 minutes)

### 3.2 Get Database Connection Strings
1. Go to **Settings → Database**
2. Copy **Connection Pooling** string (for `DATABASE_URL`)
3. Copy **Direct Connection** string (for `DIRECT_URL`)
4. Replace `[YOUR-PASSWORD]` with your actual password

### 3.3 Run Migrations
```bash
# Deploy database schema
bunx prisma migrate deploy

# Generate Prisma client
bunx prisma generate

# Verify tables created (opens in browser)
bunx prisma studio
```

You should see 4 tables: `pnodes`, `pnode_stats`, `network`, `network_stats`

---

## Step 4: Deploy Edge Functions

### 4.1 Login to Supabase
```bash
bunx supabase login
```

### 4.2 Link Your Project
```bash
# Get project ref from: Supabase Dashboard → Settings → General → Reference ID
bunx supabase link --project-ref your-project-ref
```

### 4.3 Deploy Functions
```bash
# Deploy both edge functions
bunx supabase functions deploy collect-pnode-stats
bunx supabase functions deploy collect-detailed-stats
```

### 4.4 Set Function Secrets
```bash
# Required for edge functions to access your database
bunx supabase secrets set SUPABASE_URL=https://xxxxx.supabase.co
bunx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
bunx supabase secrets set PRPC_BOOTSTRAP_URL=http://173.212.207.32:6000/rpc
bunx supabase secrets set PRPC_FALLBACK_URLS=http://152.53.155.15:6000/rpc
bunx supabase secrets set IP_API_KEY=your_key_here
```

---

## Step 5: Setup Cron Jobs

### 5.1 Enable pg_cron Extension
1. Open **Supabase Dashboard → SQL Editor**
2. Create new query and run:
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### 5.2 Schedule Stats Collection (Every 1 Minute)
```sql
SELECT cron.schedule(
  'collect-pnode-stats-every-1min',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/collect-pnode-stats',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

**Replace:**
- `YOUR_PROJECT_REF` with your actual project reference ID
- `YOUR_SERVICE_ROLE_KEY` with your actual service role key

### 5.3 Schedule Detailed Stats (Every Hour)
```sql
SELECT cron.schedule(
  'collect-detailed-stats-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/collect-detailed-stats',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

### 5.4 Verify Cron Jobs
```sql
SELECT jobid, schedule, jobname, active FROM cron.job ORDER BY jobid;
```

You should see both jobs listed as `active = true`.

---

## Step 6: Local Development

```bash
# Start Next.js dev server
bun dev

# Access at http://localhost:3000

# Optional: Monitor database
bunx prisma studio  # Opens at http://localhost:5555
```

---

## 🌐 Step 7: Production Deployment

### Option A: Vercel (Recommended)

1. **Connect Repository:**
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository

2. **Configure Environment:**
   - Add all variables from `.env` to Vercel Environment Variables
   - **Framework Preset:** Next.js
   - **Build Command:** `bun run build`
   - **Install Command:** `bun install`

3. **Deploy:**
   - Click "Deploy"
   - Vercel auto-deploys from `main` branch on every push

### Option B: Self-Hosted

```bash
# Build production bundle
bun run build

# Start production server
bun start

# Server runs on http://localhost:3000
```

**Production Tips:**
- Use a reverse proxy (nginx/caddy)
- Enable HTTPS with Let's Encrypt
- Set `NODE_ENV=production`
- Configure firewall to allow port 3000

---

## ✅ Step 8: Verification

### 8.1 Check Edge Functions
1. Go to **Supabase Dashboard → Edge Functions**
2. Both functions should show "Deployed"
3. Click "Logs" to see execution history

### 8.2 Verify Cron Jobs
Wait 1-2 minutes, then check database:
```sql
-- Check if pnodes table has data
SELECT COUNT(*) FROM pnodes;

-- Check recent stats
SELECT * FROM pnode_stats ORDER BY timestamp DESC LIMIT 10;

-- Check network snapshot
SELECT * FROM network WHERE id = 'singleton';
```

### 8.3 Test API Endpoints
```bash
# Test network endpoint
curl http://localhost:3000/api/v1/network

# Test nodes list
curl http://localhost:3000/api/v1/pnodes?page=1&pageSize=5
```

### 8.4 Check Dashboard
1. Visit `http://localhost:3000`
2. Verify KPI cards show data
3. Check network map has markers
4. Browse to `/pods` and verify node list

---

## 🔧 Troubleshooting

### Database Connection Errors
```bash
# Test Prisma connection
bunx prisma db pull

# Regenerate client if needed
rm -rf node_modules/.prisma
bunx prisma generate
```

### Edge Functions Not Running
- Check **Supabase Dashboard → Edge Functions → Logs**
- Verify secrets are set: `bunx supabase secrets list`
- Test manually: Click "Invoke" in Supabase dashboard

### Cron Jobs Not Executing
- Ensure `pg_cron` extension is enabled
- Check URLs match your project
- Verify service role key is correct
- Look for errors: **Supabase Dashboard → Database → Extensions → pg_cron**

### Redis Connection Issues
- Verify Upstash credentials in `.env`
- Check region matches your app location
- Test connection in Upstash console

### No Geo-location Data
- IP API key missing or invalid
- Rate limit reached (free tier: 1000/day)
- Geo data enriches on first discovery only

### Empty Dashboard
- Wait 1-2 minutes for first cron execution
- Check edge function logs for errors
- Verify bootstrap pNode URL is accessible
- Manually trigger: `curl -X POST https://your-project.supabase.co/functions/v1/collect-pnode-stats -H "Authorization: Bearer YOUR_KEY"`

---

**Deployment complete! 🎉**

Your Xandeum pNodes Analytics Platform should now be collecting data and displaying it on the dashboard.
