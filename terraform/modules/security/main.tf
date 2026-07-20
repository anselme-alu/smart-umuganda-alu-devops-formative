resource "aws_security_group" "app" {
  name        = "${var.name_prefix}-app-sg"
  description = "Allow web, API and SSH traffic to the application instance"
  vpc_id      = var.vpc_id

  tags = {
    Name = "${var.name_prefix}-app-sg"
  }
}

resource "aws_vpc_security_group_ingress_rule" "app_frontend" {
  security_group_id = aws_security_group.app.id
  description       = "Frontend (nginx) HTTP access from anywhere"
  ip_protocol       = "tcp"
  from_port         = var.frontend_port
  to_port           = var.frontend_port
  cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_vpc_security_group_ingress_rule" "app_backend" {
  security_group_id = aws_security_group.app.id
  description       = "Backend API access from anywhere"
  ip_protocol       = "tcp"
  from_port         = var.backend_port
  to_port           = var.backend_port
  cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_vpc_security_group_ingress_rule" "app_ssh" {
  security_group_id = aws_security_group.app.id
  description       = "SSH administrative access from the allowed range"
  ip_protocol       = "tcp"
  from_port         = 22
  to_port           = 22
  cidr_ipv4         = var.ssh_allowed_cidr
}

resource "aws_vpc_security_group_egress_rule" "app_all" {
  security_group_id = aws_security_group.app.id
  description       = "Allow all outbound traffic"
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
}

# Accepts PostgreSQL only from the application security group.
resource "aws_security_group" "db" {
  name        = "${var.name_prefix}-db-sg"
  description = "Allow PostgreSQL access from the application tier only"
  vpc_id      = var.vpc_id

  tags = {
    Name = "${var.name_prefix}-db-sg"
  }
}

resource "aws_vpc_security_group_ingress_rule" "db_postgres" {
  security_group_id            = aws_security_group.db.id
  description                  = "PostgreSQL from the application security group"
  ip_protocol                  = "tcp"
  from_port                    = var.db_port
  to_port                      = var.db_port
  referenced_security_group_id = aws_security_group.app.id
}

resource "aws_vpc_security_group_egress_rule" "db_all" {
  security_group_id = aws_security_group.db.id
  description       = "Allow all outbound traffic"
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
}
