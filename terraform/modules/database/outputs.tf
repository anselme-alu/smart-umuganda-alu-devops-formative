output "db_address" {
  description = "Hostname of the database (no port)."
  value       = aws_db_instance.this.address
}

output "db_port" {
  description = "Port the database listens on."
  value       = aws_db_instance.this.port
}

output "db_endpoint" {
  description = "Connection endpoint in host:port form."
  value       = aws_db_instance.this.endpoint
}

output "db_identifier" {
  description = "RDS instance identifier."
  value       = aws_db_instance.this.identifier
}
