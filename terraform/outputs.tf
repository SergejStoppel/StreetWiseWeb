# =====================================
# SiteCraft Terraform Outputs
# =====================================

# =====================================
# Database Outputs
# =====================================

output "database_connection_name" {
  description = "The connection name for the Cloud SQL instance"
  value       = google_sql_database_instance.main.connection_name
}

output "database_private_ip" {
  description = "The private IP address of the Cloud SQL instance"
  value       = google_sql_database_instance.main.private_ip_address
}

output "database_name" {
  description = "The name of the application database"
  value       = google_sql_database.app_database.name
}

output "database_user" {
  description = "The application database user"
  value       = google_sql_user.app_user.name
}

# =====================================
# Storage Outputs
# =====================================

output "analysis_assets_bucket_name" {
  description = "Name of the analysis assets bucket"
  value       = google_storage_bucket.analysis_assets.name
}

output "analysis_assets_bucket_url" {
  description = "URL of the analysis assets bucket"
  value       = google_storage_bucket.analysis_assets.url
}

output "static_assets_bucket_name" {
  description = "Name of the static assets bucket"
  value       = google_storage_bucket.static_assets.name
}

output "static_assets_bucket_url" {
  description = "URL of the static assets bucket"
  value       = google_storage_bucket.static_assets.url
}

# =====================================
# Redis Outputs
# =====================================

output "redis_host" {
  description = "The IP address of the Redis instance"
  value       = google_redis_instance.cache.host
}

output "redis_port" {
  description = "The port of the Redis instance"
  value       = google_redis_instance.cache.port
}

output "redis_auth_string" {
  description = "The auth string for Redis (sensitive)"
  value       = google_redis_instance.cache.auth_string
  sensitive   = true
}

# =====================================
# Service Account Outputs
# =====================================

output "firebase_admin_service_account_email" {
  description = "Email of the Firebase Admin service account"
  value       = google_service_account.firebase_admin.email
}

output "storage_admin_service_account_email" {
  description = "Email of the Storage Admin service account"
  value       = google_service_account.storage_admin.email
}

output "backend_app_service_account_email" {
  description = "Email of the Backend App service account"
  value       = google_service_account.backend_app.email
}

# =====================================
# Network Outputs
# =====================================

output "vpc_network_name" {
  description = "Name of the VPC network"
  value       = google_compute_network.sitecraft_vpc.name
}

output "vpc_subnet_name" {
  description = "Name of the VPC subnet"
  value       = google_compute_subnetwork.sitecraft_subnet.name
}

# =====================================
# Secret Manager Outputs
# =====================================

output "secret_manager_secrets" {
  description = "List of Secret Manager secret names"
  value = {
    db_password        = google_secret_manager_secret.db_password.secret_id
    postgres_password  = google_secret_manager_secret.postgres_password.secret_id
    redis_auth        = google_secret_manager_secret.redis_auth.secret_id
    firebase_key      = google_secret_manager_secret.firebase_private_key.secret_id
  }
}

# =====================================
# Environment Configuration Output
# =====================================

output "environment_config" {
  description = "Environment configuration for application setup"
  value = {
    # Google Cloud
    project_id = var.project_id
    region     = var.region
    
    # Database
    db_connection_name = google_sql_database_instance.main.connection_name
    db_name           = google_sql_database.app_database.name
    db_user           = google_sql_user.app_user.name
    
    # Storage
    gcs_bucket = google_storage_bucket.analysis_assets.name
    
    # Redis
    redis_host = google_redis_instance.cache.host
    redis_port = google_redis_instance.cache.port
    
    # Service Accounts
    backend_service_account = google_service_account.backend_app.email
  }
}

# =====================================
# Connection Commands
# =====================================

output "database_connection_commands" {
  description = "Commands to connect to the database"
  value = {
    cloud_sql_proxy = "cloud_sql_proxy -instances=${google_sql_database_instance.main.connection_name}=tcp:5432"
    gcloud_sql_connect = "gcloud sql connect ${google_sql_database_instance.main.name} --user=postgres"
    psql_direct = "psql -h ${google_sql_database_instance.main.private_ip_address} -U ${google_sql_user.app_user.name} -d ${google_sql_database.app_database.name}"
  }
}

# =====================================
# Service Account Key Commands
# =====================================

output "service_account_key_commands" {
  description = "Commands to create service account keys"
  value = {
    firebase_admin = "gcloud iam service-accounts keys create firebase-admin-key.json --iam-account=${google_service_account.firebase_admin.email}"
    storage_admin = "gcloud iam service-accounts keys create storage-admin-key.json --iam-account=${google_service_account.storage_admin.email}"
    backend_app = "gcloud iam service-accounts keys create backend-app-key.json --iam-account=${google_service_account.backend_app.email}"
  }
}

# =====================================
# Next Steps
# =====================================

output "next_steps" {
  description = "Next steps after Terraform deployment"
  value = [
    "1. Generate service account keys using the commands above",
    "2. Store Firebase private key in Secret Manager",
    "3. Run database setup scripts",
    "4. Configure application environment variables",
    "5. Deploy application to Cloud Run or GKE"
  ]
}