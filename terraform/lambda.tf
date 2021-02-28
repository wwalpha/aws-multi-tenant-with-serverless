# ----------------------------------------------------------------------------------------------
# AWS Lambda - Authorizer
# ----------------------------------------------------------------------------------------------
resource "aws_lambda_function" "authorizer" {
  filename         = data.archive_file.authorizer.output_path
  source_code_hash = data.archive_file.authorizer.output_base64sha256
  function_name    = "saas-authorizer"
  handler          = "index.handler"
  memory_size      = 512
  role             = aws_iam_role.lambda_auth.arn
  runtime          = "nodejs14.x"
  timeout          = 3
}

data "archive_file" "authorizer" {
  depends_on  = [null_resource.lambda_build]
  type        = "zip"
  source_dir  = "../functions/authorizer/build"
  output_path = "../functions/authorizer/build.zip"
}
