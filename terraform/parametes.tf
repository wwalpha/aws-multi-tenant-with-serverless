# ----------------------------------------------------------------------------------------------
# Parameter Store - Endpoints
# ----------------------------------------------------------------------------------------------
resource "aws_ssm_parameter" "endpoints" {
  name        = "/saas/service/endpoints"
  description = "service endpoints"
  type        = "String"
  value       = jsonencode(local.endpoints)
}

# ----------------------------------------------------------------------------------------------
# Parameter Store - Tables
# ----------------------------------------------------------------------------------------------
resource "aws_ssm_parameter" "tables" {
  name        = "/saas/service/tables"
  description = "dynamodb tables"
  type        = "String"
  value       = jsonencode(local.tables)
}
