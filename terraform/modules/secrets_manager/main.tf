resource "aws_secretsmanager_secret" "database" {
  name = "${var.project_name}/database/${var.environment}"

  description = "PostgreSQL credentials for the expense tracker"

  tags = {
    Name        = "${var.project_name}-database-secret"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "database" {
  secret_id = aws_secretsmanager_secret.database.id

  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password
    dbname   = var.db_name
  })
}