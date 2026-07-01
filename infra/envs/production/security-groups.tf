resource "aws_security_group" "alb" {
  name        = "social-alb-sg"
  description = "Public ALB security group"
  vpc_id      = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "social-alb-sg"
  })
}

resource "aws_security_group" "ecs" {
  name        = "social-ecs-sg"
  description = "ECS service tasks security group"
  vpc_id      = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "social-ecs-sg"
  })
}

resource "aws_security_group" "data" {
  name        = "social-rds-redis-sg"
  description = "RDS and ElastiCache access from ECS"
  vpc_id      = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "social-rds-redis-sg"
  })
}

resource "aws_security_group_rule" "alb_http_ingress" {
  type              = "ingress"
  description       = "HTTP redirect to HTTPS"
  security_group_id = aws_security_group.alb.id
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
}

resource "aws_security_group_rule" "alb_https_ingress" {
  type              = "ingress"
  description       = "HTTPS"
  security_group_id = aws_security_group.alb.id
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
}

resource "aws_security_group_rule" "alb_frontend_egress" {
  type                     = "egress"
  description              = "Frontend target group"
  security_group_id        = aws_security_group.alb.id
  from_port                = local.frontend_port
  to_port                  = local.frontend_port
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.ecs.id
}

resource "aws_security_group_rule" "alb_backend_egress" {
  type                     = "egress"
  description              = "Backend target group"
  security_group_id        = aws_security_group.alb.id
  from_port                = local.backend_port
  to_port                  = local.backend_port
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.ecs.id
}

resource "aws_security_group_rule" "ecs_frontend_ingress" {
  type                     = "ingress"
  description              = "Frontend from ALB"
  security_group_id        = aws_security_group.ecs.id
  from_port                = local.frontend_port
  to_port                  = local.frontend_port
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb.id
}

resource "aws_security_group_rule" "ecs_backend_ingress" {
  type                     = "ingress"
  description              = "Backend from ALB"
  security_group_id        = aws_security_group.ecs.id
  from_port                = local.backend_port
  to_port                  = local.backend_port
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb.id
}

resource "aws_security_group_rule" "ecs_all_egress" {
  type              = "egress"
  description       = "All outbound"
  security_group_id = aws_security_group.ecs.id
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
}

resource "aws_security_group_rule" "data_postgres_ingress" {
  type                     = "ingress"
  description              = "PostgreSQL from ECS"
  security_group_id        = aws_security_group.data.id
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.ecs.id
}

resource "aws_security_group_rule" "data_redis_ingress" {
  type                     = "ingress"
  description              = "Redis from ECS"
  security_group_id        = aws_security_group.data.id
  from_port                = 6379
  to_port                  = 6379
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.ecs.id
}

resource "aws_security_group_rule" "data_all_egress" {
  type              = "egress"
  description       = "All outbound"
  security_group_id = aws_security_group.data.id
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
}
