resource "aws_db_subnet_group" "postgres" {
  name       = "${local.name_prefix}-postgres-subnet-group"
  subnet_ids = [for key in local.database_subnet_keys : aws_subnet.this[key].id]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-postgres-subnet-group"
  })
}

resource "aws_db_instance" "postgres" {
  identifier              = var.rds_identifier
  allocated_storage       = var.rds_allocated_storage
  engine                  = "postgres"
  engine_version          = "17"
  instance_class          = var.rds_instance_class
  db_name                 = "social"
  username                = var.rds_username
  password                = var.rds_password
  db_subnet_group_name    = aws_db_subnet_group.postgres.name
  vpc_security_group_ids  = [aws_security_group.data.id]
  publicly_accessible     = false
  skip_final_snapshot     = true
  storage_encrypted       = true
  backup_retention_period = 7

  lifecycle {
    prevent_destroy = true
    ignore_changes = [
      password,
      engine_version,
    ]
  }

  tags = merge(local.common_tags, {
    Name = var.rds_identifier
  })
}
