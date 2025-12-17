# Phase 2: Automated Data Collection with pg_cron

**Automated data collection every 1 minute** - Edge Function collects all pNode stats 

### **Step 1: Open Supabase SQL Editor**

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

---

### **Step 2: Enable pg_cron**

Copy and paste this into SQL Editor and run:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

---

### **Step 3: Create Cron Job for Stats Collection (Every 1 Minute)**

```sql
SELECT cron.schedule(
  'collect-pnode-stats-every-1min',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://{project identifier}/functions/v1/collect-pnode-stats',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer {serviceRolekey}"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

### Step 4: Verify All Jobs Are Scheduled**

```sql
SELECT 
  jobid,
  schedule,
  jobname,
  active,
  database
FROM cron.job
ORDER BY jobid;
```
