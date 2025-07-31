-- =====================================================
-- MASTER DATABASE SETUP SCRIPT
-- =====================================================
-- This script orchestrates the complete database setup
-- by running all individual setup scripts in order
-- 
-- Usage: Run this script in Supabase SQL editor or psql
-- =====================================================

-- Header message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🚀 STARTING STREETWISEWEB DATABASE SETUP';
    RAISE NOTICE '';
    RAISE NOTICE 'This will create a complete database schema with:';
    RAISE NOTICE '- Core tables for users, projects, analyses';
    RAISE NOTICE '- Storage and media management tables';
    RAISE NOTICE '- Performance indexes and materialized views';
    RAISE NOTICE '- Database functions and triggers';
    RAISE NOTICE '- Row Level Security policies';
    RAISE NOTICE '- Proper permissions and grants';
    RAISE NOTICE '';
    RAISE NOTICE 'Starting setup process...';
    RAISE NOTICE '';
END $$;

-- Step 1: Cleanup existing schema (if needed)
DO $$
BEGIN
    RAISE NOTICE '📋 Step 1/10: Cleaning up existing schema...';
END $$;

\i 01_cleanup_existing.sql

-- Step 2: Create core tables
DO $$
BEGIN
    RAISE NOTICE '📋 Step 2/10: Creating core tables...';
END $$;

\i 02_core_tables.sql

-- Step 3: Create functions
DO $$
BEGIN
    RAISE NOTICE '📋 Step 3/10: Creating database functions...';
END $$;

\i 03_functions.sql

-- Step 4: Create indexes
DO $$
BEGIN
    RAISE NOTICE '📋 Step 4/10: Creating performance indexes...';
END $$;

\i 04_indexes.sql

-- Step 5: Create materialized views
DO $$
BEGIN
    RAISE NOTICE '📋 Step 5/10: Creating materialized views...';
END $$;

\i 05_materialized_views.sql

-- Step 6: Create triggers
DO $$
BEGIN
    RAISE NOTICE '📋 Step 6/10: Creating database triggers...';
END $$;

\i 06_triggers.sql

-- Step 7: Create RLS policies
DO $$
BEGIN
    RAISE NOTICE '📋 Step 7/10: Creating Row Level Security policies...';
END $$;

\i 07_rls_policies.sql

-- Step 8: Set permissions
DO $$
BEGIN
    RAISE NOTICE '📋 Step 8/10: Configuring permissions and grants...';
END $$;

\i 08_permissions.sql

-- Step 9: Validate setup
DO $$
BEGIN
    RAISE NOTICE '📋 Step 9/10: Validating database setup...';
END $$;

\i 09_validation.sql

-- Step 10: Insert initial data
DO $$
BEGIN
    RAISE NOTICE '📋 Step 10/10: Inserting initial configuration data...';
END $$;

\i 10_initial_data.sql

-- Final completion message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉🎉🎉 DATABASE SETUP COMPLETED SUCCESSFULLY! 🎉🎉🎉';
    RAISE NOTICE '';
    RAISE NOTICE 'Your StreetWiseWeb database is now ready for use.';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Update your application environment variables';
    RAISE NOTICE '2. Test the connection from your application';
    RAISE NOTICE '3. Run your application and verify functionality';
    RAISE NOTICE '';
    RAISE NOTICE 'For maintenance, you can run individual scripts as needed:';
    RAISE NOTICE '- 01_cleanup_existing.sql: Clean slate reset';
    RAISE NOTICE '- 02_core_tables.sql: Recreate tables only';
    RAISE NOTICE '- 05_materialized_views.sql: Refresh dashboard views';
    RAISE NOTICE '- 09_validation.sql: Verify schema integrity';
    RAISE NOTICE '';
    RAISE NOTICE 'Happy coding! 🚀';
    RAISE NOTICE '';
END $$;