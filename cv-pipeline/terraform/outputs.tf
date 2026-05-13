output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.cv_bucket.id
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.cv_parser.function_name
}

output "s3_upload_command" {
  description = "Example command to upload a CV"
  value       = "aws s3 cp <your-cv.pdf> s3://${aws_s3_bucket.cv_bucket.id}/cvs/"
}
