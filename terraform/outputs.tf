# ----------------------------------------------------------------------------------------------
# DynamoDB Table Name - User
# ----------------------------------------------------------------------------------------------
output "TABLE_NAME_USER" {
  value = aws_dynamodb_table.user.name
}

# ----------------------------------------------------------------------------------------------
# DynamoDB Table Name - Tenant
# ----------------------------------------------------------------------------------------------
output "TABLE_NAME_TENANT" {
  value = aws_dynamodb_table.tenant.name
}

# ----------------------------------------------------------------------------------------------
# DynamoDB Table Name - Product
# ----------------------------------------------------------------------------------------------
output "TABLE_NAME_PRODUCT" {
  value = aws_dynamodb_table.product.name
}

# ----------------------------------------------------------------------------------------------
# DynamoDB Table Name - Order
# ----------------------------------------------------------------------------------------------
output "TABLE_NAME_ORDER" {
  value = aws_dynamodb_table.order.name
}

# ----------------------------------------------------------------------------------------------
# Service Endpoint - Tenant
# ----------------------------------------------------------------------------------------------
output "SERVICE_ENDPOINT_TENANT" {
  value = "${aws_service_discovery_service.tenant.name}.${aws_service_discovery_private_dns_namespace.saas.name}"
}

# ----------------------------------------------------------------------------------------------
# Service Endpoint - User
# ----------------------------------------------------------------------------------------------
output "SERVICE_ENDPOINT_USER" {
  value = "${aws_service_discovery_service.user.name}.${aws_service_discovery_private_dns_namespace.saas.name}"
}

# ----------------------------------------------------------------------------------------------
# Service Endpoint - Auth
# ----------------------------------------------------------------------------------------------
output "SERVICE_ENDPOINT_AUTH" {
  value = "${aws_service_discovery_service.auth.name}.${aws_service_discovery_private_dns_namespace.saas.name}"
}

# ----------------------------------------------------------------------------------------------
# Service Endpoint - Token
# ----------------------------------------------------------------------------------------------
output "SERVICE_ENDPOINT_TOKEN" {
  value = "${aws_service_discovery_service.token.name}.${aws_service_discovery_private_dns_namespace.saas.name}"
}

# output "CONFIGS" {
#   value = {
#     Tables = {
#       # ----------------------------------------------------------------------------------------------
#       # DynamoDB Table - User
#       # ----------------------------------------------------------------------------------------------
#       User = {
#         Arn  = aws_dynamodb_table.user.arn
#         Name = aws_dynamodb_table.user.name
#       }
#       # ----------------------------------------------------------------------------------------------
#       # DynamoDB Table - Tenant
#       # ----------------------------------------------------------------------------------------------
#       Tenant = {
#         Arn  = aws_dynamodb_table.tenant.arn
#         Name = aws_dynamodb_table.tenant.name
#       }
#       # ----------------------------------------------------------------------------------------------
#       # DynamoDB Table - Product
#       # ----------------------------------------------------------------------------------------------
#       Product = {
#         Arn  = aws_dynamodb_table.product.arn
#         Name = aws_dynamodb_table.product.name
#       }
#       # ----------------------------------------------------------------------------------------------
#       # DynamoDB Table - Order
#       # ----------------------------------------------------------------------------------------------
#       Order = {
#         Arn  = aws_dynamodb_table.order.arn
#         Name = aws_dynamodb_table.order.name
#       }
#     }
#   }
# }
output "test1" {
  value = aws_ssm_parameter.tables.arn
}

output "test2" {
  value = aws_ssm_parameter.tables.arn
}
