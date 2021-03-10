locals {
  account_id = data.aws_caller_identity.this.account_id
  region     = data.aws_region.this.name


  # task_def_rev_backend_auth = max(aws_ecs_task_definition.backend_auth.revision, data.aws_ecs_task_definition.backend_auth.revision)
  task_def_rev_token      = max(aws_ecs_task_definition.token.revision, data.aws_ecs_task_definition.token.revision)
  task_def_rev_user       = max(aws_ecs_task_definition.user.revision, data.aws_ecs_task_definition.user.revision)
  task_def_rev_tenant     = max(aws_ecs_task_definition.tenant.revision, data.aws_ecs_task_definition.tenant.revision)
  task_def_rev_tenant_reg = max(aws_ecs_task_definition.tenant_reg.revision, data.aws_ecs_task_definition.tenant_reg.revision)

  # task_def_family_backend_auth = "onecloud-saas-backend-auth"
  task_def_family_token      = "onecloud-saas-token"
  task_def_family_user       = "onecloud-saas-user"
  task_def_family_tenant     = "onecloud-saas-tenant"
  task_def_family_tenant_reg = "onecloud-saas-tenant-registry"
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
# data "aws_ecs_task_definition" "backend_auth" {
#   depends_on      = [aws_ecs_task_definition.backend_auth]
#   task_definition = aws_ecs_task_definition.backend_auth.family
# }

data "aws_ecs_task_definition" "token" {
  depends_on      = [aws_ecs_task_definition.token]
  task_definition = aws_ecs_task_definition.token.family
}

data "aws_ecs_task_definition" "user" {
  depends_on      = [aws_ecs_task_definition.user]
  task_definition = aws_ecs_task_definition.user.family
}

data "aws_ecs_task_definition" "tenant" {
  depends_on      = [aws_ecs_task_definition.tenant]
  task_definition = aws_ecs_task_definition.tenant.family
}

data "aws_ecs_task_definition" "tenant_reg" {
  depends_on      = [aws_ecs_task_definition.tenant_reg]
  task_definition = aws_ecs_task_definition.tenant_reg.family
}
