# Complete Database Setup Guide

This guide provides step-by-step instructions for setting up a new Supabase database for StreetWiseWeb, including all scripts, storage configuration, environment variables, and CORS setup.

## Prerequisites

- Supabase account (free tier works for development)
- Access to create new Supabase projects
- Basic knowledge of SQL

## Step 1: Create New Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Name it (e.g., `streetwiseweb-dev` or `streetwiseweb-prod`)
4. Choose your region
5. Generate a strong database password (save it!)
6. Click "Create new project"
7. Wait for project to be fully initialized

## Step 2: Run Database Setup Scripts

Run these scripts **in order** using the Supabase SQL Editor:

### 2.1 Script Execution Order
1. `01_cleanup.sql` - Cleans existing schema (if any)
2. `02_core_tables.sql` - Creates main application tables
3. `03_functions.sql` - Creates utility functions and triggers
4. `04_indexes.sql` - Creates performance indexes
5. `05_materialized_views.sql` - Creates dashboard statistics views
6. `06_triggers.sql` - Creates automated triggers
7. `07_rls_policies.sql` - Sets up Row Level Security
8. `08_permissions.sql` - Grants necessary permissions
9. `09_validation.sql` - Validates all components

### 2.2 How to Run Scripts
1. In Supabase Dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Copy entire contents of first script file
4. Paste into editor and click **"Run"**
5. Verify success messages appear
6. Repeat for each script in order

### 2.3 Expected Success Messages
Each script should show messages like:
- `✅ Tables created successfully`
- `✅ Functions created successfully`
- `✅ All expected tables exist`

## Step 3: Configure Storage Buckets

Create the storage bucket for screenshot files:

### 3.1 Create Bucket
1. In Supabase Dashboard, go to **Storage**
2. Click **"Create bucket"**
3. Bucket name: `analysis-screenshots`
4. **Public bucket: Yes** (toggle on)
5. Click **"Create bucket"**

### 3.2 Set Up Storage Policies
After creating the bucket, configure RLS policies:

1. Click on the `analysis-screenshots` bucket
2. Go to **"Policies"** tab
3. Click **"New Policy"** for each policy below:

**Policy 1: Insert (Authenticated users can upload)**
```sql
CREATE POLICY "Authenticated users can upload screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'analysis-screenshots');
```

**Policy 2: Select (Public can view)**
```sql
CREATE POLICY "Public can view screenshots"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'analysis-screenshots');
```

**Policy 3: Delete (Users can delete their own)**
```sql
CREATE POLICY "Users can delete their own screenshots"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'analysis-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Step 4: Configure Authentication & CORS

### 4.1 Basic Authentication Settings
1. Go to **Authentication → Settings**
2. Configure the following:

**Email Settings:**
- Enable Email Confirmations: Your choice (can be off for dev)
- Enable Email Change Confirmations: Your choice
- Secure Email Change: Enabled

**Auth Providers:**
- Keep Email/Password enabled
- Configure social providers if needed (Google, GitHub, etc.)

### 4.2 Critical CORS Configuration
**THIS IS ESSENTIAL FOR FRONTEND AUTHENTICATION**

1. Go to **Authentication → Settings**
2. Scroll down to **"Site URL"** section
3. Set **Site URL** to: `http://localhost:3000` (for development)
4. In **"Additional Redirect URLs"** add:
   ```
   http://localhost:3000/**
   http://localhost:3002/**
   http://localhost:3005/**
   ```
5. Click **"Save"**

### 4.3 For Production
Replace localhost URLs with your production domain:
- Site URL: `https://yourdomain.com`
- Redirect URLs: `https://yourdomain.com/**`

**Note:** Without correct CORS setup, you'll get "Access-Control-Allow-Origin" errors when trying to authenticate.

## Step 5: Get API Keys and Configure Environment

### 5.1 Get Supabase API Keys
1. In Supabase Dashboard, go to **Settings → API**
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)
   - **service_role** key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)

### 5.2 Update .env File
Open your project's main `.env` file and add/update these values:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Frontend Environment Variables
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here

# Backend Configuration
PORT=3005
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### 5.3 Restart Your Application
After updating the .env file:
```bash
# Stop any running servers (Ctrl+C)
# Then restart with:
npm run dev
```

## Step 6: Test Your Setup

### 6.1 Verify Database
1. Go to **Table Editor** in Supabase Dashboard
2. Verify these tables exist:
   - `user_profiles`
   - `analyses` 
   - `analysis_screenshots`
   - `projects`
   - `storage_objects`

### 6.2 Test Authentication
1. Start your application: `npm run dev`
2. Go to `http://localhost:3000`
3. Try to register a new user account
4. Check if registration succeeds without CORS errors

### 6.3 Test Screenshot Storage
1. Run an accessibility analysis
2. Check if screenshots appear in Supabase Storage bucket
3. Verify screenshot URLs are accessible

## Step 7: Common Issues & Solutions

### Issue: "Access-Control-Allow-Origin" CORS Error
**Solution:** 
- Verify CORS settings in Authentication → Settings
- Ensure `http://localhost:3000/**` is in Additional Redirect URLs
- Check Site URL is set to `http://localhost:3000`

### Issue: "Failed to fetch" during authentication
**Solution:**
- Verify API keys are correctly set in .env file
- Restart your application after changing .env
- Check network tab for actual error details

### Issue: Screenshots not storing
**Solution:**
- Verify storage bucket `analysis-screenshots` exists and is public
- Check storage policies are properly configured
- Ensure service_role key is set in backend .env

### Issue: Database validation fails
**Solution:**
- Run scripts in exact order (01 through 09)
- Check for error messages in SQL Editor
- Verify all scripts completed successfully

## Step 8: Final Security Checklist

Before going live, ensure:

- [ ] **Environment variables are secure**
  - API keys are not committed to git
  - Different keys for development/production
  - Strong database passwords used

- [ ] **Database security is configured**
  - All RLS policies are enabled
  - Storage bucket policies are properly set
  - Service role key is only used in backend

- [ ] **CORS is properly configured**
  - Site URL matches your domain
  - Redirect URLs are specific to your domains
  - No wildcard (*) domains in production

- [ ] **Storage security is set**
  - Screenshots bucket exists and is public
  - Storage policies allow appropriate access
  - File uploads are validated

## Step 9: Quick Verification Queries

Run these in Supabase SQL Editor to verify setup:

```sql
-- Check if all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verify analysis_screenshots table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'analysis_screenshots'
ORDER BY ordinal_position;

-- Check if materialized view exists
SELECT matviewname FROM pg_matviews 
WHERE schemaname = 'public';

-- Test dashboard stats refresh
SELECT refresh_dashboard_stats();
```

## Need Help?

If you encounter issues:
1. Check the error message in your browser's Network tab
2. Verify each step was completed in order
3. Check Supabase Dashboard logs for backend errors
4. Ensure all environment variables are correctly set
5. Try the verification queries above to diagnose issues

The most common issue is CORS configuration - make sure your redirect URLs exactly match your frontend URL with `/**` at the end.