variable "aws_region" {
    description = "AWS region where the infrastructure will be deployed"
    type = string
    default = "us-east-1"
}

variable "environment" {
    description = "Deployment environment"
    type = string
    default = "aws"
}