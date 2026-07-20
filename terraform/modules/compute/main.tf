data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_key_pair" "this" {
  count = var.ssh_public_key == "" ? 0 : 1

  key_name   = "${var.name_prefix}-key"
  public_key = var.ssh_public_key
}

resource "aws_eip" "this" {
  domain = "vpc"

  tags = {
    Name = "${var.name_prefix}-eip"
  }
}

# Provisioned bare; configured and deployed by Ansible (see ../../../ansible).
resource "aws_instance" "this" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  subnet_id              = var.subnet_id
  vpc_security_group_ids = var.security_group_ids
  key_name               = var.ssh_public_key == "" ? null : aws_key_pair.this[0].key_name

  user_data_replace_on_change = true

  root_block_device {
    volume_size = var.root_volume_size
    volume_type = "gp3"
    encrypted   = true
  }

  # Require IMDSv2.
  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  tags = {
    Name = "${var.name_prefix}-app"
  }
}

resource "aws_eip_association" "this" {
  instance_id   = aws_instance.this.id
  allocation_id = aws_eip.this.id
}
