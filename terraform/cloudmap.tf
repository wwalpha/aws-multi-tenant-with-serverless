# ----------------------------------------------------------------------------------------------
# Service Discovery Private DNS Namespace
# ----------------------------------------------------------------------------------------------
resource "aws_service_discovery_private_dns_namespace" "saas" {
  depends_on  = [module.vpc]
  name        = "saas.serverless.local"
  description = "saas.serverless.local"
  vpc         = module.vpc.vpc_id
}

# ----------------------------------------------------------------------------------------------
# Service Discovery Service - Auth
# ----------------------------------------------------------------------------------------------
resource "aws_service_discovery_service" "auth" {
  name = "auth"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.saas.id

    dns_records {
      ttl  = 60
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}

# ----------------------------------------------------------------------------------------------
# Service Discovery Service - Tenant
# ----------------------------------------------------------------------------------------------
resource "aws_service_discovery_service" "tenant" {
  name = "tenant"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.saas.id

    dns_records {
      ttl  = 60
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}

# ----------------------------------------------------------------------------------------------
# Service Discovery Service - User
# ----------------------------------------------------------------------------------------------
resource "aws_service_discovery_service" "user" {
  name = "user"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.saas.id

    dns_records {
      ttl  = 60
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}

# ----------------------------------------------------------------------------------------------
# Service Discovery Service - Token
# ----------------------------------------------------------------------------------------------
resource "aws_service_discovery_service" "token" {
  name = "token"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.saas.id

    dns_records {
      ttl  = 60
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}
