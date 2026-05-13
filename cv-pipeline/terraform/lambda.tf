data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/dist"
  output_path = "${path.module}/../lambda/lambda.zip"

  depends_on = [null_resource.build_lambda]
}

resource "null_resource" "build_lambda" {
  triggers = {
    lambda_src_hash = filebase64sha256("${path.module}/../lambda/src/index.ts")
    package_json    = filebase64sha256("${path.module}/../lambda/package.json")
  }

  provisioner "local-exec" {
    command = <<-EOT
      cd ${path.module}/../lambda
      npm install --production
      npm run build
      cp -r node_modules dist/
      cd dist && zip -r ../lambda.zip .
    EOT
  }
}

resource "aws_lambda_function" "cv_parser" {
  filename         = "${path.module}/../lambda/lambda.zip"
  function_name    = "${var.github_username}-cv-parser"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = 60
  memory_size      = 512

  environment {
    variables = {
      GITHUB_OWNER = var.github_username
      GITHUB_REPO  = var.github_repo
      GITHUB_TOKEN = var.github_token
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.lambda_logs,
    null_resource.build_lambda,
  ]
}

resource "aws_lambda_permission" "allow_s3" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.cv_parser.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.cv_bucket.arn
}

resource "aws_s3_bucket_notification" "cv_bucket_notification" {
  bucket = aws_s3_bucket.cv_bucket.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.cv_parser.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "cvs/"
  }

  depends_on = [aws_lambda_permission.allow_s3]
}

variable "github_token" {
  description = "GitHub Personal Access Token"
  type        = string
  sensitive   = true
}
