variable "aws_region" {
  type    = string
  default = "ap-southeast-1"
}

variable "project_name" {
  type    = string
  default = "social"
}

variable "environment" {
  type    = string
  default = "production"
}

variable "domain_name" {
  type    = string
  default = "th-red.app"
}

variable "api_domain_name" {
  type    = string
  default = "api.th-red.app"
}

variable "certificate_arn" {
  description = "ACM certificate ARN used by the ALB HTTPS listener."
  type        = string
  default     = ""
}

variable "vpc_cidr_block" {
  type    = string
  default = "10.0.0.0/16"
}

variable "subnets" {
  description = "Existing production subnets to import/manage."
  type = map(object({
    cidr_block        = string
    availability_zone = string
    public            = bool
    name              = string
  }))
  default = {
    public_a = {
      cidr_block        = "10.0.0.0/20"
      availability_zone = "ap-southeast-1a"
      public            = true
      name              = "subnet-public1-ap-southeast-1a"
    }
    app_b = {
      cidr_block        = "10.0.16.0/20"
      availability_zone = "ap-southeast-1b"
      public            = true
      name              = "subnet-public2-ap-southeast-1b"
    }
    private_b = {
      cidr_block        = "10.0.144.0/20"
      availability_zone = "ap-southeast-1b"
      public            = false
      name              = "subnet-private2-ap-southeast-1b"
    }
  }
}

variable "frontend_image" {
  description = "Frontend container image URI."
  type        = string
  default     = "061093365552.dkr.ecr.ap-southeast-1.amazonaws.com/social-fe:latest"
}

variable "backend_image" {
  description = "Backend container image URI."
  type        = string
  default     = "061093365552.dkr.ecr.ap-southeast-1.amazonaws.com/social-be:latest"
}

variable "frontend_desired_count" {
  type    = number
  default = 1
}

variable "backend_desired_count" {
  type    = number
  default = 1
}

variable "frontend_cpu" {
  type    = number
  default = 256
}

variable "frontend_memory" {
  type    = number
  default = 512
}

variable "backend_cpu" {
  type    = number
  default = 512
}

variable "backend_memory" {
  type    = number
  default = 1024
}

variable "database_url" {
  description = "Production PostgreSQL DATABASE_URL. Prefer moving this to Secrets Manager/SSM before enabling apply in CI."
  type        = string
  sensitive   = true
  default     = ""
}

variable "jwt_secret" {
  type      = string
  sensitive = true
  default   = ""
}

variable "jwt_refresh_secret" {
  type      = string
  sensitive = true
  default   = ""
}

variable "redis_host" {
  type    = string
  default = ""
}

variable "redis_port" {
  type    = number
  default = 6379
}

variable "s3_media_bucket_name" {
  type    = string
  default = "social-media-production"
}

variable "rds_identifier" {
  type    = string
  default = "social-db"
}

variable "rds_username" {
  type    = string
  default = "postgres"
}

variable "rds_password" {
  type      = string
  sensitive = true
  default   = ""
}

variable "rds_instance_class" {
  type    = string
  default = "db.t4g.micro"
}

variable "rds_allocated_storage" {
  type    = number
  default = 20
}

variable "redis_serverless_cache_name" {
  type    = string
  default = "social-elasticache"
}
