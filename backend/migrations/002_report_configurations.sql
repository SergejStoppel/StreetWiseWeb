-- Migration: Add report configurations and access logging
-- Description: Creates tables for managing different report types and tracking access

-- Report configurations table
CREATE TABLE IF NOT EXISTS report_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_type TEXT NOT NULL CHECK (report_type IN ('free', 'detailed')),
  included_features JSONB NOT NULL DEFAULT '{}',
  max_issues_shown INTEGER,
  includes_ai_insights BOOLEAN DEFAULT false,
  includes_code_snippets BOOLEAN DEFAULT false,
  includes_remediation_steps BOOLEAN DEFAULT false,
  includes_full_screenshots BOOLEAN DEFAULT false,
  includes_seo_analysis BOOLEAN DEFAULT false,
  watermark_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Report access logs for auditing and analytics
CREATE TABLE IF NOT EXISTS report_access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  access_type TEXT NOT NULL CHECK (access_type IN ('view', 'download', 'share', 'generate')),
  report_type TEXT CHECK (report_type IN ('free', 'detailed')),
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default report configurations
INSERT INTO report_configurations (report_type, included_features, max_issues_shown, includes_ai_insights, includes_code_snippets, includes_remediation_steps, includes_full_screenshots, includes_seo_analysis, watermark_enabled)
VALUES 
  ('free', 
   '{
     "accessibility": {
       "show_top_issues": true,
       "max_issues": 3,
       "show_summary_only": true,
       "show_wcag_references": false
     },
     "seo": {
       "show_top_issue": true,
       "max_issues": 1,
       "show_basic_recommendation": true
     },
     "screenshots": {
       "show_main_only": true,
       "max_resolution": "thumbnail"
     }
   }'::jsonb,
   3,
   false,
   false,
   false,
   false,
   false,
   true
  ),
  ('detailed',
   '{
     "accessibility": {
       "show_all_issues": true,
       "show_wcag_details": true,
       "show_affected_elements": true,
       "show_disability_impact": true
     },
     "seo": {
       "show_all_recommendations": true,
       "show_technical_seo": true,
       "show_ai_suggestions": true
     },
     "screenshots": {
       "show_desktop_mobile": true,
       "show_full_page": true,
       "high_resolution": true
     },
     "ai_insights": {
       "enabled": true,
       "show_remediation_priority": true,
       "show_business_impact": true
     }
   }'::jsonb,
   NULL, -- No limit for detailed reports
   true,
   true,
   true,
   true,
   true,
   false
  );

-- Create indexes for performance
CREATE INDEX idx_report_access_logs_analysis_id ON report_access_logs(analysis_id);
CREATE INDEX idx_report_access_logs_user_id ON report_access_logs(user_id);
CREATE INDEX idx_report_access_logs_created_at ON report_access_logs(created_at);
CREATE INDEX idx_report_access_logs_access_type ON report_access_logs(access_type);

-- Enable RLS
ALTER TABLE report_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_access_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for report_configurations (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view report configurations"
  ON report_configurations
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for report_access_logs
CREATE POLICY "Users can view their own report access logs"
  ON report_access_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert report access logs"
  ON report_access_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add updated_at trigger for report_configurations
CREATE TRIGGER update_report_configurations_updated_at
  BEFORE UPDATE ON report_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add function to log report access
CREATE OR REPLACE FUNCTION log_report_access(
  p_analysis_id UUID,
  p_user_id UUID,
  p_access_type TEXT,
  p_report_type TEXT,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO report_access_logs (
    analysis_id,
    user_id,
    access_type,
    report_type,
    ip_address,
    user_agent,
    referrer,
    session_id
  )
  VALUES (
    p_analysis_id,
    p_user_id,
    p_access_type,
    p_report_type,
    p_ip_address,
    p_user_agent,
    p_referrer,
    p_session_id
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION log_report_access TO authenticated;
GRANT EXECUTE ON FUNCTION log_report_access TO anon;