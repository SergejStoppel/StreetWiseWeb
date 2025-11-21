# Database Migrations

This directory contains standalone SQL migration scripts that can be run directly on your database.

## Available Migrations

### add_onpage_seo_rules.sql

**Purpose:** Adds 14 new SEO rules for the On-Page SEO worker

**Created:** 2025-11-20

**Rules Added:**
1. `SEO_CON_06_META_DESC_NO_CTA` - Meta description call-to-action check
2. `SEO_CON_09_H1_TITLE_MISMATCH` - H1/Title alignment
3. `SEO_CON_10_HEADING_HIERARCHY` - Heading hierarchy validation
4. `SEO_CON_11_CONTENT_TOO_LONG` - Long content warning
5. `SEO_CON_12_PARAGRAPH_LENGTH` - Paragraph length check
6. `SEO_CON_13_EMPTY_LINKS` - Empty/placeholder links
7. `SEO_CON_14_GENERIC_LINK_TEXT` - Generic anchor text
8. `SEO_CON_15_IMAGE_ALT_MISSING` - Missing alt text (SEO)
9. `SEO_CON_16_IMAGE_ALT_EMPTY` - Empty alt text
10. `SEO_CON_17_IMAGE_ALT_SHORT` - Short alt text
11. `SEO_CON_18_URL_TOO_LONG` - Long URLs
12. `SEO_CON_19_URL_SESSION_ID` - Session IDs in URLs
13. `SEO_CON_20_URL_UNDERSCORES` - Underscores in URLs
14. `SEO_CON_21_URL_UPPERCASE` - Uppercase in URLs

---

## How to Apply Migrations

### Option 1: Via Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste Migration**
   - Open `add_onpage_seo_rules.sql`
   - Copy the entire contents
   - Paste into the SQL Editor

4. **Run the Migration**
   - Click "Run" or press Ctrl+Enter
   - Wait for execution to complete

5. **Verify Success**
   - Check the output logs for success messages
   - You should see: "Migration Complete! New rules added: 14"
   - Run verification query:
     ```sql
     SELECT rule_key, name, default_severity
     FROM rules
     WHERE rule_key LIKE 'SEO_CON_%'
     ORDER BY rule_key;
     ```

---

### Option 2: Via Supabase CLI

1. **Ensure Supabase CLI is installed**
   ```bash
   npm install -g supabase
   ```

2. **Link to your project** (if not already linked)
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. **Create a new migration** (copy the content)
   ```bash
   supabase migration new add_onpage_seo_rules
   # Copy the contents from database/migrations/add_onpage_seo_rules.sql
   # into the newly created file in supabase/migrations/
   ```

4. **Push the migration**
   ```bash
   supabase db push
   ```

---

### Option 3: Direct psql Connection

If you have direct PostgreSQL access:

```bash
# Connect to your database
psql "postgresql://user:password@host:port/database"

# Run the migration file
\i /path/to/StreetWiseWeb/database/migrations/add_onpage_seo_rules.sql
```

---

## Migration Safety Features

All migrations in this directory include:

1. **Idempotency Checks**
   - Each rule is checked before insertion
   - Re-running the migration won't create duplicates
   - Safe to run multiple times

2. **Error Handling**
   - Clear error messages if prerequisites are missing
   - Validation of module existence before insertion

3. **Progress Reporting**
   - Each rule insertion is logged with [✓] or [EXISTS]
   - Summary of total rules added at the end

---

## Verification

After running any migration, verify it succeeded:

```sql
-- Count total SEO rules (should be 39 after onpage migration)
SELECT COUNT(*) as total_seo_rules
FROM rules
WHERE module_id = (SELECT id FROM analysis_modules WHERE name = 'SEO');

-- List all new rules added
SELECT rule_key, name, default_severity
FROM rules
WHERE rule_key IN (
  'SEO_CON_06_META_DESC_NO_CTA',
  'SEO_CON_09_H1_TITLE_MISMATCH',
  'SEO_CON_10_HEADING_HIERARCHY',
  'SEO_CON_11_CONTENT_TOO_LONG',
  'SEO_CON_12_PARAGRAPH_LENGTH',
  'SEO_CON_13_EMPTY_LINKS',
  'SEO_CON_14_GENERIC_LINK_TEXT',
  'SEO_CON_15_IMAGE_ALT_MISSING',
  'SEO_CON_16_IMAGE_ALT_EMPTY',
  'SEO_CON_17_IMAGE_ALT_SHORT',
  'SEO_CON_18_URL_TOO_LONG',
  'SEO_CON_19_URL_SESSION_ID',
  'SEO_CON_20_URL_UNDERSCORES',
  'SEO_CON_21_URL_UPPERCASE'
)
ORDER BY rule_key;
```

---

## Rollback

If you need to rollback a migration, use this SQL:

```sql
-- Rollback add_onpage_seo_rules migration
DELETE FROM rules
WHERE rule_key IN (
  'SEO_CON_06_META_DESC_NO_CTA',
  'SEO_CON_09_H1_TITLE_MISMATCH',
  'SEO_CON_10_HEADING_HIERARCHY',
  'SEO_CON_11_CONTENT_TOO_LONG',
  'SEO_CON_12_PARAGRAPH_LENGTH',
  'SEO_CON_13_EMPTY_LINKS',
  'SEO_CON_14_GENERIC_LINK_TEXT',
  'SEO_CON_15_IMAGE_ALT_MISSING',
  'SEO_CON_16_IMAGE_ALT_EMPTY',
  'SEO_CON_17_IMAGE_ALT_SHORT',
  'SEO_CON_18_URL_TOO_LONG',
  'SEO_CON_19_URL_SESSION_ID',
  'SEO_CON_20_URL_UNDERSCORES',
  'SEO_CON_21_URL_UPPERCASE'
);
```

---

## For New Installations

If you're setting up a fresh database, you don't need these migrations. The seed data has been updated:

- `supabase/migrations/20250105000011_seed_data.sql` - Updated with all rules
- `database/setup/11_seed_data.sql` - Updated with all rules

Fresh installations will automatically include all 39 SEO rules.

---

## Questions?

- Check the main project README for database setup instructions
- See `DEPLOYMENT.md` for production deployment guide
- Review `supabase/migrations/` for the history of all migrations
