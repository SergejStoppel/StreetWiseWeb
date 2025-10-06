-- Analysis Engine Tables
-- Core analysis execution, rules engine, and compliance standards

-- Analysis modules (Accessibility, SEO, Performance)
CREATE TABLE analysis_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL, -- e.g., 'Accessibility', 'SEO', 'Performance'
  description TEXT
);

-- Rules that define what to check
CREATE TABLE rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES analysis_modules(id) ON DELETE CASCADE,
  rule_key TEXT UNIQUE NOT NULL, -- e.g., 'WCAG_1_4_3_CONTRAST'
  name TEXT NOT NULL, -- e.g., 'Color Contrast Minimum'
  description TEXT, -- Explains what the rule checks
  default_severity issue_severity NOT NULL
);

-- Compliance standards mapping
CREATE TABLE compliance_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL -- e.g., 'WCAG 2.1 AA', 'Section 508'
);

-- Many-to-many mapping between standards and rules
CREATE TABLE standard_rules_mapping (
  standard_id UUID REFERENCES compliance_standards(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES rules(id) ON DELETE CASCADE,
  PRIMARY KEY (standard_id, rule_id)
);

-- Main analysis records
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status analysis_status NOT NULL DEFAULT 'pending',
  overall_score INT,
  accessibility_score INT,
  seo_score INT,
  performance_score INT,
  -- Core Web Vitals metrics
  lcp_value DECIMAL(8,3), -- Largest Contentful Paint in seconds
  cls_value DECIMAL(8,3), -- Cumulative Layout Shift (unitless)
  tbt_value DECIMAL(8,3), -- Total Blocking Time in milliseconds  
  fcp_value DECIMAL(8,3), -- First Contentful Paint in seconds
  performance_data JSONB, -- Full Lighthouse report data
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Individual job tracking for each analysis module
CREATE TABLE analysis_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES analysis_modules(id) ON DELETE RESTRICT,
  status job_status NOT NULL DEFAULT 'pending',
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Screenshots captured during analysis
CREATE TABLE screenshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  type screenshot_type NOT NULL,
  storage_bucket TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_rules_module_id ON rules(module_id);
CREATE INDEX idx_rules_rule_key ON rules(rule_key);
CREATE INDEX idx_analyses_website_id ON analyses(website_id);
CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_status ON analyses(status);
CREATE INDEX idx_analyses_lcp_value ON analyses(lcp_value);
CREATE INDEX idx_analyses_cls_value ON analyses(cls_value);
CREATE INDEX idx_analyses_tbt_value ON analyses(tbt_value);
CREATE INDEX idx_analysis_jobs_analysis_id ON analysis_jobs(analysis_id);
CREATE INDEX idx_analysis_jobs_status ON analysis_jobs(status);
CREATE INDEX idx_screenshots_analysis_id ON screenshots(analysis_id);