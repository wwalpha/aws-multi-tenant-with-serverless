# ----------------------------------------------------------------------------------------------
# Amazon API Gateway - Http API
# ----------------------------------------------------------------------------------------------
resource "aws_apigatewayv2_vpc_link" "private" {
  name               = "saas-private-link"
  security_group_ids = [module.private_link_sg.this_security_group_id]
  subnet_ids         = module.vpc.private_subnets
}

# ----------------------------------------------------------------------------------------------
# Amazon API Gateway - Http API
# ----------------------------------------------------------------------------------------------
resource "aws_apigatewayv2_api" "saas" {
  name          = "saas-serverless-api"
  protocol_type = "HTTP"
}

# ----------------------------------------------------------------------------------------------
# Amazon API Gateway - Authorization
# ----------------------------------------------------------------------------------------------
resource "aws_apigatewayv2_authorizer" "lambda" {
  api_id                            = aws_apigatewayv2_api.saas.id
  name                              = "authorizer"
  authorizer_type                   = "REQUEST"
  authorizer_uri                    = aws_lambda_function.authorizer.invoke_arn
  authorizer_payload_format_version = "2.0"
  enable_simple_responses           = true
  identity_sources                  = ["$request.header.Authorization"]
}

# ----------------------------------------------------------------------------------------------
# Amazon API Gateway Integration - Authorization
# ----------------------------------------------------------------------------------------------
resource "aws_apigatewayv2_integration" "auth" {
  api_id             = aws_apigatewayv2_api.saas.id
  connection_type    = "VPC_LINK"
  connection_id      = aws_apigatewayv2_vpc_link.private.id
  integration_type   = "HTTP_PROXY"
  integration_method = "POST"
  integration_uri    = aws_service_discovery_service.backend_auth.arn
}

# ----------------------------------------------------------------------------------------------
# Amazon API Gateway Route - Authorization
# ----------------------------------------------------------------------------------------------
resource "aws_apigatewayv2_route" "auth" {
  api_id    = aws_apigatewayv2_api.saas.id
  route_key = "POST /auth"

  target = "integrations/${aws_apigatewayv2_integration.auth.id}"
}
