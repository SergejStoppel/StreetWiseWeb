-- Database Triggers
-- Automated actions and data integrity

-- Trigger to automatically update updated_at on workspaces
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update updated_at on websites
CREATE TRIGGER update_websites_updated_at
  BEFORE UPDATE ON websites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update updated_at on subscriptions
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update updated_at on report_credits
CREATE TRIGGER update_report_credits_updated_at
  BEFORE UPDATE ON report_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
