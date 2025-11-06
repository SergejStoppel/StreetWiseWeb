-- Row Level Security (RLS) Policies
-- Multi-tenant security policies to ensure data isolation

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessibility_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_time_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Workspace access policies
CREATE POLICY "Workspace members can view workspace" ON workspaces
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = workspaces.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can update workspace" ON workspaces
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can create workspaces" ON workspaces
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Workspace members policies
CREATE POLICY "Workspace members can view members" ON workspace_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm2
      WHERE wm2.workspace_id = workspace_members.workspace_id
      AND wm2.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners and admins can manage members" ON workspace_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm2
      WHERE wm2.workspace_id = workspace_members.workspace_id
      AND wm2.user_id = auth.uid()
      AND wm2.role IN ('owner', 'admin')
    )
  );

-- Website policies
CREATE POLICY "Workspace members can view websites" ON websites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = websites.workspace_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can manage websites" ON websites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = websites.workspace_id AND user_id = auth.uid()
    )
  );

-- Analysis policies
CREATE POLICY "Workspace members can view analyses" ON analyses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM websites w
      JOIN workspace_members wm ON w.workspace_id = wm.workspace_id
      WHERE w.id = analyses.website_id AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can create analyses" ON analyses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM websites w
      JOIN workspace_members wm ON w.workspace_id = wm.workspace_id
      WHERE w.id = website_id AND wm.user_id = auth.uid()
    )
  );

-- Analysis jobs policies
CREATE POLICY "Workspace members can view analysis jobs" ON analysis_jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM analyses a
      JOIN websites w ON a.website_id = w.id
      JOIN workspace_members wm ON w.workspace_id = wm.workspace_id
      WHERE a.id = analysis_jobs.analysis_id AND wm.user_id = auth.uid()
    )
  );

-- Screenshot policies
CREATE POLICY "Workspace members can view screenshots" ON screenshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM analyses a
      JOIN websites w ON a.website_id = w.id
      JOIN workspace_members wm ON w.workspace_id = wm.workspace_id
      WHERE a.id = screenshots.analysis_id AND wm.user_id = auth.uid()
    )
  );

-- Issues policies (accessibility, seo, performance)
CREATE POLICY "Workspace members can view accessibility issues" ON accessibility_issues
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM analysis_jobs aj
      JOIN analyses a ON aj.analysis_id = a.id
      JOIN websites w ON a.website_id = w.id
      JOIN workspace_members wm ON w.workspace_id = wm.workspace_id
      WHERE aj.id = accessibility_issues.analysis_job_id AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can view seo issues" ON seo_issues
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM analysis_jobs aj
      JOIN analyses a ON aj.analysis_id = a.id
      JOIN websites w ON a.website_id = w.id
      JOIN workspace_members wm ON w.workspace_id = wm.workspace_id
      WHERE aj.id = seo_issues.analysis_job_id AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can view performance issues" ON performance_issues
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM analysis_jobs aj
      JOIN analyses a ON aj.analysis_id = a.id
      JOIN websites w ON a.website_id = w.id
      JOIN workspace_members wm ON w.workspace_id = wm.workspace_id
      WHERE aj.id = performance_issues.analysis_job_id AND wm.user_id = auth.uid()
    )
  );

-- Billing policies
CREATE POLICY "Workspace members can view subscription" ON subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = subscriptions.workspace_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can manage subscription" ON subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = subscriptions.workspace_id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );

CREATE POLICY "Workspace members can view purchases" ON one_time_purchases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = one_time_purchases.workspace_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can view report credits" ON report_credits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = report_credits.workspace_id AND user_id = auth.uid()
    )
  );

-- Reports policies
CREATE POLICY "Workspace members can view reports" ON reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM analyses a
      JOIN websites w ON a.website_id = w.id
      JOIN workspace_members wm ON w.workspace_id = wm.workspace_id
      WHERE a.id = reports.analysis_id AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can create reports" ON reports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM analyses a
      JOIN websites w ON a.website_id = w.id
      JOIN workspace_members wm ON w.workspace_id = wm.workspace_id
      WHERE a.id = analysis_id AND wm.user_id = auth.uid()
    )
  );

-- Audit log policies
CREATE POLICY "Workspace members can view audit log" ON audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = audit_log.workspace_id AND user_id = auth.uid()
    )
  );
