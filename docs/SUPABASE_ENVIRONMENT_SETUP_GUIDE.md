# Supabase Environment Setup Guide

This guide will help you set up separate development and production Supabase projects for StreetWiseWeb.

## Overview

Having separate Supabase projects for development and production allows you to:
- Test changes safely without affecting production data
- Have different rate limits and configurations
- Maintain separate user bases
- Implement proper CI/CD workflows

## Prerequisites

- Supabase account (free tier works for development)
- Access to create new Supabase projects

## Step 1: Create Two Supabase Projects

### 1.1 Development Project
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Name it something like `streetwiseweb-dev`
4. Choose your region (closest to you)
5. Generate a strong database password (save it!)
6. Click "Create new project"

### 1.2 Production Project
1. Click "New Project" again
2. Name it `streetwiseweb-prod` (or your preferred production name)
3. Choose your region (consider your users' location)
4. Generate a different strong database password (save it!)
5. Click "Create new project"

## Step 2: Configure Storage Buckets

For **BOTH** projects, you need to create the storage bucket:

1. Go to Storage in the Supabase dashboard
2. Click "Create bucket"
3. Name: `analysis-screenshots`
4. Public bucket: **Yes** (toggle on)
5. Click "Create bucket"

### Storage Policies (Important!)

After creating the bucket, set up RLS policies:

1. Click on the `analysis-screenshots` bucket
2. Go to "Policies" tab
3. Create the following policies:

**Insert Policy** (Authenticated users can upload):
```sql
-- Policy name: Authenticated users can upload screenshots
CREATE POLICY "Authenticated users can upload screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'analysis-screenshots');
```

**Select Policy** (Public can view):
```sql
-- Policy name: Public can view screenshots
CREATE POLICY "Public can view screenshots"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'analysis-screenshots');
```

**Delete Policy** (Users can delete their own):
```sql
-- Policy name: Users can delete their own screenshots
CREATE POLICY "Users can delete their own screenshots"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'analysis-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Step 3: Set Up Database Schema

1. For **BOTH** projects, go to SQL Editor
2. Copy the entire contents of `/database/COMPLETE_DATABASE_CLEANUP_AND_SETUP.sql`
3. Paste and run it in the SQL editor
4. You should see success messages

## Step 4: Configure Authentication

For **BOTH** projects:

1. Go to Authentication → Settings
2. Configure the following:

### Email Settings
- Enable Email Confirmations: Your choice (can be off for dev)
- Enable Email Change Confirmations: Your choice
- Secure Email Change: Enabled

### Auth Providers
- Keep Email/Password enabled
- Configure social providers if needed (Google, GitHub, etc.)

### Email Templates (Optional)
- Customize confirmation emails
- Add your branding

## Step 5: Environment Files Setup

### 5.1 Development Environment

1. Copy `.env.development.example` to `.env.development`
2. Get your development project credentials:
   - Go to your dev project → Settings → API
   - Copy:
     - Project URL → `SUPABASE_URL` and `REACT_APP_SUPABASE_URL`
     - `anon` public key → `SUPABASE_ANON_KEY` and `REACT_APP_SUPABASE_ANON_KEY`
     - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### 5.2 Production Environment

1. Copy `.env.production.example` to `.env.production`
2. Get your production project credentials (same process as above)
3. Update production-specific values:
   - `REACT_APP_API_URL`: Your production domain
   - `FRONTEND_URL`: Your production domain
   - Generate strong secrets for `JWT_SECRET` and `SESSION_SECRET`

## Step 6: Switching Between Environments

### For Development
```bash
# Backend
cd backend
cp ../.env.development .env
npm run dev

# Frontend (in new terminal)
cd frontend
cp ../.env.development .env
npm start
```

### For Production Build
```bash
# Backend
cd backend
cp ../.env.production .env
npm start

# Frontend build
cd frontend
cp ../.env.production .env
npm run build
```

## Step 7: Database Management Commands

### Clean/Reset Development Database
```sql
-- Run in Supabase SQL Editor for dev project
-- This will delete all data and reset the schema
-- (Use the COMPLETE_DATABASE_CLEANUP_AND_SETUP.sql file)
```

### Backup Production Database
```bash
# Use Supabase dashboard → Settings → Database → Backups
# Or use pg_dump with connection string
```

### Monitor Database Usage
- Check Supabase dashboard → Database → Statistics
- Monitor storage usage in Storage section

## Important Notes

1. **Never commit .env files** - They contain secrets!
2. **Keep service role keys secret** - They bypass RLS
3. **Use different passwords** for dev and prod databases
4. **Regular backups** for production data
5. **Test migrations** in development first

## Troubleshooting

### Screenshot Storage Issues
1. Verify the bucket exists and is public
2. Check Storage policies are applied
3. Ensure service role key is used in backend
4. Check Storage logs in Supabase dashboard

### Authentication Issues
1. Verify API keys are correct
2. Check CORS settings match your domains
3. Ensure auth emails are configured
4. Check rate limits haven't been exceeded

### Database Issues
1. Run verification queries:
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check if screenshots table has metadata column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'analysis_screenshots';
```

## Next Steps

1. Test the setup by creating a new user account
2. Run an analysis and verify screenshots are stored
3. Check that dashboard loads analyses correctly
4. Set up CI/CD pipelines with environment variables
5. Configure monitoring and alerts for production

## Security Checklist

- [ ] Different API keys for dev/prod
- [ ] Strong database passwords
- [ ] RLS policies enabled on all tables
- [ ] Storage bucket policies configured
- [ ] Service role key only used in backend
- [ ] CORS configured for your domains only
- [ ] Rate limiting enabled
- [ ] SSL/HTTPS enforced in production