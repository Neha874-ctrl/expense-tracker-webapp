provider "aws" {
    region = var.aws_region

    default_tags {
      tags = {
        Project = "expense-tracker"
        Environment = var.environment
        ManagedBy = "terraform"
      }
    }
}