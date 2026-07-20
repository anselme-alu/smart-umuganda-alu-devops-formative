variable "name_prefix" {
  description = "Prefix applied to all resource names and Name tags."
  type        = string
}

variable "subnet_id" {
  description = "Public subnet the instance is launched into."
  type        = string
}

variable "security_group_ids" {
  description = "Security groups attached to the instance."
  type        = list(string)
}

variable "instance_type" {
  description = "EC2 instance type."
  type        = string
}

variable "root_volume_size" {
  description = "Root EBS volume size in GiB."
  type        = number
  default     = 20
}

variable "ssh_public_key" {
  description = "Public SSH key material. Empty string disables SSH key creation."
  type        = string
  default     = ""
}
