# ----------------------------------------------------------------------------------------------
# App Mesh
# ----------------------------------------------------------------------------------------------
resource "aws_appmesh_mesh" "saas" {
  name = "saas_serverless_mesh"

  spec {
    egress_filter {
      type = "DROP_ALL"
    }
  }
}

# ----------------------------------------------------------------------------------------------
# App Mesh - Token Virtual Service
# ----------------------------------------------------------------------------------------------
resource "aws_appmesh_virtual_service" "token" {
  name      = "${aws_service_discovery_service.token.name}.${aws_service_discovery_private_dns_namespace.saas.name}"
  mesh_name = aws_appmesh_mesh.saas.id

  spec {
    provider {
      virtual_node {
        virtual_node_name = aws_appmesh_virtual_node.token.name
      }
    }
  }
}

# ----------------------------------------------------------------------------------------------
# App Mesh - Token Virtual Node
# ----------------------------------------------------------------------------------------------
resource "aws_appmesh_virtual_node" "token" {
  name      = "token_node"
  mesh_name = aws_appmesh_mesh.saas.id

  spec {
    backend {
      virtual_service {
        virtual_service_name = aws_appmesh_virtual_service.user.name
      }
    }

    listener {
      port_mapping {
        port     = 80
        protocol = "http"
      }
    }

    service_discovery {
      aws_cloud_map {
        service_name   = aws_service_discovery_service.token.name
        namespace_name = aws_service_discovery_private_dns_namespace.saas.name
      }
    }
  }
}

# ----------------------------------------------------------------------------------------------
# App Mesh - Tenant Virtual Service
# ----------------------------------------------------------------------------------------------
resource "aws_appmesh_virtual_service" "tenant" {
  name      = "${aws_service_discovery_service.tenant.name}.${aws_service_discovery_private_dns_namespace.saas.name}"
  mesh_name = aws_appmesh_mesh.saas.id

  spec {
    provider {
      virtual_node {
        virtual_node_name = aws_appmesh_virtual_node.tenant.name
      }
    }
  }
}

# ----------------------------------------------------------------------------------------------
# App Mesh - API Virtual Node
# ----------------------------------------------------------------------------------------------
resource "aws_appmesh_virtual_node" "tenant" {
  name      = "tenant_node"
  mesh_name = aws_appmesh_mesh.saas.id

  spec {
    backend {
      virtual_service {
        virtual_service_name = aws_appmesh_virtual_service.user.name
      }
    }

    backend {
      virtual_service {
        virtual_service_name = aws_appmesh_virtual_service.token.name
      }
    }

    listener {
      port_mapping {
        port     = 8080
        protocol = "http"
      }
    }

    service_discovery {
      aws_cloud_map {
        service_name   = aws_service_discovery_service.tenant.name
        namespace_name = aws_service_discovery_private_dns_namespace.saas.name
      }
    }
  }
}

# ----------------------------------------------------------------------------------------------
# App Mesh - Tenant Registry Virtual Service
# ----------------------------------------------------------------------------------------------
resource "aws_appmesh_virtual_service" "tenant_reg" {
  name      = "${aws_service_discovery_service.tenant_reg.name}.${aws_service_discovery_private_dns_namespace.saas.name}"
  mesh_name = aws_appmesh_mesh.saas.id

  spec {
    provider {
      virtual_node {
        virtual_node_name = aws_appmesh_virtual_node.tenant_reg.name
      }
    }
  }
}

# ----------------------------------------------------------------------------------------------
# App Mesh - Tenant Registry Virtual Node
# ----------------------------------------------------------------------------------------------
resource "aws_appmesh_virtual_node" "tenant_reg" {
  name      = "tenant_reg_node"
  mesh_name = aws_appmesh_mesh.saas.id

  spec {
    backend {
      virtual_service {
        virtual_service_name = aws_appmesh_virtual_service.tenant.name
      }
    }

    listener {
      port_mapping {
        port     = 8080
        protocol = "http"
      }
    }

    service_discovery {
      aws_cloud_map {
        service_name   = aws_service_discovery_service.tenant_reg.name
        namespace_name = aws_service_discovery_private_dns_namespace.saas.name
      }
    }
  }
}

# ----------------------------------------------------------------------------------------------
# App Mesh - User Virtual Service
# ----------------------------------------------------------------------------------------------
resource "aws_appmesh_virtual_service" "user" {
  name      = "${aws_service_discovery_service.user.name}.${aws_service_discovery_private_dns_namespace.saas.name}"
  mesh_name = aws_appmesh_mesh.saas.id

  spec {
    provider {
      virtual_node {
        virtual_node_name = aws_appmesh_virtual_node.user.name
      }
    }
  }
}

# ----------------------------------------------------------------------------------------------
# App Mesh - User Service Virtual Node
# ----------------------------------------------------------------------------------------------
resource "aws_appmesh_virtual_node" "user" {
  name      = "user_node"
  mesh_name = aws_appmesh_mesh.saas.id

  spec {
    # backend {
    #   virtual_service {
    #     virtual_service_name = aws_appmesh_virtual_service.token.name
    #   }
    # }

    listener {
      port_mapping {
        port     = 8080
        protocol = "http"
      }
    }

    service_discovery {
      aws_cloud_map {
        service_name   = aws_service_discovery_service.tenant.name
        namespace_name = aws_service_discovery_private_dns_namespace.saas.name
      }
    }
  }
}
