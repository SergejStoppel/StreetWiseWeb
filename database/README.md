# StreetWiseWeb Database Setup

This directory contains the database schema and setup scripts for StreetWiseWeb.

## 🚀 Quick Setup

### 1. **Execute the Database Schema**

1. Open your Supabase dashboard (StreetWiseWeb project)
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `setup.sql`
5. Click **Run**

### 2. **Verify Tables Were Created**

Navigate to **Table Editor** in your Supabase dashboard. You should see:
- `user_profiles`
- `projects`
- `analyses`
- `analysis_issues`
- `usage_logs`

## 📋 **Database Structure**

### **Core Tables**

1. **`user_profiles`** - Extended user information
   - Links to Supabase `auth.users` table
   - Stores plan type, company info, settings

2. **`projects`** - Project organization
   - Groups analyses by project/website
   - Belongs to a user

3. **`analyses`** - Analysis results
   - Main analysis data and scores
   - Belongs to user and project

4. **`analysis_issues`** - Individual accessibility issues
   - Extracted from analysis results
   - Linked to specific analysis

5. **`usage_logs`** - Usage tracking
   - For billing and rate limiting
   - Tracks user actions

### **Security**

- **Row Level Security (RLS)** enabled on all tables
- Users can only access their own data
- Policies automatically enforce data isolation

## 🔧 **Testing the Setup**

### **Option 1: Manual Testing**

1. Create a user account through your app
2. Get your user ID:
   ```sql
   SELECT id FROM auth.users WHERE email = 'your-email@example.com';
   ```
3. Update `sample-data.sql` with your user ID
4. Run the sample data script

### **Option 2: App Testing**

Once you implement the Supabase client in your app, you can test:
1. User registration/login
2. Creating projects
3. Running analyses
4. Viewing results

## 📁 **Files**

- **`schema.sql`** - Complete database schema with all constraints, indexes, and documentation
- **`setup.sql`** - Quick setup script for immediate use
- **`sample-data.sql`** - Sample data for testing
- **`README.md`** - This file

## 🔍 **Common Queries**

### **Get User's Projects**
```sql
SELECT * FROM projects WHERE user_id = auth.uid();
```

### **Get Project's Analyses**
```sql
SELECT * FROM analyses WHERE project_id = 'project-id' AND user_id = auth.uid();
```

### **Get Analysis Issues**
```sql
SELECT ai.* FROM analysis_issues ai
JOIN analyses a ON ai.analysis_id = a.id
WHERE a.user_id = auth.uid();
```

### **Get User Usage This Month**
```sql
SELECT COUNT(*) FROM usage_logs 
WHERE user_id = auth.uid() 
AND action = 'analysis' 
AND created_at >= date_trunc('month', CURRENT_DATE);
```

## 🚨 **Important Notes**

1. **Never commit real environment variables** - The schema uses placeholders
2. **RLS is enabled** - All data is automatically filtered by user
3. **UUIDs are used** - For better security and performance
4. **JSONB columns** - For flexible data storage (analysis results, settings)
5. **Indexes created** - For optimal query performance

## 🔄 **Next Steps**

After running the schema:
1. Install Supabase client in your backend
2. Install Supabase client in your frontend
3. Implement authentication
4. Test database operations
5. Deploy to production

## 🆘 **Troubleshooting**

### **"relation already exists" error**
- Tables already exist, you can skip schema creation
- Or drop existing tables if you want to recreate

### **"permission denied" error**
- Check that RLS policies are correctly set
- Verify user is authenticated

### **"foreign key constraint" error**
- Ensure user exists in auth.users before creating user_profile
- Check that referenced IDs exist

### **Need help?**
Check the Supabase documentation or create an issue in the repository.