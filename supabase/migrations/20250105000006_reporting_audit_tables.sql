-- Reporting and Audit Tables
-- Report generation and audit logging

-- Generated reports
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  generated_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  type report_type NOT NULL,
  public_url_key TEXT UNIQUE, -- A short key for sharing URLs
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit log for compliance and monitoring
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- e.g., 'user.login', 'analysis.created'
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_reports_analysis_id ON reports(analysis_id);
CREATE INDEX idx_reports_user_id ON reports(generated_by_user_id);
CREATE INDEX idx_reports_public_url_key ON reports(public_url_key);
CREATE INDEX idx_audit_log_workspace_id ON audit_log(workspace_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
