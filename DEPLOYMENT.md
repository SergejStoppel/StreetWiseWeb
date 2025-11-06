# 🚀 Automated Database Deployment Guide

This guide will help you set up automatic database deployments to Supabase using GitHub Actions.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Step 1: Create Supabase Projects](#step-1-create-supabase-projects)
- [Step 2: Get Supabase Access Token](#step-2-get-supabase-access-token)
- [Step 3: Configure GitHub Secrets](#step-3-configure-github-secrets)
- [Step 4: Create Storage Bucket](#step-4-create-storage-bucket)
- [Step 5: Test the Deployment](#step-5-test-the-deployment)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)

---

## Overview

**What this does:**
- Push to `main` branch → Auto-deploy to **Development** Supabase
- Push to `prod` branch → Auto-deploy to **Production** Supabase

**Benefits:**
- ✅ No more manual SQL script execution
- ✅ Version-controlled database changes
- ✅ Automated deployments via GitHub Actions
- ✅ Rollback capability using git
- ✅ Clear audit trail of all changes

---

## Prerequisites

Before starting, ensure you have:
- [ ] GitHub account with repository access
- [ ] Supabase account (free tier is fine)
- [ ] Git installed locally
- [ ] Basic understanding of git branches

---

## Step 1: Create Supabase Projects

You need **two separate Supabase projects**: one for development and one for production.

### 1.1 Create Development Project

1. Go to https://app.supabase.com
2. Click **"New Project"**
3. Fill in:
   - **Name**: `StreetWiseWeb-Dev` (or your preferred name)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose the closest region
   - **Plan**: Free tier is fine for development
4. Click **"Create new project"**
5. Wait 2-3 minutes for the project to initialize

### 1.2 Create Production Project

1. Click **"New Project"** again
2. Fill in:
   - **Name**: `StreetWiseWeb-Prod`
   - **Database Password**: Generate a different strong password (save it!)
   - **Region**: Choose the closest region (ideally same as dev)
   - **Plan**: Free tier to start (upgrade when needed)
3. Click **"Create new project"**
4. Wait 2-3 minutes for initialization

### 1.3 Get Project Reference IDs

For **each project** (Dev and Prod):

1. Open the project in Supabase dashboard
2. Click **Settings** (gear icon) in the left sidebar
3. Click **General** under Project Settings
4. Copy the **Reference ID** (format: `abcdefghijklmnop`)

**Save these IDs:**
- Dev Project Reference ID: `________________`
- Prod Project Reference ID: `________________`

### 1.4 Get API Keys

For **each project** (Dev and Prod):

1. Go to **Settings** → **API**
2. Find **Project API keys** section
3. Copy these values:
   - **Project URL** (e.g., `https://abcdefghijklmnop.supabase.co`)
   - **anon/public key** (starts with `eyJh...`)
   - **service_role key** (starts with `eyJh...`)

**Update your `.env` file:**

```bash
# Development
DEV_SUPABASE_URL=https://your-dev-project-id.supabase.co
DEV_SUPABASE_ANON_KEY=eyJhbGci...
DEV_SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Production
PROD_SUPABASE_URL=https://your-prod-project-id.supabase.co
PROD_SUPABASE_ANON_KEY=eyJhbGci...
PROD_SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

---

## Step 2: Get Supabase Access Token

This token allows GitHub Actions to deploy migrations.

### 2.1 Generate Access Token

1. Go to https://app.supabase.com/account/tokens
2. Click **"Generate new token"**
3. Give it a name: `GitHub Actions Deployment`
4. Click **"Generate token"**
5. **IMPORTANT**: Copy the token immediately (you won't see it again!)

**Save this token:**
```
SUPABASE_ACCESS_TOKEN: ________________________________
```

---

## Step 3: Configure GitHub Secrets

### 3.1 Add Repository Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add these three secrets:

#### Secret 1: SUPABASE_ACCESS_TOKEN
- **Name**: `SUPABASE_ACCESS_TOKEN`
- **Value**: Paste the token from Step 2
- Click **"Add secret"**

#### Secret 2: DEV_SUPABASE_PROJECT_REF
- **Name**: `DEV_SUPABASE_PROJECT_REF`
- **Value**: Paste your Dev Project Reference ID
- Click **"Add secret"**

#### Secret 3: PROD_SUPABASE_PROJECT_REF
- **Name**: `PROD_SUPABASE_PROJECT_REF`
- **Value**: Paste your Prod Project Reference ID
- Click **"Add secret"**

### 3.2 Verify Secrets

Your secrets list should show:
- ✅ `SUPABASE_ACCESS_TOKEN`
- ✅ `DEV_SUPABASE_PROJECT_REF`
- ✅ `PROD_SUPABASE_PROJECT_REF`

---

## Step 4: Create Storage Bucket

The application needs a storage bucket for analysis assets (screenshots, HTML, etc.).

### 4.1 Create Bucket in Dev Project

1. Open your **Development** project in Supabase
2. Click **Storage** in the left sidebar
3. Click **"Create bucket"**
4. Fill in:
   - **Name**: `analysis-assets`
   - **Public bucket**: ❌ Uncheck (keep it private)
5. Click **"Create bucket"**

### 4.2 Create Bucket in Prod Project

Repeat the same steps for your **Production** project:
1. Open **Production** project
2. Storage → Create bucket
3. Name: `analysis-assets`
4. Keep it private
5. Create

**Note**: The storage policies migration (12_storage_policies.sql) will automatically configure access permissions.

---

## Step 5: Test the Deployment

Now let's test that everything works!

### 5.1 Initial Deployment to Dev

1. Make sure you're on the `main` branch:
   ```bash
   git checkout main
   ```

2. Create a small test change to trigger deployment:
   ```bash
   git commit --allow-empty -m "Test: Initial database deployment"
   git push origin main
   ```

3. Watch the deployment:
   - Go to your GitHub repository
   - Click **Actions** tab
   - You should see "Deploy to Development (Supabase)" running
   - Click on it to watch the progress

4. Verify success:
   - The workflow should show green checkmarks ✅
   - Go to your Dev Supabase project
   - Click **Table Editor**
   - You should see all your tables (users, workspaces, analyses, etc.)

### 5.2 Verify Database Schema

In Supabase Table Editor, verify these tables exist:
- ✅ users
- ✅ workspaces
- ✅ workspace_members
- ✅ websites
- ✅ analyses
- ✅ analysis_jobs
- ✅ screenshots
- ✅ analysis_modules
- ✅ rules
- ✅ compliance_standards
- ✅ accessibility_issues
- ✅ seo_issues
- ✅ performance_issues
- ✅ plans
- ✅ subscriptions
- ✅ one_time_purchases
- ✅ report_credits
- ✅ reports
- ✅ audit_log

### 5.3 Verify Seed Data

1. In Supabase, click **SQL Editor**
2. Run this query to check seed data:
   ```sql
   -- Check analysis modules
   SELECT * FROM analysis_modules;

   -- Check rules count
   SELECT
     am.name as module,
     COUNT(r.id) as rule_count
   FROM analysis_modules am
   LEFT JOIN rules r ON r.module_id = am.id
   GROUP BY am.name
   ORDER BY am.name;
   ```

3. Expected results:
   - 4 analysis modules (Fetcher, Accessibility, SEO, Performance)
   - Accessibility: 60+ rules
   - SEO: 25+ rules
   - Performance: 20+ rules

### 5.4 Test Production Deployment (Optional)

**⚠️ Only do this when ready for production!**

1. Create the `prod` branch:
   ```bash
   git checkout -b prod
   git push origin prod
   ```

2. Watch the workflow in GitHub Actions
3. Verify tables in Production Supabase project

---

## Usage

### Daily Development Workflow

1. Make changes to migration files in `supabase/migrations/`
2. Commit and push to `main`:
   ```bash
   git add supabase/migrations/
   git commit -m "Add new migration: user preferences table"
   git push origin main
   ```
3. GitHub Actions automatically deploys to Development
4. Check the Actions tab to verify success

### Creating a New Migration

When you need to add a new database change:

```bash
# Create a new timestamped migration file
# Format: YYYYMMDDHHMMSS_description.sql
# Example: 20250105120000_add_user_preferences.sql

# Create the file
touch supabase/migrations/$(date +%Y%m%d%H%M%S)_add_user_preferences.sql

# Edit the file and add your SQL
nano supabase/migrations/20250105120000_add_user_preferences.sql
```

Example migration content:
```sql
-- Add user preferences table

CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light',
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
```

### Promoting to Production

When you're confident with your changes in dev:

1. Merge `main` into `prod`:
   ```bash
   git checkout prod
   git merge main
   git push origin prod
   ```

2. GitHub Actions deploys to Production
3. Verify in Production Supabase dashboard

---

## Troubleshooting

### Issue: "Migration failed: relation already exists"

**Problem**: Table already exists from previous manual execution.

**Solution**:
```sql
-- In Supabase SQL Editor, drop the existing table
DROP TABLE IF EXISTS table_name CASCADE;
```

Then re-run the workflow.

### Issue: "Authentication failed"

**Problem**: Invalid Supabase access token or project ref.

**Solution**:
1. Verify GitHub secrets are correct
2. Regenerate Supabase access token if needed
3. Update the `SUPABASE_ACCESS_TOKEN` secret

### Issue: "Workflow not triggering"

**Problem**: Pushing to branch but workflow doesn't start.

**Solution**:
1. Check you're pushing to `main` (for dev) or `prod` (for production)
2. Verify workflow files are in `.github/workflows/`
3. Check GitHub Actions is enabled for your repository

### Issue: "Storage bucket not found"

**Problem**: Workers can't upload to analysis-assets bucket.

**Solution**:
1. Verify bucket exists in Supabase Storage
2. Check bucket name is exactly `analysis-assets`
3. Ensure storage policies migration ran successfully

### Issue: "Permission denied on table"

**Problem**: RLS policies blocking access.

**Solution**:
1. Service role key should bypass RLS
2. Verify `DEV_SUPABASE_SERVICE_ROLE_KEY` in `.env`
3. Check RLS policies in Supabase dashboard

---

## 🎉 Success Checklist

After completing this guide, you should have:

- ✅ Two Supabase projects (Dev and Prod)
- ✅ GitHub secrets configured
- ✅ Storage buckets created
- ✅ Automatic deployments working
- ✅ All database tables and seed data loaded
- ✅ Version-controlled database schema

---

## Next Steps

1. **Update your backend .env**: Make sure `DEV_SUPABASE_*` and `PROD_SUPABASE_*` variables are filled
2. **Test the application**: Run `npm run dev` and verify database connection
3. **Monitor deployments**: Watch GitHub Actions for any failed migrations
4. **Create a backup strategy**: Set up Supabase automated backups

---

## Useful Commands

```bash
# Check migration status
ls -la supabase/migrations/

# View GitHub Actions locally (requires act)
gh workflow list

# Manually trigger production deployment
gh workflow run deploy-prod.yml

# View workflow logs
gh run list
gh run view <run-id>
```

---

## Getting Help

- **Supabase Docs**: https://supabase.com/docs
- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **Project Issues**: https://github.com/your-username/StreetWiseWeb/issues

---

**🎊 Congratulations!** You now have automated database deployments set up. Every push to `main` or `prod` will automatically update your Supabase databases!
