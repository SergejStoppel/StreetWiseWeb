# Database Migration Summary - Performance Image Optimization Rules

**Created:** November 20, 2025
**Branch:** `claude/analyze-production-readiness-01KX2dmpASmPtz8Mv3658VtN`
**Status:** ✅ Complete and Ready to Apply

---

## What Was Created

I've created a complete database migration system to add 8 new Performance rules required by the Image Optimization worker.

### Files Created

1. **`supabase/migrations/20251120175757_add_performance_image_rules.sql`**
   - Supabase-compatible migration file
   - Will be automatically applied when you push migrations via Supabase CLI
   - Idempotent (safe to run multiple times)

2. **`database/migrations/add_performance_image_rules.sql`**
   - Standalone migration script
   - Can be run directly on your existing database
   - Includes detailed progress logging
   - Shows which rules were added vs already existed

### Files Updated

3. **`supabase/migrations/20250105000011_seed_data.sql`**
   - Updated to include all 8 new rules
   - Updated rule count from "20+ rules" to "28+ rules"
   - Added 3 image rules to Core Web Vitals mapping
   - Fresh Supabase deployments will get these automatically

4. **`database/setup/11_seed_data.sql`**
   - Mirrored update for consistency
   - Fresh local installations will get these automatically

---

## The 8 New Performance Image Rules

All rules added to the `rules` table in your database:

### Image Sizing & Format (3 rules)
- ✅ `PERF_IMG_01_OVERSIZED` - Images larger than needed (serious)
- ✅ `PERF_IMG_02_FORMAT_OUTDATED` - Using JPEG/PNG instead of WebP/AVIF (moderate)
- ✅ `PERF_IMG_06_NO_SRCSET` - Missing responsive image markup (moderate)

### Layout Stability - CLS Impact (2 rules)
- ✅ `PERF_IMG_03_DIMENSIONS_MISSING` - Missing width/height attributes (serious) **[Core Web Vitals]**
- ✅ `PERF_IMG_08_CLS_RISK` - Above-fold images without dimensions (critical) **[Core Web Vitals]**

### Loading Strategy (2 rules)
- ✅ `PERF_IMG_04_LAZY_LOADING_MISSING` - Below-fold images not lazy-loaded (moderate)
- ✅ `PERF_IMG_05_LAZY_LOADING_INCORRECT` - Above-fold images lazy-loaded, delays LCP (serious) **[Core Web Vitals]**

### Overall Performance (1 rule)
- ✅ `PERF_IMG_07_PAGE_WEIGHT_HIGH` - Excessive total image weight (moderate)

**Total Performance Rules After Migration:** 28 rules
(Previously: 20 rules)

---

## Core Web Vitals Integration

Three of the new image rules are directly mapped to the Core Web Vitals compliance standard:

| Rule | Core Web Vital Impact |
|------|----------------------|
| `PERF_IMG_03_DIMENSIONS_MISSING` | CLS (Cumulative Layout Shift) |
| `PERF_IMG_05_LAZY_LOADING_INCORRECT` | LCP (Largest Contentful Paint) |
| `PERF_IMG_08_CLS_RISK` | CLS (Cumulative Layout Shift) |

These rules help ensure compliance with Google's Core Web Vitals metrics for page experience.

---

## How to Apply the Migration

### ⚡ Quick Start - Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project (development or production)

2. **Open SQL Editor**
   - Click "SQL Editor" in sidebar
   - Click "New Query"

3. **Run the Migration**
   - Copy contents of `database/migrations/add_performance_image_rules.sql`
   - Paste into SQL Editor
   - Click "Run"

4. **Verify Success**
   - You should see: "Migration Complete! New rules added: 8"
   - Run verification:
     ```sql
     SELECT COUNT(*) FROM rules
     WHERE module_id = (SELECT id FROM analysis_modules WHERE name = 'Performance');
     -- Should return: 28
     ```

### 🚀 Alternative - Supabase CLI

If you want to use the Supabase CLI workflow:

```bash
# Already done - the migration file exists in supabase/migrations/
# Just push it to your project:

# For Development
supabase db push

# For Production
# (assuming you have prod configured in your Supabase CLI)
supabase db push --project-ref YOUR_PROD_PROJECT_REF
```

---

## Verification

After applying the migration, verify it worked:

```sql
-- Check total Performance rules (should be 28)
SELECT COUNT(*) as total_performance_rules
FROM rules
WHERE module_id = (SELECT id FROM analysis_modules WHERE name = 'Performance');

-- List all image optimization rules
SELECT rule_key, name, default_severity
FROM rules
WHERE rule_key LIKE 'PERF_IMG_%'
ORDER BY rule_key;

-- Should show 8 rules from PERF_IMG_01 through PERF_IMG_08

-- Verify Core Web Vitals mappings (should include 3 image rules)
SELECT r.rule_key, r.name, s.name as standard_name
FROM rules r
JOIN standard_rules_mapping srm ON r.id = srm.rule_id
JOIN compliance_standards s ON srm.standard_id = s.id
WHERE r.rule_key LIKE 'PERF_IMG_%'
AND s.name = 'Core Web Vitals';

-- Should return 3 rows:
-- PERF_IMG_03_DIMENSIONS_MISSING
-- PERF_IMG_05_LAZY_LOADING_INCORRECT
-- PERF_IMG_08_CLS_RISK
```

---

## Safety Features

✅ **Idempotent** - Safe to run multiple times. Already existing rules will be skipped.

✅ **No Data Loss** - Only inserts new rules, doesn't modify existing data.

✅ **Progress Logging** - Shows exactly which rules were added:
```
[✓] Added: PERF_IMG_01_OVERSIZED
[EXISTS] PERF_CWV_01_LCP_SLOW
```

✅ **Error Handling** - Clear error messages if something goes wrong.

✅ **Reversible** - Rollback instructions provided below.

---

## Rollback Instructions

If you need to remove the performance image rules:

```sql
-- Remove the 8 image optimization rules
DELETE FROM rules
WHERE rule_key IN (
    'PERF_IMG_01_OVERSIZED',
    'PERF_IMG_02_FORMAT_OUTDATED',
    'PERF_IMG_03_DIMENSIONS_MISSING',
    'PERF_IMG_04_LAZY_LOADING_MISSING',
    'PERF_IMG_05_LAZY_LOADING_INCORRECT',
    'PERF_IMG_06_NO_SRCSET',
    'PERF_IMG_07_PAGE_WEIGHT_HIGH',
    'PERF_IMG_08_CLS_RISK'
);

-- Note: This will also cascade delete any:
-- - standard_rules_mapping entries (foreign key)
-- - performance_issues entries using these rules (foreign key)
```

---

## When to Apply

### Development Database
**Apply Now** - Run the migration on your development database immediately so you can test the Image Optimization worker.

### Production Database
**Apply Before Deploying Worker** - You must apply this migration before the Image Optimization worker goes live, or it will fail to insert issues (rules won't exist).

---

## What Happens If You Don't Apply the Migration?

If you deploy the Image Optimization worker WITHOUT running this migration:

- ❌ The worker will run successfully
- ❌ It will capture image metadata from websites
- ❌ It will detect image optimization issues
- ❌ But it will FAIL to insert issues into the database
- ❌ You'll see warnings in logs: "Rule not found in database, skipping issue"
- ❌ Users won't see the image optimization insights

**Solution:** Run the migration before or immediately after deploying the worker.

---

## Related Worker Implementation

The Image Optimization worker was implemented in:
- **`backend/src/core/workers/performance/imageOptimization.worker.ts`** (650 lines)
  - Analyzes 8 distinct image optimization opportunities
  - Reads image metadata from `meta/images.json`
  - Stores issues in `performance_issues` table

The Fetcher worker was updated to capture image metadata:
- **`backend/src/core/workers/fetcher.worker.ts`**
  - Added `captureImageMetadata()` function
  - Captures natural dimensions, rendered dimensions, formats, lazy loading, srcset, position
  - Stores metadata in Supabase Storage at `{workspaceId}/{analysisId}/meta/images.json`

---

## Testing the Worker

After applying the migration, you can test the Image Optimization worker:

1. **Trigger an analysis** on a website with images
2. **Check the worker logs** for the Image Optimization worker
3. **Query for issues:**
   ```sql
   SELECT
     pi.id,
     pi.analysis_id,
     r.rule_key,
     r.name,
     pi.severity,
     pi.message,
     pi.location_path
   FROM performance_issues pi
   JOIN rules r ON pi.rule_key = r.rule_key
   WHERE r.rule_key LIKE 'PERF_IMG_%'
   ORDER BY pi.created_at DESC
   LIMIT 20;
   ```

---

## Next Steps

1. **Apply Migration** (choose one method above)
2. **Verify Success** (run verification queries)
3. **Test Image Optimization Worker** (trigger an analysis and check `performance_issues` table)
4. **Deploy to Production** (when ready, apply to prod database first, then deploy worker)
5. **Monitor Performance** (ensure image metadata capture and analysis work correctly)

---

## Questions?

See the complete guide in `database/migrations/README.md` for:
- Detailed step-by-step instructions for all methods
- Troubleshooting common issues
- Additional verification queries

---

## Summary

✅ 8 new Performance rules defined
✅ 3 migration files created (Supabase, Standalone, README reference)
✅ 2 seed files updated for fresh installs
✅ 3 rules mapped to Core Web Vitals compliance standard
✅ Complete documentation provided
✅ Safe, idempotent, and reversible
✅ Ready to apply to your database

**Total Commits:** Pending (will be committed with other changes)
**Status:** All migration files created and ready

**Migration File Locations:**
- Supabase: `supabase/migrations/20251120175757_add_performance_image_rules.sql`
- Standalone: `database/migrations/add_performance_image_rules.sql`
- Seed Data: `supabase/migrations/20250105000011_seed_data.sql` (updated)
- Local Setup: `database/setup/11_seed_data.sql` (updated)
