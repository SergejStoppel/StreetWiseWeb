# Database Issue Analysis: Detailed Report Hanging

## Issue Summary
Detailed reports fail to load with "Unable to load results" error, causing the frontend to timeout after 120 seconds while the backend hangs during screenshot capture processing.

## Root Cause Analysis

### 1. Missing Database Function: `find_cached_analysis`
**Problem:** The backend attempts to call `supabase.rpc('find_cached_analysis')` but this function doesn't exist in the database.

**Evidence:**
- Backend logs show: `error: find_cached_analysis function not found in database: Could not find the function public.find_cached_analysis`
- Function is defined in `database/setup/03_functions.sql` (lines 147-174) but not in `database/setup.sql`
- Investigation revealed user ran `database/setup.sql` instead of individual setup scripts

**Code Location:** `backend/routes/accessibility.js` line ~90-120 in `findCachedAnalysis()` function

### 2. Missing Database Table: `subscriptions`
**Problem:** ReportService tries to check user subscriptions to determine report access permissions, but the table doesn't exist.

**Evidence:**
- Backend logs show: `warn: Failed to check user subscriptions: relation "public.subscriptions" does not exist`
- ReportService.js line 132-146 attempts to query this table
- Table is referenced in code but not defined in any schema files

**Impact:** Permission checks fail, causing uncertainty about whether user should get detailed or free reports.

### 3. Screenshot Re-capture Logic Flaw
**Problem:** Even when cached analysis exists, the system re-runs screenshot capture, which hangs for cached requests.

**Evidence:**
- Backend logs show: "Running screenshot capture with already loaded page" even for cached analyses
- Lines 572-632 in `accessibility.js` run screenshot capture regardless of cache status
- Screenshots work fine for new analyses but hang for cached detailed report requests

**Technical Analysis:** When using cached analysis, there's no proper browser page context for screenshot capture, causing the process to hang indefinitely.

## How This Was Discovered

### Investigation Process:
1. **Initial Problem:** User reported detailed reports hanging with "Unable to load results"
2. **Log Analysis:** Examined backend logs showing function not found errors and hanging at screenshot capture
3. **Code Review:** Analyzed report generation flow and database interaction patterns
4. **Schema Comparison:** Compared different database setup files to identify missing components
5. **Git History Analysis:** Used `git diff` and `git show` to compare working vs current implementations
6. **Database Setup Investigation:** Discovered discrepancy between `setup.sql` and individual setup scripts

### Key Discovery:
The `find_cached_analysis` function exists in `database/setup/03_functions.sql` but not in `database/setup.sql`:
```bash
$ grep -n "find_cached_analysis" database/setup.sql database/setup/03_functions.sql
database/setup/03_functions.sql:147:CREATE OR REPLACE FUNCTION find_cached_analysis(
```

This proves that running `setup.sql` alone doesn't create all necessary database components.

## Immediate Fix Required

### Step 1: Add Missing Database Function
Run the contents of `database/setup/03_functions.sql` in Supabase SQL Editor to create:
- `find_cached_analysis()` function
- `log_report_access()` function
- Other utility functions

### Step 2: Create Missing Subscriptions Table
```sql
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('basic', 'premium')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);
```

### Step 3: Fix Screenshot Logic (Code Change)
Modify `backend/routes/accessibility.js` to skip screenshot capture for cached analyses:
```javascript
// Only capture screenshots if this is a new analysis, not cached
if (!cachedAnalysis && browser) {
  // Screenshot capture logic here
}
```

## Prevention Measures

### 1. Database Setup Documentation
- Update documentation to clarify that individual setup scripts (01-09) should be run, not just `setup.sql`
- Consider consolidating all setup scripts into a single comprehensive file

### 2. Environment-Specific Development Setup
- Implement automatic detailed report access for development environment
- Add database validation checks on application startup

### 3. Error Handling Improvements
- Add graceful fallbacks when database functions are missing
- Implement better error messages for missing database components

## Development vs Production Considerations

The system has development mode logic that should allow detailed reports for authenticated users, but this fails due to the missing database components. Once fixed, development users should automatically get detailed report access regardless of subscription status.

For production, the subscription table will properly control access to detailed reports based on user plans and active subscriptions.

## Confidence Level: High
This analysis is based on:
- Direct examination of error logs
- Code review of report generation flow
- Database schema comparison
- Git history analysis
- Understanding of the application's architecture

The root cause is definitively the missing database function that was not created during initial setup.