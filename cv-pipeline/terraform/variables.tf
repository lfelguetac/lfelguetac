variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "bucket_name" {
  description = "S3 bucket name for CV uploads"
  type        = string
  default     = "lfelguetac-cv-uploads"
}

variable "github_username" {
  description = "GitHub username"
  type        = string
  default     = "lfelguetac"
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "lfelguetac"
}
