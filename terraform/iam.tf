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
# AWS ECS Task Role Policy - CloudWatch Full Access
# ----------------------------------------------------------------------------------------------
resource "aws_iam_role_policy_attachment" "ecs_task_cloudwatch" {
  role       = aws_iam_role.ecs_task.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchFullAccess"
}

# ----------------------------------------------------------------------------------------------
# AWS ECS Task Role Policy - XRay Daemon WriteAccess
# ----------------------------------------------------------------------------------------------
resource "aws_iam_role_policy_attachment" "ecs_task_xray" {
  role       = aws_iam_role.ecs_task.name
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}

# ----------------------------------------------------------------------------------------------
# AWS ECS Task Role Policy - App Mesh Envoy Access
# ----------------------------------------------------------------------------------------------
resource "aws_iam_role_policy_attachment" "ecs_task_envoy" {
  role       = aws_iam_role.ecs_task.name
  policy_arn = "arn:aws:iam::aws:policy/AWSAppMeshEnvoyAccess"
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
# AWS ECS Task Execution Policy - ECS Task Execution Policy
# ----------------------------------------------------------------------------------------------
resource "aws_iam_role_policy_attachment" "ecs_task_exec_default" {
  role       = aws_iam_role.ecs_task_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ----------------------------------------------------------------------------------------------
# AWS ECS Task Execution Policy - CloudWatch Full Access
# ----------------------------------------------------------------------------------------------
resource "aws_iam_role_policy_attachment" "ecs_task_exec_cloudwatch" {
  role       = aws_iam_role.ecs_task_exec.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchFullAccess"
}

# ----------------------------------------------------------------------------------------------
# AWS ECS Task Role Policy - SSM Parameter Store Access
# ----------------------------------------------------------------------------------------------
resource "aws_iam_role_policy_attachment" "ecs_task_exec_ssm" {
  role       = aws_iam_role.ecs_task_exec.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMReadOnlyAccess"
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
