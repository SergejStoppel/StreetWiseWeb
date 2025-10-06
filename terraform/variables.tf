# =====================================
# SiteCraft Terraform Variables
# =====================================

variable "project_id" {
  description = "The Google Cloud Project ID"
  type        = string
  default     = "street-wise-web"
}

variable "project_name" {
  description = "The project name for resource naming"
  type        = string
  default     = "street-wise-web"
}

variable "region" {
  description = "The Google Cloud region"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "The Google Cloud zone"
  type        = string
  default     = "us-central1-a"
}

variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
  default     = "development"
  
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be development, staging, or production."
  }
}

# =====================================
# Database Variables
# =====================================

variable "database_name" {
  description = "Name of the application database"
  type        = string
  default     = "streetwiseweb"
}

variable "db_user" {
  description = "Database application user name"
  type        = string
  default     = "streetwise_app"
}

variable "db_tier" {
  description = "Cloud SQL instance tier"
  type        = string
  default     = "db-g1-small"
  
  validation {
    condition = contains([
      "db-f1-micro", "db-g1-small", "db-n1-standard-1", 
      "db-n1-standard-2", "db-n1-standard-4", "db-n1-standard-8"
    ], var.db_tier)
    error_message = "Invalid database tier specified."
  }
}

variable "db_disk_size" {
  description = "Database disk size in GB"
  type        = number
  default     = 20
  
  validation {
    condition     = var.db_disk_size >= 10 && var.db_disk_size <= 65536
    error_message = "Database disk size must be between 10 GB and 65536 GB."
  }
}

# =====================================
# Redis Variables
# =====================================

variable "redis_memory_gb" {
  description = "Redis memory size in GB"
  type        = number
  default     = 1
  
  validation {
    condition     = var.redis_memory_gb >= 1 && var.redis_memory_gb <= 300
    error_message = "Redis memory must be between 1 GB and 300 GB."
  }
}

# =====================================
# Network Variables
# =====================================

variable "cors_origins" {
  description = "List of allowed CORS origins"
  type        = list(string)
  default     = ["http://localhost:3000", "https://localhost:3000"]
}

# =====================================
# Firebase Variables
# =====================================

variable "firebase_project_id" {
  description = "Firebase project ID (usually same as GCP project)"
  type        = string
  default     = "street-wise-web"
}

# =====================================
# Feature Toggles
# =====================================

variable "enable_private_networking" {
  description = "Enable private networking for resources"
  type        = bool
  default     = true
}

variable "enable_backup_retention" {
  description = "Enable extended backup retention"
  type        = bool
  default     = true
}

variable "enable_monitoring" {
  description = "Enable detailed monitoring"
  type        = bool
  default     = true
}

# =====================================
# Tags and Labels
# =====================================

variable "labels" {
  description = "A map of labels to apply to resources"
  type        = map(string)
  default = {
    project     = "sitecraft"
    environment = "development"
    managed_by  = "terraform"
  }
}