data "aws_availability_zones" "available" {
  state = "available"
}

resource "random_password" "db" {
  length  = 24
  special = false
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"
  db_password = coalesce(var.db_password, random_password.db.result)
  azs         = slice(data.aws_availability_zones.available.names, 0, 2)
}

module "network" {
  source = "./modules/network"

  name_prefix          = local.name_prefix
  vpc_cidr             = var.vpc_cidr
  availability_zones   = local.azs
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
}

module "security" {
  source = "./modules/security"

  name_prefix      = local.name_prefix
  vpc_id           = module.network.vpc_id
  ssh_allowed_cidr = var.ssh_allowed_cidr
  frontend_port    = var.app_frontend_port
  backend_port     = var.app_backend_port
  db_port          = 5432
}

module "database" {
  source = "./modules/database"

  name_prefix             = local.name_prefix
  private_subnet_ids      = module.network.private_subnet_ids
  db_security_group_id    = module.security.db_security_group_id
  db_name                 = var.db_name
  db_username             = var.db_username
  db_password             = local.db_password
  engine_version          = var.db_engine_version
  instance_class          = var.db_instance_class
  allocated_storage       = var.db_allocated_storage
  backup_retention_period = var.db_backup_retention_period
}

module "compute" {
  source = "./modules/compute"

  name_prefix        = local.name_prefix
  subnet_id          = module.network.public_subnet_ids[0]
  security_group_ids = [module.security.app_security_group_id]
  instance_type      = var.instance_type
  root_volume_size   = var.root_volume_size
  ssh_public_key     = var.ssh_public_key
}
