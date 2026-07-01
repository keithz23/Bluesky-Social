resource "aws_elasticache_serverless_cache" "redis" {
  name        = var.redis_serverless_cache_name
  engine      = "redis"
  description = "Redis cache for ${local.name_prefix}"

  security_group_ids = [aws_security_group.data.id]
  subnet_ids         = [for key in local.database_subnet_keys : aws_subnet.this[key].id]

  tags = merge(local.common_tags, {
    Name = var.redis_serverless_cache_name
  })
}
