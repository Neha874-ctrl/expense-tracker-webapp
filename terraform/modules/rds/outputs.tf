output "db_instance_id" {
  value = aws_db_instance.postgres.id
}

output "db_endpoint" {
  value = aws_db_instance.postgres.address
}

output "db_port" {
  value = aws_db_instance.postgres.port
}

output "db_name" {
  value = aws_db_instance.postgres.db_name
}

output "db_username" {
  value     = aws_db_instance.postgres.username
  sensitive = true
}

output "db_instance_identifier" {
  value = aws_db_instance.postgres.identifier
}