# ---------------------------------------------------------
# ECS CPU Alarm
# ---------------------------------------------------------

resource "aws_cloudwatch_metric_alarm" "ecs_cpu" {
  alarm_name = "${var.project_name}-ecs-high-cpu-${var.environment}"

  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"

  period    = 300
  statistic = "Average"

  threshold = 80

  alarm_description = "ECS CPU utilization is above 80%."

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_name
  }

  alarm_actions = [
    var.sns_topic_arn
  ]

  tags = {
    Name        = "${var.project_name}-ecs-cpu-alarm"
    Environment = var.environment
  }
}


# ---------------------------------------------------------
# ECS Memory Alarm
# ---------------------------------------------------------

resource "aws_cloudwatch_metric_alarm" "ecs_memory" {
  alarm_name = "${var.project_name}-ecs-high-memory-${var.environment}"

  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2

  metric_name = "MemoryUtilization"
  namespace   = "AWS/ECS"

  period    = 300
  statistic = "Average"

  threshold = 80

  alarm_description = "ECS memory utilization is above 80%."

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_name
  }

  alarm_actions = [
    var.sns_topic_arn
  ]

  tags = {
    Name        = "${var.project_name}-ecs-memory-alarm"
    Environment = var.environment
  }
}


# ---------------------------------------------------------
# ALB HTTP 5xx Alarm
# ---------------------------------------------------------

resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name = "${var.project_name}-alb-5xx-${var.environment}"

  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2

  metric_name = "HTTPCode_Target_5XX_Count"
  namespace   = "AWS/ApplicationELB"

  period    = 300
  statistic = "Sum"

  threshold = 5

  alarm_description = "ALB target is returning multiple HTTP 5xx errors."

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
    TargetGroup  = var.target_group_arn_suffix
  }

  alarm_actions = [
    var.sns_topic_arn
  ]

  tags = {
    Name        = "${var.project_name}-alb-5xx-alarm"
    Environment = var.environment
  }
}


# ---------------------------------------------------------
# RDS CPU Alarm
# ---------------------------------------------------------

resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name = "${var.project_name}-rds-high-cpu-${var.environment}"

  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2

  metric_name = "CPUUtilization"
  namespace   = "AWS/RDS"

  period    = 300
  statistic = "Average"

  threshold = 80

  alarm_description = "RDS CPU utilization is above 80%."

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_identifier
  }

  alarm_actions = [
    var.sns_topic_arn
  ]

  tags = {
    Name        = "${var.project_name}-rds-cpu-alarm"
    Environment = var.environment
  }
}