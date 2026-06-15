output "instance_id" {
  description = "EC2 instance ID for the staging Docker Compose host."
  value       = aws_instance.app.id
}

output "public_ip" {
  description = "Elastic public IP for the staging host. The deploy workflow reads this directly from Terraform output."
  value       = aws_eip.app.public_ip
}

output "ssh_username" {
  description = "Default SSH username for the selected Amazon Linux AMI."
  value       = "ec2-user"
}

output "security_group_id" {
  description = "Security group attached to the staging host."
  value       = aws_security_group.app.id
}
