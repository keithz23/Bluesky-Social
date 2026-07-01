# Production Terraform

This folder is the Terraform entrypoint for the existing AWS ECS production baseline.

The current AWS resources were created manually first, so this Terraform setup must adopt them with `terraform import` before `terraform apply` is used as a normal workflow.

## Init

```powershell
terraform init -reconfigure
terraform fmt -recursive
terraform validate
```

## Important

Do not run `terraform apply` before importing the existing resources. Terraform will try to create duplicate infrastructure if the state is empty.

## Known Existing IDs

Update `terraform.tfvars` with the real values from AWS before importing.

Known from the current setup:

```text
VPC:                 vpc-0db9e2cf7409bdba7
ALB SG:              sg-022aebf316dedcb56
ECS SG:              sg-08ccb35c7b19d08b3
RDS/Redis SG:         sg-0bef16ab643f9e75f
Public subnet A:      subnet-01f5c7062b4352174
Redis private subnet: subnet-04308e0898865ff5f
ALB name:             social-alb
Frontend TG:          tg-social-fe-ip
Backend TG:           tg-social-be-ip
```

Fill in the unknown values from AWS Console:

```text
ACM certificate ARN
second ECS service subnet ID
ALB ARN
HTTP listener ARN
HTTPS listener ARN
API listener rule ARN
target group ARNs
ECS cluster ARN/name
ECS service names
task definition ARNs
RDS subnet group name
RDS instance identifier
ElastiCache serverless cache name
S3 bucket name
IAM role names
CloudWatch log group names
```

## Import Order

Import one group at a time and run `terraform plan` after each group.

### 1. Network

```powershell
terraform import aws_vpc.main vpc-0db9e2cf7409bdba7
terraform import 'aws_subnet.this["public_a"]' subnet-01f5c7062b4352174
terraform import 'aws_subnet.this["app_b"]' <second-ecs-subnet-id>
terraform import 'aws_subnet.this["private_b"]' subnet-04308e0898865ff5f
terraform import aws_internet_gateway.main <igw-id>
terraform import aws_route_table.public <public-route-table-id>
```

### 2. Security Groups

```powershell
terraform import aws_security_group.alb sg-022aebf316dedcb56
terraform import aws_security_group.ecs sg-08ccb35c7b19d08b3
terraform import aws_security_group.data sg-0bef16ab643f9e75f
```

### 3. ALB

```powershell
terraform import aws_lb.main <alb-arn>
terraform import aws_lb_target_group.frontend <frontend-target-group-arn>
terraform import aws_lb_target_group.backend <backend-target-group-arn>
terraform import aws_lb_listener.http <http-listener-arn>
terraform import aws_lb_listener.https <https-listener-arn>
terraform import aws_lb_listener_rule.api <api-listener-rule-arn>
```

### 4. ECR

```powershell
terraform import aws_ecr_repository.frontend social-fe
terraform import aws_ecr_repository.backend social-be
```

### 5. CloudWatch

```powershell
terraform import aws_cloudwatch_log_group.frontend /ecs/social-fe
terraform import aws_cloudwatch_log_group.backend /ecs/social-be
```

### 6. IAM

```powershell
terraform import aws_iam_role.task_execution <task-execution-role-name>
terraform import aws_iam_role.task <task-role-name>
```

### 7. ECS

```powershell
terraform import aws_ecs_cluster.main <ecs-cluster-name-or-arn>
terraform import aws_ecs_task_definition.frontend <frontend-task-definition-arn>
terraform import aws_ecs_task_definition.backend <backend-task-definition-arn>
terraform import aws_ecs_service.frontend <cluster-name>/<frontend-service-name>
terraform import aws_ecs_service.backend <cluster-name>/<backend-service-name>
```

### 8. RDS / Redis / S3

```powershell
terraform import aws_db_subnet_group.postgres <db-subnet-group-name>
terraform import aws_db_instance.postgres social-db
terraform import aws_elasticache_serverless_cache.redis <serverless-cache-name>
terraform import aws_s3_bucket.media <media-bucket-name>
```

## After Each Import

```powershell
terraform plan
```

Adjust the corresponding `.tf` file until Terraform does not want to destroy or recreate the imported resource.
