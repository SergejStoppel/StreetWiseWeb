# Screenshot Storage Strategy

## Current State
Screenshots are currently generated as base64 data URLs and included directly in the analysis JSON. This works but has limitations:

- **Large payload sizes** - Base64 screenshots can be 500KB-2MB each
- **Database bloat** - Storing large blobs in PostgreSQL is not optimal
- **Performance impact** - Large JSON objects slow down queries and transfers

## Recommended Solutions

### Option 1: Supabase Storage Buckets (RECOMMENDED)
**Pros:**
- Native integration with Supabase
- Built-in CDN for fast delivery
- Automatic image optimization
- Cost-effective storage
- Easy integration with RLS policies

**Implementation:**
1. Create a `screenshots` bucket in Supabase Storage
2. Upload screenshots to bucket during analysis
3. Store only the public URL in analysis data
4. Set up RLS policies to protect user screenshots

```javascript
// Upload screenshot
const { data, error } = await supabase.storage
  .from('screenshots')
  .upload(`${userId}/${analysisId}/desktop.jpg`, screenshotBlob);

// Store URL in analysis
const screenshotUrl = supabase.storage
  .from('screenshots')
  .getPublicUrl(`${userId}/${analysisId}/desktop.jpg`).data.publicUrl;
```

### Option 2: External Storage (AWS S3, Cloudinary)
**Pros:**
- Dedicated image/file storage service
- Advanced image processing capabilities
- Global CDN distribution

**Cons:**
- Additional service complexity
- Extra API keys and configuration
- Additional costs

### Option 3: Base64 with Compression
**Pros:**
- Simple implementation (current approach)
- No additional storage services needed

**Cons:**
- Still creates large payloads
- Limited scalability

## Implementation Plan

### Phase 1: Supabase Storage Integration
1. **Create storage bucket and policies**
2. **Modify backend screenshot service** to upload to Supabase Storage
3. **Update analysis model** to store URLs instead of base64
4. **Add cleanup job** for old screenshots

### Phase 2: Optimization
1. **Image compression** - Convert to WebP format
2. **Multiple sizes** - Thumbnail and full-size versions
3. **Lazy loading** - Load screenshots on demand

## Immediate Action Required

**You need to:**
1. **Replace service role key** in `docker-compose.dev.yml` with your actual Supabase service role key
2. **Run the RLS script** `enable-analyses-rls.sql` in Supabase SQL Editor
3. **Create a screenshots bucket** in Supabase Storage dashboard
4. **Set up bucket policies** for user access

**To get your service role key:**
1. Go to Supabase Dashboard → Settings → API
2. Copy the `service_role` key (not the `anon` key)
3. Update line 19 in `docker-compose.dev.yml`