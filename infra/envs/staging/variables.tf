variable "project_name" {
  description = "Project name used for AWS resource names and tags."
  type        = string
  default     = "social"
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "staging"
}

variable "aws_region" {
  description = "AWS region for the staging infrastructure."
  type        = string
  default     = "ap-southeast-1"
}

variable "instance_type" {
  description = "EC2 instance type for the Docker Compose host."
  type        = string
  default     = "t3.small"
}

variable "key_name" {
  description = "Existing EC2 key pair name used for SSH access."
  type        = string
}

variable "ssh_cidr_blocks" {
  description = "CIDR blocks allowed to SSH into the EC2 instance."
  type        = list(string)
}

variable "allowed_http_cidr_blocks" {
  description = "CIDR blocks allowed to access HTTP and HTTPS."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "root_volume_size" {
  description = "Root EBS volume size in GiB."
  type        = number
  default     = 30
}
