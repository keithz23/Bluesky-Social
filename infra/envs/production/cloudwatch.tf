resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/social-fe"
  retention_in_days = 14

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/social-be"
  retention_in_days = 14

  tags = local.common_tags
}
