-- Auth Sync Functions and Triggers
-- Automatically sync Supabase auth users with our users table

-- Function to handle new user creation from auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_workspace_id UUID;
  workspace_name TEXT;
BEGIN
  -- Insert user record
  INSERT INTO public.users (id, email, full_name, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NOW()
  );
  
  -- Create personal workspace for the new user
  workspace_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)) || '''s Workspace';
  
  -- Use the existing function to create workspace with owner
  SELECT create_workspace_with_owner(NEW.id, workspace_name) INTO user_workspace_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user record when new auth user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to sync user email updates
CREATE OR REPLACE FUNCTION public.handle_user_email_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users 
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync email updates
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.handle_user_email_update();

-- Function to handle user deletion
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- The users table has CASCADE DELETE, so this is just for logging if needed
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: User deletion is handled by CASCADE DELETE on the foreign key