variable "aws_region" {
  description = "AWS region to deploy all resources into."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Short project identifier, used as a prefix for resource names and tags."
  type        = string
  default     = "smart-umuganda"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,30}$", var.project_name))
    error_message = "project_name must be lowercase alphanumeric/hyphens and start with a letter."
  }
}

variable "environment" {
  description = "Deployment environment (e.g. dev, staging, prod). Feeds resource names and tags."
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be one of: dev, staging, prod."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for the public subnets (one per AZ). Hosts the application instance."
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for the private subnets (one per AZ). Hosts the managed database."
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24"]
}

variable "instance_type" {
  description = "EC2 instance type for the application host. t3.micro is the smallest free-tier-eligible size."
  type        = string
  default     = "t3.micro"
}

variable "root_volume_size" {
  description = "Root EBS volume size in GiB. 20 is the practical minimum: the on-instance Docker builds of both Node images need this much scratch space."
  type        = number
  default     = 20
}

variable "ssh_public_key" {
  description = <<-EOT
    Public SSH key material to install on the instance for administrative access.
    Leave empty to skip creating a key pair (no SSH). Generate one with:
      ssh-keygen -t ed25519 -f ./smart-umuganda-key
    then set this to the contents of ./smart-umuganda-key.pub
  EOT
  type        = string
  default     = ""
}

variable "ssh_allowed_cidr" {
  description = "CIDR range permitted to reach the instance over SSH (port 22). Restrict this to your IP in production."
  type        = string
  default     = "0.0.0.0/0"

  validation {
    condition     = can(cidrhost(var.ssh_allowed_cidr, 0))
    error_message = "ssh_allowed_cidr must be a valid CIDR block, e.g. 203.0.113.4/32."
  }
}

variable "app_frontend_port" {
  description = "Host port the frontend (nginx) is exposed on."
  type        = number
  default     = 80
}

variable "app_backend_port" {
  description = "Host port the backend API is exposed on."
  type        = number
  default     = 8000
}

variable "db_name" {
  description = "Name of the initial PostgreSQL database."
  type        = string
  default     = "smart_umuganda"
}

variable "db_username" {
  description = "Master username for the PostgreSQL instance."
  type        = string
  default     = "umuganda_admin"
}

variable "db_password" {
  description = <<-EOT
    Master password for the PostgreSQL instance. Leave null/empty to have a
    strong password generated automatically (recommended — nothing is hardcoded).
    Never commit a real value; supply it via TF_VAR_db_password or a secrets manager.
  EOT
  type        = string
  default     = null
  sensitive   = true
}

variable "db_engine_version" {
  description = "Major PostgreSQL engine version for RDS."
  type        = string
  default     = "16"
}

variable "db_instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Allocated storage for the database, in GiB."
  type        = number
  default     = 20
}

variable "db_backup_retention_period" {
  description = <<-EOT
    Days of automated RDS backups to retain. Defaults to 0 (backups disabled),
    which is required for AWS free-tier/free-plan accounts. Set to 1-35 on a
    paid account to enable point-in-time recovery.
  EOT
  type        = number
  default     = 0
}
