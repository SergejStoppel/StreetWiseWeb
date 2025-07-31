# Database Setup Scripts

This directory contains PostgreSQL setup scripts for the SiteCraft v3 database. The scripts are designed to be run in sequence to set up a complete multi-tenant accessibility analysis platform.

## Script Execution Order

Run the scripts in the following order:

1. **01_extensions_and_types.sql** - PostgreSQL extensions and custom enum types
2. **02_core_tables.sql** - Users, workspaces, and websites (foundation entities)
3. **03_analysis_engine_tables.sql** - Analysis modules, rules, jobs, and screenshots
4. **04_issues_tables.sql** - Accessibility, SEO, and performance issue storage
5. **05_billing_tables.sql** - Subscription plans, billing, and credits
6. **06_reporting_audit_tables.sql** - Report generation and audit logging
7. **07_functions.sql** - Utility functions for common operations
8. **08_triggers.sql** - Automated actions and data integrity triggers
9. **09_rls_policies.sql** - Row Level Security policies for multi-tenancy

## Running the Scripts

### Option 1: Individual Scripts
```bash
psql -h localhost -U your_user -d your_database -f 01_extensions_and_types.sql
psql -h localhost -U your_user -d your_database -f 02_core_tables.sql
# ... continue for all scripts
```

### Option 2: All Scripts at Once
```bash
for script in database/setup/*.sql; do
  psql -h localhost -U your_user -d your_database -f "$script"
done
```

### Option 3: Using Supabase CLI
```bash
supabase db reset
# Then run each script through the Supabase dashboard SQL editor
```

## Key Features

- **Multi-tenant Architecture**: Complete workspace isolation with RLS policies
- **Modular Analysis Engine**: Separate modules for Accessibility, SEO, and Performance
- **Comprehensive Rules Engine**: Extensible rule system with compliance mapping
- **Billing Integration**: Subscription and one-time purchase support
- **Audit Logging**: Complete audit trail for compliance
- **Performance Optimized**: Proper indexing and query optimization

## Database Schema

The schema is based on `database\database_schema.dbml` and includes:

- Users and workspace management
- Website registration and analysis tracking
- Modular analysis engine with job queue support
- Granular issue tracking by category
- Billing and subscription management
- Report generation and sharing
- Comprehensive audit logging

## Security

- Row Level Security (RLS) enabled on all tables
- Multi-tenant data isolation
- Workspace-based access control
- Secure user authentication integration with Supabase Auth