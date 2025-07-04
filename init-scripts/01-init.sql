-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant necessary permissions to the user
GRANT ALL PRIVILEGES ON DATABASE sitecraft TO sitecraft_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO sitecraft_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO sitecraft_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO sitecraft_user;