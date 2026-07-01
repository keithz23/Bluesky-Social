resource "aws_ecs_cluster" "main" {
  name = "${local.name_prefix}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = local.common_tags
}

resource "aws_ecs_task_definition" "frontend" {
  family                   = "social-frontend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = tostring(var.frontend_cpu)
  memory                   = tostring(var.frontend_memory)
  execution_role_arn       = aws_iam_role.task_execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([
    {
      name      = "social-fe"
      image     = var.frontend_image
      essential = true

      portMappings = [
        {
          containerPort = local.frontend_port
          hostPort      = local.frontend_port
          protocol      = "tcp"
        }
      ]

      environment = local.frontend_environment

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.frontend.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "social-backend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = tostring(var.backend_cpu)
  memory                   = tostring(var.backend_memory)
  execution_role_arn       = aws_iam_role.task_execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([
    {
      name      = "social-be"
      image     = var.backend_image
      essential = true

      portMappings = [
        {
          containerPort = local.backend_port
          hostPort      = local.backend_port
          protocol      = "tcp"
        }
      ]

      environment = local.backend_environment

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.backend.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "frontend" {
  name            = "social-frontend-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = var.frontend_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [for key in local.app_subnet_keys : aws_subnet.this[key].id]
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend.arn
    container_name   = "social-fe"
    container_port   = local.frontend_port
  }

  lifecycle {
    ignore_changes = [task_definition]
  }

  depends_on = [aws_lb_listener.https]
}

resource "aws_ecs_service" "backend" {
  name            = "social-backend-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = var.backend_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [for key in local.app_subnet_keys : aws_subnet.this[key].id]
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "social-be"
    container_port   = local.backend_port
  }

  lifecycle {
    ignore_changes = [task_definition]
  }

  depends_on = [aws_lb_listener_rule.api]
}
