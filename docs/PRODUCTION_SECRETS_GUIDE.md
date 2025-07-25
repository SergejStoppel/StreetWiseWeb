# Production Secrets Management Guide

This guide explains how to properly manage secrets and environment variables for production deployment of StreetWiseWeb.

## ⚠️ Security Warning

**NEVER commit real secrets to your repository!** The `.env` file should always be in `.gitignore`.

## Development vs Production

### Development (Local)
- Use `.env` file in project root
- Contains both dev and prod configurations
- Switch environments using `APP_ENV=development|production`

### Production (Deployment)
- **Option 1: Environment Variables (Recommended)**
- **Option 2: Secure Secrets Management**
- **Option 3: Docker Secrets**

---

## Option 1: Environment Variables (Recommended)

Most cloud platforms support environment variables. Set these directly in your deployment platform:

### Required Production Variables
```bash
# Environment
APP_ENV=production
NODE_ENV=production

# Supabase (Production Project)
PROD_SUPABASE_URL=https://your-prod-project.supabase.co
PROD_SUPABASE_ANON_KEY=eyJ...your-prod-anon-key...
PROD_SUPABASE_SERVICE_ROLE_KEY=eyJ...your-prod-service-role-key...

# URLs (Replace with your domain)
PROD_FRONTEND_URL=https://yourdomain.com
PROD_API_URL=https://yourdomain.com
PROD_CORS_ORIGIN=https://yourdomain.com

# Server
PORT=3005

# Security & Performance
PROD_RATE_LIMIT_WINDOW=900000
PROD_RATE_LIMIT_MAX=100
PROD_ANALYSIS_RATE_LIMIT_MAX=10
PROD_ANALYSIS_TIMEOUT=60000
PROD_MAX_CONCURRENT_ANALYSES=10
PROD_LOG_LEVEL=info
PROD_DEBUG=false
PROD_FORCE_HTTPS=true
PROD_ENABLE_HELMET=true
```

### Platform-Specific Instructions

#### Vercel
```bash
# Add via Vercel Dashboard > Settings > Environment Variables
# Or use Vercel CLI:
vercel env add PROD_SUPABASE_URL
vercel env add PROD_SUPABASE_ANON_KEY
vercel env add PROD_SUPABASE_SERVICE_ROLE_KEY
# ... etc
```

#### Netlify
```bash
# Add via Netlify Dashboard > Site Settings > Environment Variables
# Or use Netlify CLI:
netlify env:set PROD_SUPABASE_URL "https://your-prod-project.supabase.co"
```

#### Railway
```bash
# Add via Railway Dashboard > Variables
# Or use Railway CLI:
railway variables set PROD_SUPABASE_URL=https://your-prod-project.supabase.co
```

#### Docker/Docker Compose
```yaml
# docker-compose.prod.yml
services:
  backend:
    environment:
      - APP_ENV=production
      - PROD_SUPABASE_URL=${PROD_SUPABASE_URL}
      - PROD_SUPABASE_ANON_KEY=${PROD_SUPABASE_ANON_KEY}
      - PROD_SUPABASE_SERVICE_ROLE_KEY=${PROD_SUPABASE_SERVICE_ROLE_KEY}
      # ... other vars
```

---

## Option 2: Secure Secrets Management

For enterprise deployments, use dedicated secrets management:

### AWS Secrets Manager
```javascript
// backend/config/secrets.js
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

const getSecret = async (secretName) => {
  try {
    const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
    return JSON.parse(data.SecretString);
  } catch (error) {
    console.error('Error retrieving secret:', error);
    throw error;
  }
};

module.exports = { getSecret };
```

### Azure Key Vault
```javascript
// backend/config/secrets.js
const { SecretClient } = require('@azure/keyvault-secrets');
const { DefaultAzureCredential } = require('@azure/identity');

const credential = new DefaultAzureCredential();
const client = new SecretClient(process.env.AZURE_KEY_VAULT_URL, credential);

const getSecret = async (secretName) => {
  try {
    const secret = await client.getSecret(secretName);
    return secret.value;
  } catch (error) {
    console.error('Error retrieving secret:', error);
    throw error;
  }
};

module.exports = { getSecret };
```

### Google Secret Manager
```javascript
// backend/config/secrets.js
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const client = new SecretManagerServiceClient();

const getSecret = async (secretName) => {
  try {
    const [version] = await client.accessSecretVersion({
      name: `projects/${process.env.GOOGLE_PROJECT_ID}/secrets/${secretName}/versions/latest`,
    });
    return version.payload.data.toString('utf8');
  } catch (error) {
    console.error('Error retrieving secret:', error);
    throw error;
  }
};

module.exports = { getSecret };
```

---

## Option 3: Docker Secrets

For Docker Swarm or Kubernetes:

### Docker Swarm
```bash
# Create secrets
echo "your-supabase-url" | docker secret create prod_supabase_url -
echo "your-anon-key" | docker secret create prod_supabase_anon_key -
echo "your-service-role-key" | docker secret create prod_supabase_service_key -

# Use in docker-compose.yml
services:
  backend:
    secrets:
      - prod_supabase_url
      - prod_supabase_anon_key
      - prod_supabase_service_key
    environment:
      - PROD_SUPABASE_URL_FILE=/run/secrets/prod_supabase_url
      - PROD_SUPABASE_ANON_KEY_FILE=/run/secrets/prod_supabase_anon_key
      - PROD_SUPABASE_SERVICE_ROLE_KEY_FILE=/run/secrets/prod_supabase_service_key

secrets:
  prod_supabase_url:
    external: true
  prod_supabase_anon_key:
    external: true
  prod_supabase_service_key:
    external: true
```

### Kubernetes
```yaml
# secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  supabase-url: <base64-encoded-url>
  supabase-anon-key: <base64-encoded-key>
  supabase-service-key: <base64-encoded-key>

---
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: backend
        env:
        - name: PROD_SUPABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: supabase-url
```

---

## Security Best Practices

### 1. Environment Separation
- **Never mix dev and prod secrets**
- Use separate Supabase projects for dev/staging/prod
- Use different domains for each environment

### 2. Secret Rotation
- Regularly rotate Supabase service role keys
- Monitor access logs in Supabase dashboard
- Use time-limited tokens when possible

### 3. Access Control
- Limit who can access production secrets
- Use service accounts for automated deployments
- Enable audit logging for secret access

### 4. Monitoring
- Monitor for unauthorized API usage
- Set up alerts for unusual activity
- Log authentication failures

### 5. Backup Strategy
- Keep secure backups of production secrets
- Document secret recovery procedures
- Test secret rotation procedures

---

## Troubleshooting

### Common Issues

#### "Missing Supabase configuration" Error
```bash
# Check environment variables are set
echo $PROD_SUPABASE_URL
echo $PROD_SUPABASE_ANON_KEY

# Verify environment selection
echo $APP_ENV
```

#### CORS Errors in Production
```bash
# Ensure production URLs are set correctly
PROD_FRONTEND_URL=https://yourdomain.com  # No trailing slash
PROD_CORS_ORIGIN=https://yourdomain.com   # Must match exactly
```

#### Database Connection Issues
- Verify Supabase project is active
- Check service role key permissions
- Review Supabase API logs

### Environment Variable Debugging
```javascript
// Add to backend/config/environment.js (development only)
if (isDevelopment) {
  console.log('Environment Configuration:', {
    APP_ENV: process.env.APP_ENV,
    hasSupabaseUrl: !!config.SUPABASE_URL,
    hasSupabaseKey: !!config.SUPABASE_ANON_KEY,
    hasServiceKey: !!config.SUPABASE_SERVICE_ROLE_KEY
  });
}
```

---

## Deployment Checklist

- [ ] Production Supabase project created
- [ ] Database schema deployed to production
- [ ] RLS policies enabled
- [ ] Environment variables set in deployment platform
- [ ] Domain configured correctly
- [ ] SSL certificate active
- [ ] Rate limiting configured
- [ ] Monitoring enabled
- [ ] Backup procedures tested
- [ ] Access controls configured

---

## Getting Help

1. **Supabase Issues**: Check Supabase dashboard logs
2. **Deployment Issues**: Check deployment platform documentation
3. **Authentication Issues**: Verify JWT tokens and RLS policies
4. **Performance Issues**: Review rate limiting and timeout settings

Remember: When in doubt, test with a staging environment first!