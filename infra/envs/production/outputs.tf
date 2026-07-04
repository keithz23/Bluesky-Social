output "environment" {
  value = var.environment
}

output "region" {
  value = var.aws_region
}

output "alb_dns_name" {
  value = aws_lb.main.dns_name
}

output "frontend_url" {
  value = "https://${var.domain_name}"
}

output "api_url" {
  value = "https://${var.api_domain_name}/api/v1"
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.media.domain_name
}

output "media_domain_name" {
  value = var.media_domain_name
}

output "media_url" {
  value = "https://${var.media_domain_name}"
}
