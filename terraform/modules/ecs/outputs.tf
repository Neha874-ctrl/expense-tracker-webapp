output "cluster_id" {
  value = aws_ecs_cluster.main.id
}

output "cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "task_definition_arn" {
  value = aws_ecs_task_definition.backend.arn
}

output "service_name" {
  value = aws_ecs_service.backend.name
}
output "autoscaling_min_capacity" {
  description = "Minimum number of ECS tasks"
  value       = aws_appautoscaling_target.backend.min_capacity
}

output "autoscaling_max_capacity" {
  description = "Maximum number of ECS tasks"
  value       = aws_appautoscaling_target.backend.max_capacity
}
output "autoscaling_policy_arn" {
  description = "ARN of the ECS CPU autoscaling policy"
  value       = aws_appautoscaling_policy.backend_cpu.arn
}