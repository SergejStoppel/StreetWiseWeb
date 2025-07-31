# Three-Tier Analysis Pipeline Design

## Overview

The Three-Tier Analysis Pipeline is a sophisticated architecture designed to optimize website analysis by separating concerns into three distinct layers: orchestration, content extraction, and specialized analysis. This design ensures efficiency, consistency, and scalability while maintaining proper multi-tenant isolation.

## Architecture Tiers

### Tier 1: The Master Worker (Orchestrator)
**Responsibility:** Orchestrates the entire analysis process and manages job dependencies.

**Key Functions:**
- Receives analysis requests from the API with workspace context
- Creates analysis record in database with initial status
- Enqueues the Fetcher Worker job
- Monitors Fetcher Worker completion
- Upon success, enqueues all Analyzer Workers in parallel
- Updates analysis status throughout the process
- Handles failure scenarios and cleanup

### Tier 2: The Fetcher Worker (Content Extractor)
**Responsibility:** One-time content extraction and asset storage for all subsequent analyzers.

**Key Functions:**
- Launches single Puppeteer instance
- Navigates to target URL with appropriate viewport settings
- Extracts and stores:
  - Fully rendered HTML DOM
  - All CSS stylesheets (inline and external)
  - JavaScript files (for security analysis)
  - robots.txt and sitemap.xml
  - Desktop screenshot (1920x1080)
  - Mobile screenshot (375x667)
  - Tablet screenshot (768x1024)
  - Full-page screenshot
- Saves all assets to workspace-scoped storage: `/analysis-assets/{workspace_id}/{analysis_id}/`
- Creates screenshot records in database
- Reports completion/failure to Master Worker

### Tier 3: The Analyzer Workers (Specialists)
**Responsibility:** Perform specific analysis tasks using pre-fetched content.

**Worker Types:**
1. **Accessibility Workers:**
   - Color Contrast Analyzer
   - ARIA Analyzer
   - Form Analyzer
   - Keyboard Navigation Analyzer
   - Alt Text Analyzer

2. **SEO Workers:**
   - Technical SEO Analyzer
   - On-Page SEO Analyzer
   - Meta Tags Analyzer
   - Structured Data Analyzer

3. **Performance Workers:**
   - Image Optimization Analyzer
   - Core Web Vitals Analyzer
   - Resource Loading Analyzer

4. **AI Summary Worker:**
   - Generates executive summaries
   - Creates actionable recommendations

## Benefits

### 1. **Efficiency**
- **90% reduction** in network requests (1 fetch vs 10+ fetches)
- **Reduced Puppeteer overhead** - single browser instance vs multiple
- **Parallel processing** - all analyzers run simultaneously after fetch
- **Resource optimization** - no duplicate DOM parsing

### 2. **Consistency**
- All analyzers work on **identical DOM state**
- No timing variations between different analyzer runs
- Reproducible results for debugging
- Consistent screenshot timing

### 3. **Scalability**
- Independent scaling of fetcher vs analyzer workers
- Queue-based architecture allows horizontal scaling
- Efficient resource utilization
- Better failure isolation

### 4. **Debugging & Compliance**
- Preserved assets enable issue reproduction
- Audit trail of exact content analyzed
- Evidence for compliance reporting
- Historical analysis comparison

## Implementation Details

### Storage Structure
```
/analysis-assets/
  /{workspace_id}/
    /{analysis_id}/
      /html/
        - index.html (rendered DOM)
      /css/
        - styles-1.css
        - styles-2.css
        - inline-styles.css
      /js/
        - script-1.js
        - script-2.js
      /screenshots/
        - desktop.jpg
        - mobile.jpg
        - tablet.jpg
        - full-page.jpg
      /meta/
        - robots.txt
        - sitemap.xml
        - metadata.json
```

### Job Data Flow
```typescript
// Master Worker enqueues Fetcher
await fetcherQueue.add('fetch-website', {
  analysisId: 'uuid',
  workspaceId: 'uuid',
  websiteId: 'uuid',
  url: 'https://example.com',
  userId: 'uuid'
});

// Fetcher completes and notifies Master
await masterQueue.add('fetcher-complete', {
  analysisId: 'uuid',
  workspaceId: 'uuid',
  assetPath: '/analysis-assets/{workspace_id}/{analysis_id}/',
  success: true
});

// Master enqueues all Analyzers
const analyzerJobs = [
  { queue: 'accessibility-color', type: 'analyze-color-contrast' },
  { queue: 'accessibility-aria', type: 'analyze-aria' },
  { queue: 'seo-technical', type: 'analyze-technical-seo' },
  // ... more analyzers
];

for (const job of analyzerJobs) {
  await queues[job.queue].add(job.type, {
    analysisId: 'uuid',
    workspaceId: 'uuid',
    assetPath: '/analysis-assets/{workspace_id}/{analysis_id}/',
    websiteId: 'uuid'
  });
}
```

### Multi-Tenant Considerations

1. **Workspace Isolation:**
   - All storage paths include workspace_id
   - RLS policies enforce data access boundaries
   - Job queues validate workspace ownership

2. **Resource Quotas:**
   - Per-workspace concurrent analysis limits
   - Storage quotas based on plan
   - Fair queuing algorithm

3. **Access Control:**
   - Signed URLs for asset access
   - Workspace membership validation
   - Audit logging for all operations

### Error Handling

1. **Fetcher Failures:**
   - Retry with exponential backoff (3 attempts)
   - Capture error screenshots
   - Graceful degradation for partial content

2. **Analyzer Failures:**
   - Individual analyzer failures don't block others
   - Failed analyzers marked in analysis report
   - Option to retry individual analyzers

3. **Cleanup:**
   - Assets deleted after retention period (7-90 days based on plan)
   - Failed analysis cleanup after 24 hours
   - Orphaned assets detection and removal

## Performance Metrics

### Expected Improvements:
- **Analysis Time:** 40% faster overall completion
- **Resource Usage:** 60% reduction in CPU/memory
- **Network Traffic:** 90% reduction in external requests
- **Storage Efficiency:** 30% reduction through deduplication

### Monitoring:
- Queue depth per analyzer type
- Fetcher success rate
- Average analysis completion time
- Storage usage per workspace
- Cache hit rates

## Future Enhancements

1. **Content Diffing:** Compare analyses over time
2. **Incremental Analysis:** Only re-analyze changed portions
3. **Smart Caching:** Cache immutable assets across analyses
4. **Regional Fetchers:** Geographically distributed fetching
5. **Browser Pool:** Pre-warmed browser instances