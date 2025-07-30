# Database Schema Fix Guide

## Issue Summary

The StreetWiseWeb application was experiencing database schema issues where analysis score columns (`overall_score`, `accessibility_score`, `seo_score`, `performance_score`) were missing `DEFAULT 0` constraints, causing `NULL` values to be inserted instead of expected integer scores.

## Root Cause Analysis

### 1. Schema Inconsistencies
Multiple database setup files contained different definitions for the `analyses` table:

**✅ CORRECT** (`/database/setup/02_core_tables.sql`):
```sql
overall_score INTEGER DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 100),
accessibility_score INTEGER DEFAULT 0 CHECK (accessibility_score >= 0 AND accessibility_score <= 100),
seo_score INTEGER DEFAULT 0 CHECK (seo_score >= 0 AND seo_score <= 100),
performance_score INTEGER DEFAULT 0 CHECK (performance_score >= 0 AND performance_score <= 100),
```

**❌ PROBLEMATIC** (`/database/schema.sql`, `/database/COMPLETE_PRODUCTION_SETUP.sql`):
```sql
overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
accessibility_score INTEGER CHECK (accessibility_score >= 0 AND accessibility_score <= 100),
seo_score INTEGER CHECK (seo_score >= 0 AND seo_score <= 100),
performance_score INTEGER CHECK (performance_score >= 0 AND performance_score <= 100),
```

### 2. Impact on Application
- **Database**: Score columns contained `NULL` values instead of `0`
- **Backend**: Code expected integer scores but received `NULL`
- **Frontend**: Displayed `overallScore: 0` due to JavaScript `NULL` coercion
- **Reports**: Missing or incorrect score calculations in detailed reports

## Solution Implemented

### 1. Database Migration Script
Created `/database/fix_analyses_schema.sql` that:
- ✅ Backs up existing data
- ✅ Updates all `NULL` score values to `0`
- ✅ Adds `DEFAULT 0` constraints to score columns
- ✅ Adds `NOT NULL` constraints to prevent future `NULL` values
- ✅ Validates the fixes with test insertions
- ✅ Creates a validation function for future monitoring

### 2. Backend Code Improvements
Updated `/backend/models/Analysis.js` to ensure scores are never `undefined`:

**Before:**
```javascript
overall_score: analysisData.overallScore,
accessibility_score: analysisData.accessibilityScore,
seo_score: analysisData.seoScore,
performance_score: analysisData.performanceScore,
```

**After:**
```javascript
// Ensure scores are integers (never undefined/null) with fallback to 0
overall_score: typeof analysisData.overallScore === 'number' ? analysisData.overallScore : 0,
accessibility_score: typeof analysisData.accessibilityScore === 'number' ? analysisData.accessibilityScore : 0,
seo_score: typeof analysisData.seoScore === 'number' ? analysisData.seoScore : 0,
performance_score: typeof analysisData.performanceScore === 'number' ? analysisData.performanceScore : 0,
```

## How to Apply the Fix

### Step 1: Run Database Migration
Execute the database migration script in your Supabase SQL editor:

```bash
# Copy the contents of database/fix_analyses_schema.sql
# Paste into Supabase SQL Editor and run
```

### Step 2: Restart Backend Services
```bash
# Stop current backend
npm run backend:stop  # or Ctrl+C

# Restart backend to load updated code
npm run backend
# or
npm run dev
```

### Step 3: Test the Fix
1. **Create a new analysis** via the frontend
2. **Check the database** to ensure scores are properly set
3. **View detailed reports** to confirm scores display correctly
4. **Check dashboard stats** for proper score averages

## Validation Commands

### Database Validation
Run this query in Supabase to validate the fix:

```sql
-- Check column definitions
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'analyses'
    AND column_name IN ('overall_score', 'accessibility_score', 'seo_score', 'performance_score')
ORDER BY ordinal_position;

-- Use the validation function created by the migration
SELECT * FROM public.validate_analyses_schema();

-- Check for any remaining NULL values
SELECT COUNT(*) as null_score_count
FROM public.analyses 
WHERE overall_score IS NULL 
    OR accessibility_score IS NULL 
    OR seo_score IS NULL 
    OR performance_score IS NULL;
```

### Application Testing
1. **New Analysis Test**:
   - Run analysis on a test website
   - Verify scores appear correctly in response
   - Check database record has proper integer values

2. **Detailed Report Test**:
   - Generate a detailed report
   - Confirm all scores display properly
   - Verify enhanced features (screenshots, SEO, AI insights) work

3. **Dashboard Test**:
   - Check user dashboard shows correct statistics
   - Verify average scores calculate properly
   - Ensure no "NaN" or undefined values appear

## Prevention Measures

### 1. Schema Consistency
All database setup files should use the same table definitions. The correct pattern is:

```sql
score_column INTEGER DEFAULT 0 NOT NULL CHECK (score_column >= 0 AND score_column <= 100)
```

### 2. Backend Validation
Always validate and provide defaults for required database fields:

```javascript
// Good practice
const scoreValue = typeof inputScore === 'number' && !isNaN(inputScore) ? inputScore : 0;

// Avoid
const scoreValue = inputScore; // Could be undefined/null
```

### 3. Regular Monitoring
Use the created validation function to periodically check schema consistency:

```sql
SELECT * FROM public.validate_analyses_schema();
```

## Rollback Procedure (if needed)

If issues arise, you can rollback using the backup created by the migration:

```sql
-- Find your backup table (created during migration)
SELECT tablename FROM pg_tables 
WHERE tablename LIKE 'analyses_backup_%' 
ORDER BY tablename DESC 
LIMIT 1;

-- Restore from backup (replace YYYY_MM_DD_HH24_MI_SS with your backup timestamp)
BEGIN;
DROP TABLE public.analyses CASCADE;
ALTER TABLE analyses_backup_YYYY_MM_DD_HH24_MI_SS RENAME TO analyses;
-- Recreate indexes, triggers, and constraints as needed
COMMIT;
```

## Expected Results After Fix

✅ **Database**:
- All score columns have `DEFAULT 0` and `NOT NULL` constraints
- No `NULL` values in score columns
- New analyses automatically get `0` for unspecified scores

✅ **Backend**:
- Analysis creation never fails due to `NULL` scores
- Score calculations work correctly
- Database queries return expected integer values

✅ **Frontend**:
- Reports display proper scores (not "0" from `NULL` coercion)
- Dashboard statistics calculate correctly
- No more "overallScore: 0" when data exists

✅ **Detailed Reports**:
- Enhanced features (screenshots, SEO, AI insights) work properly
- Score breakdowns display correctly
- Report generation completes successfully

## Support

If you encounter issues after applying this fix:

1. **Check the migration log** in your database console for any errors
2. **Verify the backend restart** completed successfully
3. **Test with a simple analysis** first before complex ones
4. **Check browser console** for any JavaScript errors
5. **Review server logs** for database connection issues

The fix addresses the core schema inconsistency issues and should resolve the "overallScore: 0" and missing enhanced features problems reported in your logs.