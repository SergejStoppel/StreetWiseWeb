# Database Setup Scripts

This directory contains modular database setup scripts for the StreetWiseWeb application. The scripts are designed to be run in sequence to create a complete PostgreSQL/Supabase database schema.

## Quick Start

### Option 1: Run Master Setup (Recommended)
```sql
-- In Supabase SQL Editor or psql, run:
\i 00_master_setup.sql
```

This will automatically run all setup scripts in the correct order.

### Option 2: Manual Step-by-Step Setup
Run the scripts in numerical order:

```bash
01_cleanup_existing.sql   # Clean existing schema (optional)
02_core_tables.sql        # Create all tables
03_functions.sql          # Create database functions
04_indexes.sql           # Create performance indexes
05_materialized_views.sql # Create dashboard views
06_triggers.sql          # Create triggers
07_rls_policies.sql      # Set up Row Level Security
08_permissions.sql       # Configure permissions
09_validation.sql        # Validate setup
```

## Script Descriptions

### 00_master_setup.sql
Orchestrates the entire setup process by running all scripts in sequence. Provides progress updates and final status report.

### 01_cleanup_existing.sql
- Safely removes existing database objects
- Use this for clean slate deployments
- Handles dependency order when dropping objects
- Safe to run even if objects don't exist

### 02_core_tables.sql
- Creates all application tables:
  - `user_profiles` - User account data
  - `projects` - Project organization
  - `analyses` - Website analysis results
  - `storage_objects` - File storage tracking
  - `analysis_screenshots` - Screenshot management
  - `analysis_violations` - Accessibility violations
  - `analysis_summaries` - Pre-computed dashboard data
  - `usage_logs` - Usage tracking
  - `team_members` - Collaboration features
  - `deletion_logs` - Audit trail

### 03_functions.sql
- `update_updated_at_column()` - Auto-update timestamps
- `handle_new_user()` - Create user profiles on signup
- `cleanup_user_data_before_delete()` - User deletion cleanup
- `cleanup_anonymous_analyses()` - Remove old anonymous data
- `cleanup_orphaned_storage()` - Clean orphaned files
- `cleanup_expired_analyses()` - Remove expired cache
- `refresh_dashboard_stats()` - Update materialized views
- `daily_cleanup()` - Orchestrated cleanup routine

### 04_indexes.sql
Creates performance indexes for:
- User profile lookups
- Project queries
- Analysis searches (most critical)
- Storage object management
- Dashboard aggregations
- Team collaboration queries

### 05_materialized_views.sql
- `user_dashboard_stats` - Pre-computed user statistics
- Includes unique index for fast updates
- Optimizes dashboard performance

### 06_triggers.sql
- Auto-update `updated_at` timestamps
- User profile creation on auth signup
- User deletion cleanup triggers
- Handles Supabase auth integration

### 07_rls_policies.sql
Row Level Security policies ensuring:
- Users can only access their own data
- Team members can access shared projects
- Anonymous analyses are publicly readable
- Proper access control for all tables

### 08_permissions.sql
- Grants for authenticated users
- Limited anonymous access for public analyses
- Service role permissions for scheduled tasks
- Function execution permissions

### 09_validation.sql
- Verifies all tables were created
- Checks for required functions
- Validates materialized views
- Tests basic functionality
- Provides comprehensive status report

## Usage Scenarios

### New Installation
```sql
\i 00_master_setup.sql
```

### Clean Reinstallation
```sql
\i 01_cleanup_existing.sql
\i 00_master_setup.sql
```

### Update Existing Schema
Run individual scripts as needed:
```sql
-- Add new indexes
\i 04_indexes.sql

-- Update materialized views
\i 05_materialized_views.sql

-- Refresh permissions
\i 08_permissions.sql
```

### Development Reset
```sql
\i 01_cleanup_existing.sql
\i 02_core_tables.sql
\i 03_functions.sql
-- ... continue as needed
```

## Maintenance

### Regular Tasks
- Run `SELECT daily_cleanup();` for automated maintenance
- Refresh materialized views: `SELECT refresh_dashboard_stats();`
- Monitor disk usage and run cleanup functions as needed

### Troubleshooting
- Check script execution with `09_validation.sql`
- Review PostgreSQL logs for detailed error messages
- Ensure proper Supabase permissions for schema operations

## Environment Compatibility

These scripts are designed for:
- PostgreSQL 13+
- Supabase hosted PostgreSQL
- Local PostgreSQL with uuid-ossp extension

## Security Notes

- All tables have Row Level Security enabled
- Policies restrict access to authorized users only
- Anonymous access is limited to public analyses
- Sensitive operations require authentication

## Support

For issues with database setup:
1. Run `09_validation.sql` to check current state
2. Review error messages in PostgreSQL logs
3. Check Supabase dashboard for permission issues
4. Verify environment configuration matches expectations