output "queue_name" {
  value = aws_sqs_queue.app.name
}

output "queue_url" {
  value = aws_sqs_queue.app.url
}

output "queue_arn" {
  value = aws_sqs_queue.app.arn
}

output "dlq_name" {
  value = aws_sqs_queue.dlq.name
}

output "dlq_arn" {
  value = aws_sqs_queue.dlq.arn
}