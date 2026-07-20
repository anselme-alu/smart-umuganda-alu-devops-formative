output "instance_id" {
  description = "EC2 instance ID."
  value       = aws_instance.this.id
}

output "public_ip" {
  description = "Elastic (static) public IP of the instance."
  value       = aws_eip.this.public_ip
}

output "private_ip" {
  description = "Private IP of the instance within the VPC."
  value       = aws_instance.this.private_ip
}

output "ami_id" {
  description = "AMI the instance was launched from."
  value       = data.aws_ami.ubuntu.id
}
