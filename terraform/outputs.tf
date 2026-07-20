output "vpc_id" {
  description = "ID of the VPC."
  value       = module.network.vpc_id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets (application tier)."
  value       = module.network.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets (database tier)."
  value       = module.network.private_subnet_ids
}

output "app_security_group_id" {
  description = "Security group protecting the application instance."
  value       = module.security.app_security_group_id
}

output "db_security_group_id" {
  description = "Security group protecting the database."
  value       = module.security.db_security_group_id
}

output "instance_id" {
  description = "EC2 instance ID of the application host."
  value       = module.compute.instance_id
}

output "instance_public_ip" {
  description = "Static (Elastic) public IP of the application host."
  value       = module.compute.public_ip
}

output "application_url" {
  description = "Open this in a browser to reach the frontend."
  value       = "http://${module.compute.public_ip}${var.app_frontend_port == 80 ? "" : ":${var.app_frontend_port}"}"
}

output "api_url" {
  description = "Base URL of the backend API."
  value       = "http://${module.compute.public_ip}:${var.app_backend_port}/api"
}

output "ssh_command" {
  description = "Convenience SSH command (only meaningful if ssh_public_key was set)."
  value       = var.ssh_public_key == "" ? "SSH disabled — no ssh_public_key provided." : "ssh ubuntu@${module.compute.public_ip}"
}

output "db_endpoint" {
  description = "RDS endpoint (host:port)."
  value       = module.database.db_endpoint
}

output "db_address" {
  description = "RDS hostname (no port). Feed this to Ansible as db_host."
  value       = module.database.db_address
}

output "db_port" {
  description = "Port the database listens on."
  value       = module.database.db_port
}

output "db_name" {
  description = "Initial database name."
  value       = var.db_name
}

output "db_username" {
  description = "Database master username."
  value       = var.db_username
}

output "db_password" {
  description = "Database master password (sensitive). Feed this to Ansible via vault."
  value       = local.db_password
  sensitive   = true
}

output "db_identifier" {
  description = "RDS instance identifier."
  value       = module.database.db_identifier
}

output "database_connection_string" {
  description = "Full PostgreSQL connection string used by the backend (sensitive)."
  value       = "postgres://${var.db_username}:${local.db_password}@${module.database.db_endpoint}/${var.db_name}?sslmode=no-verify"
  sensitive   = true
}
