# =====================================
# SiteCraft Google Cloud Infrastructure
# =====================================

terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.4"
    }
  }
}

# =====================================
# Provider Configuration
# =====================================

provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

# =====================================
# Random Password Generation
# =====================================

resource "random_password" "postgres_password" {
  length  = 16
  special = true
}

resource "random_password" "app_user_password" {
  length  = 16
  special = true
}

resource "random_password" "redis_auth_string" {
  length  = 32
  special = false # Redis auth string should not have special characters
}

# =====================================
# Enable Required APIs
# =====================================

resource "google_project_service" "required_apis" {
  for_each = toset([
    "sqladmin.googleapis.com",
    "storage.googleapis.com",
    "redis.googleapis.com",
    "secretmanager.googleapis.com",
    "iam.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "firebase.googleapis.com",
    "identitytoolkit.googleapis.com",
    "compute.googleapis.com",
    "servicenetworking.googleapis.com"
  ])

  service            = each.value
  disable_on_destroy = false
}

# =====================================
# VPC Network Configuration
# =====================================

resource "google_compute_network" "sitecraft_vpc" {
  name                    = "${var.project_name}-vpc"
  auto_create_subnetworks = false
  depends_on              = [google_project_service.required_apis]
}

resource "google_compute_subnetwork" "sitecraft_subnet" {
  name          = "${var.project_name}-subnet"
  ip_cidr_range = "10.0.0.0/24"
  network       = google_compute_network.sitecraft_vpc.id
  region        = var.region

  # Enable private Google access for instances without external IPs
  private_ip_google_access = true
}

# Private service connection for Cloud SQL
resource "google_compute_global_address" "private_ip_address" {
  name          = "${var.project_name}-private-ip"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.sitecraft_vpc.id
  depends_on    = [google_project_service.required_apis]
}

resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.sitecraft_vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address.name]
}

# =====================================
# Cloud SQL PostgreSQL Instance
# =====================================

resource "google_sql_database_instance" "main" {
  name             = "${var.project_name}-db"
  database_version = "POSTGRES_15"
  region           = var.region
  deletion_protection = var.environment == "production" ? true : false

  depends_on = [
    google_service_networking_connection.private_vpc_connection,
    google_project_service.required_apis
  ]

  settings {
    tier              = var.db_tier
    availability_type = var.environment == "production" ? "REGIONAL" : "ZONAL"
    disk_type         = "PD_SSD"
    disk_size         = var.db_disk_size
    disk_autoresize   = true

    # Backup configuration
    backup_configuration {
      enabled                        = true
      start_time                     = "03:00"
      point_in_time_recovery_enabled = true
      backup_retention_settings {
        retained_backups = var.environment == "production" ? 30 : 7
      }
    }

    # IP configuration for private networking
    ip_configuration {
      ipv4_enabled                                  = false
      private_network                               = google_compute_network.sitecraft_vpc.id
      enable_private_path_for_google_cloud_services = true
    }

    # Database flags for performance
    database_flags {
      name  = "max_connections"
      value = "100"
    }

    database_flags {
      name  = "shared_preload_libraries"
      value = "pg_stat_statements"
    }

    # Maintenance window
    maintenance_window {
      day          = 7  # Sunday
      hour         = 3  # 3 AM
      update_track = "stable"
    }
  }
}

# Create database
resource "google_sql_database" "app_database" {
  name     = var.database_name
  instance = google_sql_database_instance.main.name
}

# Create application user
resource "google_sql_user" "app_user" {
  name     = var.db_user
  instance = google_sql_database_instance.main.name
  password = random_password.app_user_password.result
}

# Set postgres user password
resource "google_sql_user" "postgres_user" {
  name     = "postgres"
  instance = google_sql_database_instance.main.name
  password = random_password.postgres_password.result
}

# =====================================
# Cloud Storage Buckets
# =====================================

resource "google_storage_bucket" "analysis_assets" {
  name     = "${var.project_name}-analysis-assets"
  location = var.region

  # Prevent accidental deletion in production
  force_destroy = var.environment != "production"

  # Versioning for production
  versioning {
    enabled = var.environment == "production"
  }

  # Lifecycle management
  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type = "Delete"
    }
  }

  # Public access prevention
  public_access_prevention = "enforced"

  # Uniform bucket-level access
  uniform_bucket_level_access = true

  # CORS configuration for frontend access
  cors {
    origin          = var.cors_origins
    method          = ["GET", "POST", "PUT", "DELETE"]
    response_header = ["Content-Type", "Authorization"]
    max_age_seconds = 3600
  }
}

resource "google_storage_bucket" "static_assets" {
  name     = "${var.project_name}-static-assets"
  location = var.region

  force_destroy = var.environment != "production"

  public_access_prevention    = "enforced"
  uniform_bucket_level_access = true

  # Static assets can be cached longer
  lifecycle_rule {
    condition {
      age = 365 # 1 year
    }
    action {
      type = "Delete"
    }
  }
}

# =====================================
# Cloud Memorystore (Redis)
# =====================================

resource "google_redis_instance" "cache" {
  name           = "${var.project_name}-redis"
  memory_size_gb = var.redis_memory_gb
  region         = var.region

  # Auth enabled for security
  auth_enabled = true
  auth_string  = random_password.redis_auth_string.result

  # Production configuration
  tier               = var.environment == "production" ? "STANDARD_HA" : "BASIC"
  redis_version      = "REDIS_7_0"
  display_name       = "SiteCraft Redis Cache"
  reserved_ip_range  = "192.168.0.0/29"
  authorized_network = google_compute_network.sitecraft_vpc.id

  depends_on = [google_project_service.required_apis]
}

# =====================================
# Service Accounts
# =====================================

# Firebase Admin Service Account
resource "google_service_account" "firebase_admin" {
  account_id   = "firebase-admin"
  display_name = "Firebase Admin SDK Service Account"
  description  = "Service account for Firebase Admin SDK operations"
}

# Storage Admin Service Account
resource "google_service_account" "storage_admin" {
  account_id   = "storage-admin"
  display_name = "Storage Admin Service Account"
  description  = "Service account for Cloud Storage operations"
}

# Backend Application Service Account
resource "google_service_account" "backend_app" {
  account_id   = "backend-app"
  display_name = "Backend Application Service Account"
  description  = "Main service account for backend application"
}

# =====================================
# IAM Permissions
# =====================================

# Firebase Admin permissions
resource "google_project_iam_member" "firebase_admin_firebase" {
  project = var.project_id
  role    = "roles/firebase.admin"
  member  = "serviceAccount:${google_service_account.firebase_admin.email}"
}

# Storage Admin permissions
resource "google_project_iam_member" "storage_admin_storage" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.storage_admin.email}"
}

# Backend App permissions
resource "google_project_iam_member" "backend_app_sql" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.backend_app.email}"
}

resource "google_project_iam_member" "backend_app_storage" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.backend_app.email}"
}

resource "google_project_iam_member" "backend_app_secrets" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.backend_app.email}"
}

# =====================================
# Secret Manager
# =====================================

# Database passwords
resource "google_secret_manager_secret" "db_password" {
  secret_id = "db-password"
  
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "db_password_version" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = random_password.app_user_password.result
}

resource "google_secret_manager_secret" "postgres_password" {
  secret_id = "postgres-password"
  
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "postgres_password_version" {
  secret      = google_secret_manager_secret.postgres_password.id
  secret_data = random_password.postgres_password.result
}

# Redis auth string
resource "google_secret_manager_secret" "redis_auth" {
  secret_id = "redis-auth-string"
  
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "redis_auth_version" {
  secret      = google_secret_manager_secret.redis_auth.id
  secret_data = random_password.redis_auth_string.result
}

# Firebase service account key (placeholder - will be created manually)
resource "google_secret_manager_secret" "firebase_private_key" {
  secret_id = "firebase-private-key"
  
  replication {
    auto {}
  }
}