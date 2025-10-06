-- Issues Tables
-- Granular results for accessibility, SEO, and performance issues

-- Accessibility issues found during analysis
CREATE TABLE accessibility_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_job_id UUID NOT NULL REFERENCES analysis_jobs(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES rules(id) ON DELETE RESTRICT,
  severity issue_severity NOT NULL,
  location_path TEXT, -- CSS selector (e.g., "button#submit", "input[name='email']")
  code_snippet TEXT, -- The problematic HTML code
  dom_path TEXT, -- DOM hierarchy path (e.g., "html > body > main > form > input")
  wcag_criteria TEXT, -- WCAG criteria references (e.g., "1.3.1, 2.4.6")
  message TEXT, -- Specific message for this instance
  fix_suggestion TEXT, -- Detailed explanation with code examples
  screenshot_highlight JSONB, -- { screenshot_id, x, y, width, height }
  created_at TIMESTAMPTZ DEFAULT now()
);

-- SEO issues found during analysis
CREATE TABLE seo_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_job_id UUID NOT NULL REFERENCES analysis_jobs(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES rules(id) ON DELETE RESTRICT,
  severity issue_severity NOT NULL,
  location_path TEXT,
  code_snippet TEXT,
  message TEXT,
  fix_suggestion TEXT,
  screenshot_highlight JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Performance issues found during analysis
CREATE TABLE performance_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_job_id UUID NOT NULL REFERENCES analysis_jobs(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES rules(id) ON DELETE RESTRICT,
  severity issue_severity NOT NULL,
  location_path TEXT,
  code_snippet TEXT,
  message TEXT,
  fix_suggestion TEXT,
  screenshot_highlight JSONB,
  -- Performance-specific columns
  metric_value DECIMAL(10,3), -- Numeric metric value (LCP, CLS, etc.)
  improvement_potential TEXT, -- Estimated improvement (e.g., "Save 2.5s", "Reduce by 0.15")
  resource_url TEXT, -- URL of problematic resource (for images, JS, CSS)
  savings_bytes INTEGER, -- Potential bytes saved
  savings_ms INTEGER, -- Potential milliseconds saved
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_accessibility_issues_job_id ON accessibility_issues(analysis_job_id);
CREATE INDEX idx_accessibility_issues_rule_id ON accessibility_issues(rule_id);
CREATE INDEX idx_accessibility_issues_severity ON accessibility_issues(severity);

CREATE INDEX idx_seo_issues_job_id ON seo_issues(analysis_job_id);
CREATE INDEX idx_seo_issues_rule_id ON seo_issues(rule_id);
CREATE INDEX idx_seo_issues_severity ON seo_issues(severity);

CREATE INDEX idx_performance_issues_job_id ON performance_issues(analysis_job_id);
CREATE INDEX idx_performance_issues_rule_id ON performance_issues(rule_id);
CREATE INDEX idx_performance_issues_severity ON performance_issues(severity);
CREATE INDEX idx_performance_issues_metric_value ON performance_issues(metric_value);
CREATE INDEX idx_performance_issues_resource_url ON performance_issues(resource_url);