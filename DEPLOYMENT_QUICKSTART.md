# 🚀 Deployment Quick Start (5 Minutes)

**Fast setup guide for automated Supabase deployments**

## Prerequisites
- [ ] GitHub repository cloned
- [ ] Supabase account created

---

## 1️⃣ Create Supabase Projects (2 min)

1. Go to https://app.supabase.com
2. Create **two projects**:
   - Name: `StreetWiseWeb-Dev`
   - Name: `StreetWiseWeb-Prod`
3. For each project, get:
   - **Project Reference ID** (Settings → General)
   - **Project URL** and **API Keys** (Settings → API)

---

## 2️⃣ Get Supabase Access Token (30 sec)

1. Go to https://app.supabase.com/account/tokens
2. Click "Generate new token"
3. Name it: `GitHub Actions`
4. **Copy the token immediately!**

---

## 3️⃣ Configure GitHub Secrets (1 min)

Go to: GitHub Repo → Settings → Secrets → Actions → New repository secret

Add **3 secrets**:

| Secret Name | Value |
|-------------|-------|
| `SUPABASE_ACCESS_TOKEN` | Token from step 2 |
| `DEV_SUPABASE_PROJECT_REF` | Dev project reference ID |
| `PROD_SUPABASE_PROJECT_REF` | Prod project reference ID |

---

## 4️⃣ Create Storage Buckets (1 min)

**In BOTH Supabase projects:**

1. Storage → Create bucket
2. Name: `analysis-assets`
3. Keep it **private** (uncheck public)
4. Create

---

## 5️⃣ Deploy to Dev (30 sec)

```bash
git checkout main
git commit --allow-empty -m "Initial database deployment"
git push origin main
```

Watch it deploy:
- GitHub → Actions tab
- Wait for green checkmark ✅

---

## 6️⃣ Verify (30 sec)

1. Open Dev Supabase project
2. Click **Table Editor**
3. Should see ~20 tables (users, workspaces, analyses, etc.)

---

## ✅ Done!

**What works now:**
- ✅ Push to `main` → Dev database updates
- ✅ Push to `prod` → Prod database updates
- ✅ No more manual SQL execution

---

## 🔥 Daily Usage

**Making database changes:**

```bash
# 1. Create new migration
touch supabase/migrations/$(date +%Y%m%d%H%M%S)_my_change.sql

# 2. Edit the file with your SQL changes

# 3. Commit and push
git add .
git commit -m "Add my_change migration"
git push origin main

# 4. Watch GitHub Actions deploy it automatically! 🚀
```

**Promoting to production:**

```bash
git checkout prod
git merge main
git push origin prod
```

---

## 🆘 Common Issues

**"Table already exists"** → Drop tables in Supabase SQL Editor first

**"Auth failed"** → Check GitHub secrets are correct

**"Workflow not running"** → Make sure you pushed to `main` or `prod`

---

## 📖 Need More Help?

Read the full guide: [DEPLOYMENT.md](./DEPLOYMENT.md)

---

**That's it! 🎉** You're now deploying databases like a pro!
