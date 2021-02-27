# ----------------------------------------------------------------------------------------------
# AWS ECS Task Role
# ----------------------------------------------------------------------------------------------
resource "aws_iam_role" "ecs_task" {
  name               = "SaaS_Serverless_ECSTaskRole"
  assume_role_policy = file("iam/ecs_task_principals.json")
  lifecycle {
    create_before_destroy = false
  }
}

# ----------------------------------------------------------------------------------------------
# AWS ECS Task Execution Role
# ----------------------------------------------------------------------------------------------
resource "aws_iam_role" "ecs_task_exec" {
  name               = "SaaS_Serverless_ECSTaskExecutionRole"
  assume_role_policy = file("iam/ecs_task_principals.json")
  lifecycle {
    create_before_destroy = false
  }
}

# ----------------------------------------------------------------------------------------------
# AWS Lambda Role
# ----------------------------------------------------------------------------------------------
resource "aws_iam_role" "lambda_auth" {
  name               = "SaaS_Serverless_AuthorizerRole"
  assume_role_policy = file("iam/lambda_principals.json")
  lifecycle {
    create_before_destroy = false
  }
}

resource "aws_iam_role_policy" "lambda_auth" {
  role   = aws_iam_role.lambda_auth.id
  policy = file("iam/lambda_authorizer.json")
}
