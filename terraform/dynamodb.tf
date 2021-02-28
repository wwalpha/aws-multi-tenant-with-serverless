# ----------------------------------------------------------------------------------------------
# AWS DynamoDB - User
# ----------------------------------------------------------------------------------------------
resource "aws_dynamodb_table" "user" {
  name         = "saas-User"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "tenantId"
  range_key    = "id"

  attribute {
    name = "tenantId"
    type = "S"
  }

  attribute {
    name = "id"
    type = "S"
  }

  global_secondary_index {
    name            = "gsiIdx"
    hash_key        = "id"
    projection_type = "ALL"
  }
}

# ----------------------------------------------------------------------------------------------
# AWS DynamoDB - Tenant
# ----------------------------------------------------------------------------------------------
resource "aws_dynamodb_table" "tenant" {
  name         = "saas-Tenant"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }
}

# ----------------------------------------------------------------------------------------------
# AWS DynamoDB - Product
# ----------------------------------------------------------------------------------------------
resource "aws_dynamodb_table" "product" {
  name         = "saas-Product"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "tenantId"
  range_key    = "productId"

  attribute {
    name = "tenantId"
    type = "S"
  }

  attribute {
    name = "productId"
    type = "S"
  }
}


# ----------------------------------------------------------------------------------------------
# AWS DynamoDB - Order
# ----------------------------------------------------------------------------------------------
resource "aws_dynamodb_table" "order" {
  name         = "saas-Order"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "tenantId"
  range_key    = "orderId"

  attribute {
    name = "tenantId"
    type = "S"
  }

  attribute {
    name = "orderId"
    type = "S"
  }
}
