locals {
  account_id = data.aws_caller_identity.this.account_id
  region     = data.aws_region.this.name


  task_def_rev_backend_auth = max(aws_ecs_task_definition.backend_auth.revision, data.aws_ecs_task_definition.backend_auth.revision)
  # task_definition_revision_backend_auth   = max(aws_ecs_task_definition.backend_auth.revision, data.aws_ecs_task_definition.backend_auth.revision)
  # task_definition_revision_backend_worker = max(aws_ecs_task_definition.backend_worker.revision, data.aws_ecs_task_definition.backend_worker.revision)

  task_def_family_backend_auth = "onecloud-saas-backend-auth"
  # task_def_family_backend_auth     = "onecloud-fargate-backend-auth"
  # task_def_family_backend_worker   = "onecloud-fargate-backend-worker"
}

# ----------------------------------------------------------------------------------------------
# AWS Region
# ----------------------------------------------------------------------------------------------
data "aws_region" "this" {}

# ----------------------------------------------------------------------------------------------
# AWS Account
# ----------------------------------------------------------------------------------------------
data "aws_caller_identity" "this" {}

# ----------------------------------------------------------------------------------------------
# Task Definition
# ----------------------------------------------------------------------------------------------
data "aws_ecs_task_definition" "backend_auth" {
  depends_on      = [aws_ecs_task_definition.backend_auth]
  task_definition = aws_ecs_task_definition.backend_auth.family
}
