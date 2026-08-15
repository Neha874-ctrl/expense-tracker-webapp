output "aws_region" {
  value = var.aws_region
}

output "environment" {
  value = var.environment
}
output "vpc_id" {
  value = module.vpc.vpc_id
}

output "public_subnet_ids" {
  value = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  value = module.vpc.private_subnet_ids
}

output "alb_security_group_id" {
  value = module.security_groups.alb_security_group_id
}

output "ecs_security_group_id" {
  value = module.security_groups.ecs_security_group_id
}

output "rds_security_group_id" {
  value = module.security_groups.rds_security_group_id
}

output "redis_security_group_id" {
  value = module.security_groups.redis_security_group_id
}

output "ecr_repository_name" {
  value = module.ecr.repository_name
}

output "ecr_repository_url" {
  value = module.ecr.repository_url
}

output "ecr_repository_arn" {
  value = module.ecr.repository_arn
}

output "ecs_execution_role_arn" {
  value = module.iam.ecs_execution_role_arn
}

output "ecs_task_role_arn" {
  value = module.iam.ecs_task_role_arn
}
output "rds_endpoint" {
  value = module.rds.db_endpoint
}

output "rds_port" {
  value = module.rds.db_port
}

output "rds_db_name" {
  value = module.rds.db_name
}

output "s3_bucket_name" {
  value = module.s3.bucket_name
}

output "s3_bucket_arn" {
  value = module.s3.bucket_arn
}

output "sqs_queue_name" {
  value = module.sqs.queue_name
}

output "sqs_queue_url" {
  value = module.sqs.queue_url
}

output "sqs_queue_arn" {
  value = module.sqs.queue_arn
}

output "sqs_dlq_arn" {
  value = module.sqs.dlq_arn
}
output "database_secret_arn" {
  value = module.secrets_manager.database_secret_arn
}

output "database_secret_name" {
  value = module.secrets_manager.database_secret_name
}
output "cloudwatch_log_group_name" {
  value = module.cloudwatch.log_group_name
}

output "cloudwatch_log_group_arn" {
  value = module.cloudwatch.log_group_arn
}
output "ecs_cluster_name" {
  value = module.ecs.cluster_name
}

output "ecs_task_definition_arn" {
  value = module.ecs.task_definition_arn
}
output "alb_dns_name" {
  value = module.alb.alb_dns_name
}

output "alb_target_group_arn" {
  value = module.alb.target_group_arn
}

output "alb_listener_arn" {
  value = module.alb.listener_arn
}

output "sns_topic_arn" {
  value = module.sns.topic_arn
}

output "sns_topic_name" {
  value = module.sns.topic_name
}

output "service_name" {
  value = aws_ecs_service.backend.name
}
output "alb_arn_suffix" {
  value = aws_lb.main.arn_suffix
}

output "target_group_arn_suffix" {
  value = aws_lb_target_group.backend.arn_suffix
}
output "db_instance_identifier" {
  value = aws_db_instance.main.identifier
}