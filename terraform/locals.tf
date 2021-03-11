locals {
  account_id = data.aws_caller_identity.this.account_id
  region     = data.aws_region.this.name


  # task_def_rev_backend_auth = max(aws_ecs_task_definition.backend_auth.revision, data.aws_ecs_task_definition.backend_auth.revision)
  task_def_rev_token      = max(aws_ecs_task_definition.token.revision, data.aws_ecs_task_definition.token.revision)
  task_def_rev_user       = max(aws_ecs_task_definition.user.revision, data.aws_ecs_task_definition.user.revision)
  task_def_rev_tenant     = max(aws_ecs_task_definition.tenant.revision, data.aws_ecs_task_definition.tenant.revision)
  task_def_rev_tenant_reg = max(aws_ecs_task_definition.tenant_reg.revision, data.aws_ecs_task_definition.tenant_reg.revision)
  task_def_rev_system_reg = max(aws_ecs_task_definition.system_reg.revision, data.aws_ecs_task_definition.system_reg.revision)

  # task_def_family_backend_auth = "onecloud-saas-backend-auth"
  task_def_family_token      = "onecloud-saas-token"
  task_def_family_user       = "onecloud-saas-user"
  task_def_family_tenant     = "onecloud-saas-tenant"
  task_def_family_tenant_reg = "onecloud-saas-tenant-registration"
  task_def_family_system_reg = "onecloud-saas-system-registration"

  namespace = aws_service_discovery_private_dns_namespace.saas.name

  endpoints = {
    SERVICE_ENDPOINT_TENANT = "${aws_service_discovery_service.tenant.name}.${local.namespace}"
    SERVICE_ENDPOINT_USER   = "${aws_service_discovery_service.user.name}.${local.namespace}"
    SERVICE_ENDPOINT_TOKEN  = "${aws_service_discovery_service.token.name}.${local.namespace}"
    SERVICE_ENDPOINT_AUTH   = "${aws_service_discovery_service.auth.name}.${local.namespace}"
  }

  tables = {
    TABLE_NAME_USER    = aws_dynamodb_table.user.name
    TABLE_NAME_TENANT  = aws_dynamodb_table.tenant.name
    TABLE_NAME_PRODUCT = aws_dynamodb_table.product.name
    TABLE_NAME_ORDER   = aws_dynamodb_table.order.name
  }
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

data "aws_ecs_task_definition" "system_reg" {
  depends_on      = [aws_ecs_task_definition.system_reg]
  task_definition = aws_ecs_task_definition.system_reg.family
}
