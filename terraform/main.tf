module "vpc" {
  source = "./modules/vpc"

  project_name = "expense-tracker"
  environment  = var.environment
}


module "security_groups" {
  source = "./modules/security_groups"

  project_name = "expense-tracker"
  environment  = var.environment
  vpc_id       = module.vpc.vpc_id
}

module "ecr" {
  source = "./modules/ecr"

  project_name = "expense-tracker"
  environment  = var.environment
}
module "iam" {
  source = "./modules/iam"

  project_name = "expense-tracker"
  environment  = var.environment
}
module "rds" {
  source = "./modules/rds"

  project_name = "expense-tracker"
  environment  = var.environment

  private_subnet_ids = module.vpc.private_subnet_ids
  security_group_id  = module.security_groups.rds_security_group_id

  db_name     = var.db_name
  db_username = var.db_username
  db_password = var.db_password
}

module "s3" {
  source = "./modules/s3"

  project_name = "expense-tracker"
  environment  = var.environment
}

module "sqs" {
  source = "./modules/sqs"

  project_name = "expense-tracker"
  environment  = var.environment
}
module "secrets_manager" {
  source = "./modules/secrets_manager"

  project_name = "expense-tracker"
  environment  = var.environment

  db_username = var.db_username
  db_password = var.db_password
  db_name     = var.db_name
}

module "cloudwatch" {
  source = "./modules/cloudwatch"

  project_name = "expense-tracker"
  environment  = var.environment
}
module "ecs" {
  source = "./modules/ecs"

  project_name = "expense-tracker"
  environment  = var.environment

  execution_role_arn = module.iam.ecs_execution_role_arn
  task_role_arn      = module.iam.ecs_task_role_arn

  ecr_repository_url = module.ecr.repository_url
  log_group_name     = module.cloudwatch.log_group_name

  container_port = 5000
}