# SiteCraft Infrastructure as Code

This directory contains Terraform configuration for deploying SiteCraft's Google Cloud infrastructure.

## 🏗️ Infrastructure Overview

The Terraform configuration provisions:

- **Cloud SQL PostgreSQL** - Primary database with private networking
- **Cloud Storage** - Buckets for analysis assets and static files
- **Cloud Memorystore (Redis)** - Cache and job queue
- **VPC Network** - Private networking with service peering
- **Service Accounts** - IAM for different services
- **Secret Manager** - Secure credential storage

## 🚀 Quick Start

### Prerequisites

1. **Terraform** installed (>= 1.0)
2. **Google Cloud CLI** installed and authenticated
3. **Google Cloud Project** with billing enabled
4. **Required permissions** on the GCP project

### Initial Setup

1. **Copy variables file:**
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. **Edit `terraform.tfvars`** with your project details:
   ```hcl
   project_id = "your-project-id"
   region     = "us-central1"
   environment = "development"
   ```

3. **Initialize Terraform:**
   ```bash
   terraform init
   ```

4. **Plan the deployment:**
   ```bash
   terraform plan
   ```

5. **Apply the configuration:**
   ```bash
   terraform apply
   ```

## 📋 Deployment Steps

### Step 1: Enable APIs and Create Core Resources

```bash
# Initialize and apply
terraform init
terraform plan -var-file="terraform.tfvars"
terraform apply -var-file="terraform.tfvars"
```

### Step 2: Generate Service Account Keys

After Terraform completes, generate the service account keys:

```bash
# Firebase Admin key
gcloud iam service-accounts keys create firebase-admin-key.json \
  --iam-account=$(terraform output -raw firebase_admin_service_account_email)

# Storage Admin key  
gcloud iam service-accounts keys create storage-admin-key.json \
  --iam-account=$(terraform output -raw storage_admin_service_account_email)

# Backend App key
gcloud iam service-accounts keys create backend-app-key.json \
  --iam-account=$(terraform output -raw backend_app_service_account_email)
```

### Step 3: Store Firebase Private Key

Store your Firebase private key in Secret Manager:

```bash
# From your firebase-admin-key.json file
gcloud secrets versions add firebase-private-key \
  --data-file="firebase-admin-key.json"
```

### Step 4: Database Setup

Connect to your database and run the setup scripts:

```bash
# Using Cloud SQL Proxy
cloud_sql_proxy -instances=$(terraform output -raw database_connection_name)=tcp:5432

# Or connect directly (if in same VPC)
psql -h $(terraform output -raw database_private_ip) \
     -U $(terraform output -raw database_user) \
     -d $(terraform output -raw database_name)
```

## 🔧 Configuration

### Environment Variables

The infrastructure outputs can be used to configure your application:

```bash
# Get all configuration
terraform output environment_config

# Get specific values
terraform output database_connection_name
terraform output redis_host
terraform output analysis_assets_bucket_name
```

### Application Environment File

Create your `.env` file using Terraform outputs:

```bash
# Database
export CLOUD_SQL_CONNECTION_NAME=$(terraform output -raw database_connection_name)
export DB_USER=$(terraform output -raw database_user) 
export DB_NAME=$(terraform output -raw database_name)

# Redis
export REDIS_HOST=$(terraform output -raw redis_host)
export REDIS_PORT=$(terraform output -raw redis_port)

# Storage
export GCS_BUCKET_NAME=$(terraform output -raw analysis_assets_bucket_name)
```

## 🌍 Multi-Environment Setup

### Development Environment

```hcl
# terraform.tfvars
environment = "development"
db_tier = "db-g1-small"
redis_memory_gb = 1
```

### Production Environment

```hcl
# terraform.tfvars
environment = "production"
db_tier = "db-n1-standard-2"
redis_memory_gb = 4
db_disk_size = 100
```

### Using Workspaces

```bash
# Create workspaces for different environments
terraform workspace new development
terraform workspace new production

# Switch between environments
terraform workspace select development
terraform apply -var-file="dev.tfvars"

terraform workspace select production  
terraform apply -var-file="prod.tfvars"
```

## 🔐 Security Features

- **Private Networking**: All resources use private IPs where possible
- **VPC Peering**: Secure connection between services
- **Secret Manager**: Passwords and keys stored securely
- **IAM**: Least-privilege service accounts
- **Backup**: Automated database backups
- **Monitoring**: Cloud SQL and Redis monitoring enabled

## 📊 Resource Costs

Estimated monthly costs (us-central1):

| Resource | Development | Production |
|----------|-------------|------------|
| Cloud SQL (db-g1-small) | ~$25 | ~$100 (db-n1-standard-2) |
| Redis (1GB) | ~$30 | ~$120 (4GB) |
| Storage (100GB) | ~$2 | ~$5 (500GB) |
| **Total** | **~$57/month** | **~$225/month** |

## 🚨 Important Notes

1. **Deletion Protection**: Production databases have deletion protection enabled
2. **Backup Retention**: Production has 30-day backup retention
3. **Private IPs**: Database only accessible from VPC network
4. **Service Account Keys**: Store securely and rotate regularly
5. **CORS Origins**: Update for your production domains

## 🔄 Maintenance

### Updating Infrastructure

```bash
# Always plan before applying
terraform plan -var-file="terraform.tfvars"
terraform apply -var-file="terraform.tfvars"
```

### Backing Up State

```bash
# Back up Terraform state
terraform state pull > terraform-state-backup-$(date +%Y%m%d).json
```

### Destroying Resources

```bash
# BE CAREFUL - This will delete everything!
terraform destroy -var-file="terraform.tfvars"
```

## 📖 Terraform Files

- `main.tf` - Main infrastructure resources
- `variables.tf` - Input variables and validation
- `outputs.tf` - Output values for application configuration
- `terraform.tfvars.example` - Example configuration
- `README.md` - This documentation

## 🆘 Troubleshooting

### Common Issues

1. **API Not Enabled**: Ensure all required APIs are enabled
2. **Permissions**: Check that your account has necessary IAM roles
3. **Quotas**: Verify GCP quotas for your project
4. **Network**: VPC peering might take time to propagate

### Getting Help

```bash
# Terraform state issues
terraform refresh
terraform state list

# Resource information
terraform show
terraform output
```