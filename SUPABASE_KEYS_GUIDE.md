# 🔑 Supabase Configuration Guide

## 📍 Where to Find Your Supabase Keys

### For Each Project (Dev and Prod), Get These Values:

---

### **1. Project URL and API Keys**

**Location:** Supabase Dashboard → Your Project → **Settings** → **API**

You'll see:
```
Project URL: https://abcdefghijklmnop.supabase.co
```

And in the "Project API keys" section:
```
anon public:    eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ...  [This is publishable key]
service_role:   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ...  [This is secret key]
```

**Important:** The dashboard might say:
- "publishable key" = anon key
- "secret key" = service_role key

Both names refer to the same thing!

---

### **2. Project Reference ID**

**Location:** Supabase Dashboard → Your Project → **Settings** → **General**

Look for:
```
Reference ID: abcdefghijklmnop
```

This is a short alphanumeric string (usually 16-20 characters).

---

### **3. Access Token** (One token for all projects)

**Location:** Supabase Dashboard → **Account** (top right corner) → **Access Tokens**

This token works for ALL your projects (both Dev and Prod).

---

## 📝 **What to Put Where**

### **Option 1: GitHub Secrets** (for automated deployments)

Go to: **GitHub Repository → Settings → Secrets and variables → Actions**

Add these **3 secrets**:

| Secret Name | Value | Where to Find |
|-------------|-------|---------------|
| `SUPABASE_ACCESS_TOKEN` | Your access token | Account → Access Tokens |
| `DEV_SUPABASE_PROJECT_REF` | Dev project reference ID | Dev Project → Settings → General |
| `PROD_SUPABASE_PROJECT_REF` | Prod project reference ID | Prod Project → Settings → General |

**Example:**
```
Name:  SUPABASE_ACCESS_TOKEN
Value: sbp_1234567890abcdef1234567890abcdef
```

```
Name:  DEV_SUPABASE_PROJECT_REF
Value: abcdefghijklmnop
```

```
Name:  PROD_SUPABASE_PROJECT_REF
Value: zyxwvutsrqponmlk
```

---

### **Option 2: Your `.env` File** (for running backend locally)

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Then edit `.env` and fill in these values:

#### **Development Supabase Config:**
```bash
DEV_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
DEV_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # "publishable key"
DEV_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # "secret key"
```

#### **Production Supabase Config:**
```bash
PROD_SUPABASE_URL=https://zyxwvutsrqponmlk.supabase.co
PROD_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # "publishable key"
PROD_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # "secret key"
```

---

## 🎯 **Quick Reference**

### **Supabase Dashboard Terms → Our .env Names:**

| Dashboard Says | We Call It | Use Case |
|----------------|------------|----------|
| "publishable key" | `SUPABASE_ANON_KEY` | Frontend-safe, respects RLS |
| "secret key" | `SUPABASE_SERVICE_ROLE_KEY` | Backend only, bypasses RLS |
| "Project URL" | `SUPABASE_URL` | API endpoint |
| "Reference ID" | `PROJECT_REF` | CLI/deployment identifier |
| "Access Token" | `SUPABASE_ACCESS_TOKEN` | CLI authentication |

---

## ✅ **What You've Already Done**

- ✅ Generated Access Token
- ✅ Created storage buckets in Dev project
- ✅ Created storage buckets in Prod project

---

## 📋 **Next Steps**

### **Step 1: Add GitHub Secrets (2 minutes)**

1. Go to: https://github.com/SergejStoppel/StreetWiseWeb/settings/secrets/actions
2. Click "New repository secret"
3. Add all 3 secrets (see table above)

### **Step 2: Update Your `.env` File (2 minutes)**

```bash
# Copy the example
cp .env.example .env

# Edit with your values
nano .env  # or use your preferred editor
```

Fill in the 6 Supabase values (3 for Dev, 3 for Prod).

### **Step 3: Test GitHub Actions Deployment (5 minutes)**

Once you've added the GitHub secrets, test the deployment:

```bash
# Merge your changes to main
git checkout main
git merge claude/analyze-project-todos-011CUpqX539n36PA7pnv1UHk
git push origin main
```

Watch the deployment at: https://github.com/SergejStoppel/StreetWiseWeb/actions

---

## 🆘 **Common Questions**

**Q: Which key is "publishable" and which is "secret"?**
A:
- Publishable key = anon key (starts with `eyJh...`, shorter)
- Secret key = service_role key (starts with `eyJh...`, longer)

**Q: Do I need the Access Token in my .env?**
A: No! Access Token is ONLY for GitHub Actions. Don't put it in `.env`.

**Q: Where's the "API key" mentioned in the docs?**
A: That's legacy terminology. Use "publishable key" and "secret key" instead.

**Q: Can I use the same storage bucket for dev and prod?**
A: No, you need separate buckets in each project. You've already created them! ✅

---

## 🎉 **You're Almost There!**

Once you add the 3 GitHub secrets, you'll be able to:
- ✅ Push to `main` → Auto-deploy to Dev
- ✅ Push to `prod` → Auto-deploy to Prod
- ✅ Run backend locally with correct database connection

**Need help?** Check DEPLOYMENT.md for detailed troubleshooting!
