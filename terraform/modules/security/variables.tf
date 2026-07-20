variable "name_prefix" {
  description = "Prefix applied to all resource names and Name tags."
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC the security groups belong to."
  type        = string
}

variable "ssh_allowed_cidr" {
  description = "CIDR range allowed to reach the instance over SSH."
  type        = string
}

variable "frontend_port" {
  description = "Port the frontend is exposed on."
  type        = number
}

variable "backend_port" {
  description = "Port the backend API is exposed on."
  type        = number
}

variable "db_port" {
  description = "Port the database listens on."
  type        = number
  default     = 5432
}
