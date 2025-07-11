# MVP Implementation Roadmap

## Week 1-2: Core Features

### 1. Multi-Page Crawler
```javascript
// New file: services/analysis/SiteCrawler.js
class SiteCrawler {
  async crawlSite(startUrl, options = {}) {
    const maxPages = options.maxPages || 50;
    const sameDomain = options.sameDomain !== false;
    
    // Use existing browser utils
    // Implement breadth-first crawling
    // Return array of URLs to analyze
  }
}
```

### 2. Batch Analysis Orchestrator
```javascript
// Update: services/accessibilityAnalyzer.js
async analyzeSite(startUrl, options = {}) {
  // 1. Crawl site to get URLs
  const urls = await this.crawler.crawlSite(startUrl, options);
  
  // 2. Analyze each URL (with progress callback)
  const results = [];
  for (const url of urls) {
    const pageResult = await this.analyzeWebsite(url);
    results.push(pageResult);
    
    if (options.onProgress) {
      options.onProgress({ current: results.length, total: urls.length });
    }
  }
  
  // 3. Aggregate results
  return this.aggregateResults(results);
}
```

### 3. Results Aggregation
```javascript
// New: services/analysis/ResultsAggregator.js
class ResultsAggregator {
  aggregateResults(pageResults) {
    return {
      summary: {
        pagesAnalyzed: pageResults.length,
        overallScore: this.calculateAverageScore(pageResults),
        totalIssues: this.sumIssues(pageResults),
        commonIssues: this.findCommonIssues(pageResults),
        // ... more aggregated metrics
      },
      byPage: pageResults,
      crossPageIssues: this.findCrossPageIssues(pageResults)
    };
  }
}
```

### 4. Database Schema for Persistence
```sql
-- Analysis history
CREATE TABLE analysis_history (
  id UUID PRIMARY KEY,
  url VARCHAR(2048),
  analyzed_at TIMESTAMP,
  overall_score INT,
  page_count INT,
  report_data JSONB,
  user_id UUID
);

-- Issue tracking
CREATE TABLE accessibility_issues (
  id UUID PRIMARY KEY,
  analysis_id UUID REFERENCES analysis_history(id),
  issue_type VARCHAR(100),
  severity VARCHAR(20),
  status VARCHAR(20) DEFAULT 'open',
  page_url VARCHAR(2048)
);
```

### 5. Enhanced Remediation Guidance
```javascript
// New: services/analysis/RemediationEngine.js
class RemediationEngine {
  generateGuidance(violations) {
    return violations.map(violation => ({
      ...violation,
      remediation: {
        codeExample: this.getCodeExample(violation),
        estimatedEffort: this.estimateEffort(violation),
        businessImpact: this.calculateImpact(violation),
        priority: this.calculatePriority(violation)
      }
    }));
  }
}
```

## Week 3-4: Premium Features

### 1. Monitoring Service
```javascript
// New: services/monitoring/AccessibilityMonitor.js
class AccessibilityMonitor {
  async scheduleAnalysis(siteConfig) {
    // Use node-cron or similar
    // Store results and compare with previous
    // Send alerts on regression
  }
}
```

### 2. Compliance Tracking
```javascript
// New: services/compliance/ComplianceTracker.js
class ComplianceTracker {
  trackProgress(currentAnalysis, previousAnalyses) {
    return {
      trend: this.calculateTrend(currentAnalysis, previousAnalyses),
      complianceLevel: this.determineComplianceLevel(currentAnalysis),
      improvementAreas: this.identifyImprovements(currentAnalysis, previousAnalyses),
      regressions: this.identifyRegressions(currentAnalysis, previousAnalyses)
    };
  }
}
```

### 3. API Endpoints
```javascript
// Update: routes/accessibility.js
router.post('/analyze-site', authenticateUser, async (req, res) => {
  const { url, options } = req.body;
  const analysis = await analyzer.analyzeSite(url, {
    ...options,
    maxPages: getUserPageLimit(req.user),
    onProgress: (progress) => {
      // Send SSE or WebSocket updates
    }
  });
  
  // Save to database
  await saveAnalysis(analysis, req.user.id);
  
  res.json(analysis);
});

router.get('/analysis-history', authenticateUser, async (req, res) => {
  const history = await getAnalysisHistory(req.user.id);
  res.json(history);
});
```

## Quick Wins for Immediate Value

1. **Fix Snippets Library**
   - Create a library of common accessibility fixes
   - Map to specific violation types
   - Show inline in reports

2. **Issue Prioritization Algorithm**
   ```javascript
   calculatePriority(issue) {
     const impactScore = { critical: 4, serious: 3, moderate: 2, minor: 1 };
     const effortScore = { low: 1, medium: 2, high: 3 };
     
     return {
       score: impactScore[issue.impact] / effortScore[issue.effort],
       recommendation: this.getPriorityRecommendation(score)
     };
   }
   ```

3. **Simple Compliance Badge**
   - Generate embeddable compliance badge
   - Shows current score and date
   - Links to full report

## MVP Success Metrics

- **Technical**: 
  - Analyze 50 pages in < 5 minutes
  - 99% uptime for monitoring
  
- **Business**:
  - 10% free-to-paid conversion
  - $5k MRR within 3 months
  - 50+ active paid users

## Next Steps After MVP

1. VPAT/ACR report generation
2. Advanced monitoring with CI/CD integration  
3. Team collaboration features
4. Industry-specific compliance modules