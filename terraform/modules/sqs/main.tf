# ---------------------------------------------------------
# Dead Letter Queue
# ---------------------------------------------------------

resource "aws_sqs_queue" "dlq" {
  name = "${var.project_name}-dlq-${var.environment}"

  message_retention_seconds = 1209600

  tags = {
    Name        = "${var.project_name}-dlq-${var.environment}"
    Environment = var.environment
  }
}


# ---------------------------------------------------------
# Main Application Queue
# ---------------------------------------------------------

resource "aws_sqs_queue" "app" {
  name = "${var.project_name}-queue-${var.environment}"

  visibility_timeout_seconds = 60
  message_retention_seconds  = 345600

  receive_wait_time_seconds = 20

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = 5
  })

  tags = {
    Name        = "${var.project_name}-queue-${var.environment}"
    Environment = var.environment
  }
}