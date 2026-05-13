resource "aws_s3_bucket" "cv_bucket" {
  bucket = var.bucket_name

  tags = {
    Name        = "CV Uploads"
    Environment = "production"
  }
}

resource "aws_s3_bucket_versioning" "cv_bucket" {
  bucket = aws_s3_bucket.cv_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cv_bucket" {
  bucket = aws_s3_bucket.cv_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
