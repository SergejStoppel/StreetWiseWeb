# Supabase Storage Bucket Setup for 'analysis-assets'

## Required Bucket Configuration

### 1. Bucket Settings
- **Name**: `analysis-assets`
- **Public**: `false` (private bucket)
- **File size limit**: `50MB` (to allow large screenshots and HTML files)
- **Allowed MIME types**: `All` (or specify: `text/html,text/css,application/javascript,image/jpeg,image/png,image/webp,text/plain,application/json`)

### 2. RLS (Row Level Security) Policies

You need to add these policies in Supabase Dashboard under Storage > Policies:

#### Policy 1: Allow Backend Service to Upload Files
```sql
-- Policy Name: "Service can upload analysis assets"
-- Operation: INSERT
-- Target roles: service_role

-- Policy Definition:
(auth.role() = 'service_role')
```

#### Policy 2: Allow Backend Service to Read Files  
```sql
-- Policy Name: "Service can read analysis assets"
-- Operation: SELECT
-- Target roles: service_role

-- Policy Definition:
(auth.role() = 'service_role')
```

#### Policy 3: Allow Backend Service to Update Files (optional)
```sql
-- Policy Name: "Service can update analysis assets" 
-- Operation: UPDATE
-- Target roles: service_role

-- Policy Definition:
(auth.role() = 'service_role')
```

#### Policy 4: Allow Backend Service to Delete Files (optional)
```sql
-- Policy Name: "Service can delete analysis assets"
-- Operation: DELETE  
-- Target roles: service_role

-- Policy Definition:
(auth.role() = 'service_role')
```

### 3. Quick Setup via Supabase Dashboard

1. Go to **Storage** > **Buckets**
2. Click on your `analysis-assets` bucket
3. Go to **Policies** tab
4. Click **New Policy**
5. For each policy above:
   - Set the **Policy Name**
   - Select the **Operation** (INSERT, SELECT, UPDATE, DELETE)
   - In **Policy Definition**, paste the SQL condition
   - Click **Save Policy**

### 4. Alternative: SQL Script Setup

Run this in your Supabase SQL Editor to set up all policies at once:

```sql
-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Service role can insert (upload) analysis assets
CREATE POLICY "Service can upload analysis assets" ON storage.objects
FOR INSERT TO service_role
WITH CHECK (bucket_id = 'analysis-assets');

-- Service role can select (download) analysis assets  
CREATE POLICY "Service can read analysis assets" ON storage.objects
FOR SELECT TO service_role
USING (bucket_id = 'analysis-assets');

-- Service role can update analysis assets (optional)
CREATE POLICY "Service can update analysis assets" ON storage.objects
FOR UPDATE TO service_role
USING (bucket_id = 'analysis-assets')
WITH CHECK (bucket_id = 'analysis-assets');

-- Service role can delete analysis assets (optional)
CREATE POLICY "Service can delete analysis assets" ON storage.objects  
FOR DELETE TO service_role
USING (bucket_id = 'analysis-assets');
```

### 5. Verify Setup

Test that your backend can access the bucket by running an analysis. The fetcher worker should be able to:
- Upload HTML files to `/{workspaceId}/{analysisId}/html/index.html`
- Upload CSS files to `/{workspaceId}/{analysisId}/css/styles-*.css`
- Upload screenshots to `/{workspaceId}/{analysisId}/screenshots/*.jpg`
- The color contrast worker should be able to download the HTML file

### 6. Folder Structure

The system will create this folder structure in your bucket:
```
analysis-assets/
├── {workspaceId}/
│   └── {analysisId}/
│       ├── html/
│       │   └── index.html
│       ├── css/
│       │   ├── styles-0.css
│       │   ├── styles-1.css
│       │   └── ...
│       ├── js/
│       │   ├── script-0.js
│       │   └── ...
│       ├── screenshots/
│       │   ├── desktop.jpg
│       │   ├── mobile.jpg
│       │   ├── tablet.jpg
│       │   └── full-page.jpg
│       └── metadata.json
```

This structure allows for organized storage and easy retrieval of analysis assets.