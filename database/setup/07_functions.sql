-- Database Functions
-- Utility functions for common operations

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to create a workspace and automatically add the owner as a member
CREATE OR REPLACE FUNCTION create_workspace_with_owner(
  owner_user_id UUID,
  workspace_name TEXT
) RETURNS UUID AS $$
DECLARE
  new_workspace_id UUID;
BEGIN
  -- Create the workspace
  INSERT INTO workspaces (owner_id, name)
  VALUES (owner_user_id, workspace_name)
  RETURNING id INTO new_workspace_id;
  
  -- Add the owner as a workspace member with owner role
  INSERT INTO workspace_members (workspace_id, user_id, role)
  VALUES (new_workspace_id, owner_user_id, 'owner');
  
  -- Initialize report credits balance
  INSERT INTO report_credits (workspace_id, balance)
  VALUES (new_workspace_id, 0);
  
  RETURN new_workspace_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has access to workspace
CREATE OR REPLACE FUNCTION user_has_workspace_access(
  user_uuid UUID,
  workspace_uuid UUID
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM workspace_members 
    WHERE user_id = user_uuid AND workspace_id = workspace_uuid
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get user's role in workspace
CREATE OR REPLACE FUNCTION get_user_workspace_role(
  user_uuid UUID,
  workspace_uuid UUID
) RETURNS workspace_role AS $$
DECLARE
  user_role workspace_role;
BEGIN
  SELECT role INTO user_role
  FROM workspace_members 
  WHERE user_id = user_uuid AND workspace_id = workspace_uuid;
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql;