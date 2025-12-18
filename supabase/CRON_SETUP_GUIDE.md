# Cron Jobs Setup Guide: Automated Data Collection with pg_cron

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

### **Step 3: Create Cron Job for Stats Collection (get-pods-with-stats) (Every 1 Minute)**

```sql
SELECT cron.schedule(
  'collect-pnode-stats-every-1min',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/collect-pnode-stats',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer {serviceRolekey}"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

---
### **Step 3: Create Cron Job for Detailed Stats Collection (get-stats) (Every Hour)**

```sql
SELECT cron.schedule(
  'collect-detailed-stats-hourly',
  '0 * * * *', -- Every hour at :00
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/collect-detailed-stats',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

---

### **Step 4: Verify All Jobs Are Scheduled**

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