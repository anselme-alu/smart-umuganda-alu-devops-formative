variable "name_prefix" {
  description = "Prefix applied to all resource names and Name tags."
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs the DB subnet group spans (need >= 2 AZs)."
  type        = list(string)
}

variable "db_security_group_id" {
  description = "Security group controlling access to the database."
  type        = string
}

variable "db_name" {
  description = "Name of the initial database."
  type        = string
}

variable "db_username" {
  description = "Master username."
  type        = string
}

variable "db_password" {
  description = "Master password."
  type        = string
  sensitive   = true
}

variable "engine_version" {
  description = "PostgreSQL major engine version."
  type        = string
}

variable "instance_class" {
  description = "RDS instance class."
  type        = string
}

variable "allocated_storage" {
  description = "Allocated storage in GiB."
  type        = number
}

variable "backup_retention_period" {
  description = "Days of automated backups to retain. 0 disables backups (required for AWS free-tier accounts)."
  type        = number
  default     = 0
}
