# Fix for Dashboard Report Loading Issue

## Root Cause

The issue is a mismatch between how data is stored in the database and how the frontend expects to receive it.

### Backend Storage (routes/accessibility.js, lines 762-786):
```javascript
const { data: savedAnalysis, error } = await supabase
  .from('analyses')
  .insert({
    // ... other fields ...
    violations: report.violations || null,
    summary: report.summary || null,
    metadata: analysisDataForDb.metadata,
    screenshots: report.screenshot || null,
    seo_analysis: report.seo || null,
    ai_insights: report.aiInsights || null,
    // Note: NO analysis_data field!
  })
```

### Frontend Expectation (EnhancedResultsPage.js, line 230):
```javascript
const analysisData = response.data.analysis_data; // This will be undefined!
```

## Solution

There are two ways to fix this:

### Option 1: Fix the Backend (Recommended)

Modify the backend to also save the complete analysis data in the `analysis_data` column:

```javascript
// In backend/routes/accessibility.js, around line 762, modify the insert:
const { data: savedAnalysis, error } = await supabase
  .from('analyses')
  .insert({
    id: analysisId,
    user_id: analysisDataForDb.userId || null,
    url: analysisDataForDb.url,
    report_type: analysisDataForDb.reportType,
    overall_score: analysisDataForDb.overallScore,
    accessibility_score: analysisDataForDb.accessibilityScore,
    seo_score: analysisDataForDb.seoScore,
    performance_score: analysisDataForDb.performanceScore,
    
    // Add this line to store the complete analysis data:
    analysis_data: report, // <-- ADD THIS
    
    // Keep these for backward compatibility and faster queries:
    violations: report.violations || null,
    summary: report.summary || null,
    metadata: analysisDataForDb.metadata,
    screenshots: report.screenshot || null,
    seo_analysis: report.seo || null,
    ai_insights: report.aiInsights || null,
    status: analysisDataForDb.status,
    is_anonymous: analysisDataForDb.isAnonymous,
    cache_expires_at: analysisDataForDb.cacheExpiresAt,
    access_count: 1,
    last_accessed_at: new Date().toISOString()
  })
```

### Option 2: Fix the Frontend

Modify the frontend to reconstruct the analysis data from the separate fields:

```javascript
// In frontend/src/pages/EnhancedResultsPage.js, around line 227-236:
if (response.success && response.data) {
  // Reconstruct analysis data from separate fields
  let analysisData = response.data.analysis_data;
  
  // If analysis_data doesn't exist, reconstruct it from separate fields
  if (!analysisData && response.data.summary) {
    analysisData = {
      analysisId: response.data.id,
      url: response.data.url,
      reportType: response.data.report_type,
      timestamp: response.data.created_at,
      scores: {
        overall: response.data.overall_score || 0,
        accessibility: response.data.accessibility_score || 0,
        seo: response.data.seo_score || 0,
        performance: response.data.performance_score || 0
      },
      summary: response.data.summary,
      violations: response.data.violations || [],
      metadata: response.data.metadata || {},
      screenshot: response.data.screenshots,
      seo: response.data.seo_analysis,
      aiInsights: response.data.ai_insights,
      // Add other fields as needed
    };
  }
  
  if (!analysisData || typeof analysisData !== 'object') {
    console.error('❌ Analysis data is null or invalid:', analysisData);
    setError('This analysis does not have detailed results available. Please run a new analysis.');
    return;
  }
  
  // Continue with the rest of the code...
}
```

## Immediate Fix

For existing data that doesn't have the `analysis_data` field, you can run a migration script to populate it:

```sql
-- SQL to update existing records
UPDATE analyses
SET analysis_data = jsonb_build_object(
  'analysisId', id,
  'url', url,
  'reportType', report_type,
  'timestamp', created_at,
  'scores', jsonb_build_object(
    'overall', overall_score,
    'accessibility', accessibility_score,
    'seo', seo_score,
    'performance', performance_score
  ),
  'summary', summary,
  'violations', violations,
  'metadata', metadata,
  'screenshot', screenshots,
  'seo', seo_analysis,
  'aiInsights', ai_insights
)
WHERE analysis_data IS NULL;
```

## Testing

After implementing the fix:

1. Run a new analysis to ensure new data is saved correctly
2. Test loading existing analyses from the dashboard
3. Check both authenticated and anonymous user flows
4. Verify all report data displays correctly