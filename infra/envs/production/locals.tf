locals {
  name_prefix = "${var.project_name}-${var.environment}"

  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  frontend_port = 3000
  backend_port  = 8000

  app_subnet_keys      = ["public_a", "app_b"]
  database_subnet_keys = ["public_a", "private_b"]

  cors_origin  = "https://${var.domain_name},https://www.${var.domain_name}"
  database_url = "postgresql://${var.rds_username}:${var.rds_password}@${aws_db_instance.postgres.address}:5432/social"

  backend_environment = [
    { name = "NODE_ENV", value = "production" },
    { name = "PORT", value = tostring(local.backend_port) },
    { name = "API_PREFIX", value = "api/v1" },
    { name = "DATABASE_URL", value = local.database_url },
    { name = "REDIS_HOST", value = aws_elasticache_serverless_cache.redis.endpoint[0].address },
    { name = "REDIS_PORT", value = tostring(var.redis_port) },
    { name = "REDIS_TLS", value = "true" },
    { name = "REDIS_BULL_PREFIX", value = "{bull}" },
    { name = "SOCKET_REDIS_ADAPTER_ENABLED", value = "false" },
    { name = "CLIENT_URL", value = "https://${var.domain_name}" },
    { name = "SERVER_URL", value = "https://${var.api_domain_name}/api/v1" },
    { name = "CORS_ORIGIN", value = local.cors_origin },
    { name = "CORS_CREDENTIALS", value = "true" },
    { name = "JWT_SECRET", value = var.jwt_secret },
    { name = "JWT_REFRESH_SECRET", value = var.jwt_refresh_secret },
    { name = "GOOGLE_CLIENT_ID", value = var.google_client_id },
    { name = "GOOGLE_CLIENT_SECRET", value = var.google_client_secret },
    { name = "GOOGLE_CALLBACK_URL", value = "https://${var.api_domain_name}/api/v1/auth/google/callback" }
  ]

  frontend_environment = [
    { name = "NODE_ENV", value = "production" },
    { name = "NEXT_PUBLIC_API_URL", value = "https://${var.api_domain_name}/api/v1" },
    { name = "NEXT_PUBLIC_SERVER_URL", value = "https://${var.api_domain_name}" }
  ]
}
