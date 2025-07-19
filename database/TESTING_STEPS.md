# Database Optimization Testing Steps

## Overview

This guide provides step-by-step instructions for testing the database optimizations safely. **No existing data will be lost** - the migration enhances the current structure.

## Prerequisites

- ✅ Supabase project access
- ✅ Backend containers running
- ✅ Valid authentication token for API testing

## Step 1: Run Database Migration

### 1.1 Open Supabase SQL Editor

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query

### 1.2 Execute Migration Script

Copy and paste the entire content from:
```
database/migrations/001_optimize_database_structure.sql
```

**Execute the script** - this will:
- ✅ Create new optimized tables
- ✅ Migrate existing data automatically
- ✅ Add performance indexes
- ✅ Create cleanup functions
- ✅ Set up materialized views

**Expected Result**: Script should complete with "Migration completed successfully!" message.

## Step 2: Add Storage Trigger (Manual)

### 2.1 Create Storage Trigger

In the same Supabase SQL Editor, run this **separately**:

```sql
CREATE TRIGGER track_storage_upload_trigger
    AFTER INSERT OR UPDATE ON storage.objects
    FOR EACH ROW EXECUTE FUNCTION public.track_storage_upload();
```

**Why separate?**: Storage triggers require elevated permissions.

**Expected Result**: "CREATE TRIGGER" success message.

## Step 3: Restart Backend Containers

### 3.1 Stop and Restart Containers

```bash
# Stop containers
docker-compose -f docker-compose.dev.yml down

# Start containers
docker-compose -f docker-compose.dev.yml up -d
```

### 3.2 Verify Backend is Running

```bash
curl http://localhost:3005/api/health
```

**Expected Result**:
```json
{"status":"OK","timestamp":"2025-01-19T..."}
```

## Step 4: Test New Database Structure

### 4.1 Check Materialized View Status

```bash
curl "http://localhost:3005/api/database-test/materialized-view-status"
```

**Expected Result**:
```json
{
  "success": true,
  "data": {
    "exists": true,
    "recordCount": 5,
    "lastRefresh": "2025-01-19T..."
  }
}
```

### 4.2 Test Dashboard Performance

```bash
curl "http://localhost:3005/api/analysis/stats" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Expected Result**: Faster response time (should be <500ms instead of 2-5 seconds).

### 4.3 Check Recent Analyses

```bash
curl "http://localhost:3005/api/analysis/recent?limit=5" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Expected Result**: Your existing analyses should still be there and load quickly.

## Step 5: Test CASCADE Deletion (Safe Test)

### 5.1 Test What Would Be Deleted

**Important**: This is a **SAFE TEST** - it shows what would be deleted but doesn't actually delete anything.

```bash
curl -X POST "http://localhost:3005/api/database-test/test-cascade/YOUR_USER_ID" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json"
```

Replace `YOUR_USER_ID` with your actual user ID.

**Expected Result**:
```json
{
  "success": true,
  "data": {
    "userProfile": {...},
    "projects": [...],
    "analyses": [...],
    "analysisIssues": [...],
    "usageLogs": [...],
    "storageObjects": [...],
    "analysisSummaries": [...],
    "totalRecords": 25
  },
  "message": "Found 25 records that would be deleted"
}
```

This shows the complete cleanup would work when a user is actually deleted.

## Step 6: Test Storage Tracking

### 6.1 Check Storage Usage

```bash
curl "http://localhost:3005/api/database-test/storage-usage/YOUR_USER_ID" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Expected Result**:
```json
{
  "success": true,
  "data": {
    "usage": {
      "totalSize": 2048000,
      "totalFiles": 3,
      "averageSize": 682666
    },
    "objects": [...],
    "totalObjects": 3
  }
}
```

### 6.2 Check Cleanup Statistics

```bash
curl "http://localhost:3005/api/database-test/cleanup-stats" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Expected Result**:
```json
{
  "success": true,
  "data": {
    "anonymousAnalyses": 0,
    "oldAnalyses": 0,
    "orphanedStorage": 0,
    "totalStorageUsage": 5120000,
    "lastCleanup": null
  }
}
```

## Step 7: Test Analysis Creation

### 7.1 Run a New Analysis

1. Go to your frontend: `http://localhost:3000`
2. Run a new accessibility analysis
3. Check that it completes successfully

### 7.2 Verify New Data Structure

After the analysis completes, check the data:

```bash
curl "http://localhost:3005/api/analysis/recent?limit=1" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Expected Result**: The new analysis should have enhanced data structure with summaries.

## Step 8: Performance Verification

### 8.1 Dashboard Load Time

1. Go to dashboard: `http://localhost:3000/dashboard`
2. Measure load time (should be <500ms)
3. Check browser network tab for API response times

### 8.2 Compare Before/After

**Before Optimization**:
- Dashboard load: 2-5 seconds
- Storage cleanup: Manual
- User deletion: Leaves orphaned data

**After Optimization**:
- Dashboard load: 200-500ms
- Storage cleanup: Automatic
- User deletion: Complete cleanup

## Troubleshooting

### Migration Script Fails

**Issue**: SQL errors during migration
**Solution**: 
1. Check Supabase logs for specific error
2. Ensure you have proper permissions
3. Try running sections of the migration separately

### Storage Trigger Creation Fails

**Issue**: Permission denied for storage trigger
**Solution**:
1. Ensure you're using service role key
2. Try creating the trigger via Supabase Dashboard → Database → Functions
3. Contact Supabase support if permissions issue persists

### Backend Not Loading New Models

**Issue**: API endpoints return old data structure
**Solution**:
1. Restart Docker containers completely
2. Check container logs: `docker-compose -f docker-compose.dev.yml logs backend`
3. Verify new model files exist in container

### Materialized View Not Working

**Issue**: Dashboard stats return empty or old data
**Solution**:
```sql
-- Manually refresh the materialized view
REFRESH MATERIALIZED VIEW public.user_dashboard_stats;
```

### Test Endpoints Return 404

**Issue**: Database test endpoints not found
**Solution**:
1. Ensure you're in development mode (`NODE_ENV=development`)
2. Restart backend containers
3. Check that `database-test.js` route is loaded in server.js

## Verification Checklist

After completing all steps, verify:

- [ ] Migration script completed successfully
- [ ] Storage trigger created
- [ ] Backend containers restarted
- [ ] Materialized view exists and has data
- [ ] Dashboard loads faster
- [ ] CASCADE deletion test shows complete cleanup
- [ ] Storage tracking works
- [ ] New analyses create enhanced data structure
- [ ] All existing data preserved

## Success Criteria

✅ **Database Migration**: All new tables created, data migrated
✅ **Performance**: Dashboard 50% faster
✅ **Storage**: Automatic tracking and cleanup
✅ **Data Integrity**: All existing data preserved
✅ **Cleanup**: Complete user deletion works
✅ **Monitoring**: Test endpoints provide insights

## Next Steps After Testing

Once testing is successful:

1. **Schedule Daily Cleanup**: Set up automated cleanup job
2. **Monitor Performance**: Track query times and storage usage
3. **Production Deployment**: Apply same optimizations to production
4. **User Communication**: Inform users about improved performance

## Support

If you encounter issues:

1. **Check Logs**: `docker-compose -f docker-compose.dev.yml logs`
2. **Verify Database**: Check tables exist in Supabase Dashboard
3. **Test API**: Use curl commands to verify endpoints
4. **Rollback Option**: Restore from backup if needed

## Rollback Plan

If major issues occur:

1. **Stop containers**: `docker-compose -f docker-compose.dev.yml down`
2. **Restore database backup** (if you created one)
3. **Or remove new tables**:
   ```sql
   DROP TABLE IF EXISTS public.storage_objects CASCADE;
   DROP TABLE IF EXISTS public.analysis_violations CASCADE;
   DROP TABLE IF EXISTS public.analysis_screenshots CASCADE;
   DROP TABLE IF EXISTS public.analysis_summaries CASCADE;
   DROP TABLE IF EXISTS public.deletion_logs CASCADE;
   DROP MATERIALIZED VIEW IF EXISTS public.user_dashboard_stats;
   ```
4. **Restart containers**