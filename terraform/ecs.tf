# ----------------------------------------------------------------------------------------------
# ECS Cluster
# ----------------------------------------------------------------------------------------------
resource "aws_ecs_cluster" "saas" {
  name = "saas_serverless_cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# ----------------------------------------------------------------------------------------------
# AWS ECS Service - Backend Auth Task Definition
# ----------------------------------------------------------------------------------------------
# resource "aws_ecs_task_definition" "backend_auth" {
#   depends_on         = [null_resource.backend_auth]
#   family             = local.task_def_family_backend_auth
#   task_role_arn      = aws_iam_role.ecs_task.arn
#   execution_role_arn = aws_iam_role.ecs_task_exec.arn
#   network_mode       = "awsvpc"
#   cpu                = "1024"
#   memory             = "2048"

#   requires_compatibilities = [
#     "FARGATE"
#   ]

#   # proxy_configuration {
#   #   type           = "APPMESH"
#   #   container_name = "envoy"
#   #   properties = {
#   #     "ProxyIngressPort" = "15000"
#   #     "ProxyEgressPort"  = "15001"
#   #     "AppPorts"         = "8080"
#   #     "EgressIgnoredIPs" = "169.254.170.2,169.254.169.254"
#   #     "IgnoredUID"       = "1337"
#   #   }
#   # }

#   container_definitions = templatefile(
#     "taskdefs/backend_auth.tpl",
#     {
#       aws_region        = local.region
#       container_name    = local.task_def_family_backend_auth
#       container_image   = "${aws_ecr_repository.saas_auth.repository_url}:latest"
#       app_mesh_node     = "mesh/fargate-microservice-mesh/virtualNode/api-node"
#       app_mesh_resource = aws_appmesh_virtual_node.api.arn
#     }
#   )

#   # provisioner "local-exec" {
#   #   when    = destroy
#   #   command = "sh ${path.module}/scripts/deregister-taskdef.sh ${self.family}"
#   # }
# }

# # ----------------------------------------------------------------------------------------------
# # ECS Service - Backend Auth
# # ----------------------------------------------------------------------------------------------
# resource "aws_ecs_service" "backend_auth" {
#   name                               = "backend_auth"
#   cluster                            = aws_ecs_cluster.saas.id
#   desired_count                      = 1
#   launch_type                        = "FARGATE"
#   platform_version                   = "1.4.0"
#   task_definition                    = "arn:aws:ecs:${local.region}:${local.account_id}:task-definition/${aws_ecs_task_definition.backend_auth.family}:${local.task_def_rev_backend_auth}"
#   deployment_maximum_percent         = 200
#   deployment_minimum_healthy_percent = 100

#   network_configuration {
#     assign_public_ip = false
#     subnets          = module.vpc.private_subnets
#     # security_groups  = var.vpc_security_groups
#   }
#   scheduling_strategy = "REPLICA"

#   # load_balancer {
#   #   target_group_arn = aws_lb_target_group.backend_api.arn
#   #   container_name   = "onecloud-fargate-backend-api"
#   #   container_port   = 8080
#   # }

#   service_registries {
#     registry_arn = aws_service_discovery_service.auth.arn
#   }

#   provisioner "local-exec" {
#     when    = destroy
#     command = "sh ${path.module}/scripts/servicediscovery-drain.sh ${split("/", self.service_registries[0].registry_arn)[1]}"
#   }
# }

# ----------------------------------------------------------------------------------------------
# AWS ECS Service - Token Service Task Definition
# ----------------------------------------------------------------------------------------------
resource "aws_ecs_task_definition" "token" {
  depends_on         = [null_resource.backend_auth]
  family             = local.task_def_family_token
  task_role_arn      = aws_iam_role.ecs_task.arn
  execution_role_arn = aws_iam_role.ecs_task_exec.arn
  network_mode       = "awsvpc"
  cpu                = "1024"
  memory             = "2048"

  requires_compatibilities = [
    "FARGATE"
  ]

  proxy_configuration {
    type           = "APPMESH"
    container_name = "envoy"
    properties = {
      "ProxyIngressPort" = "15000"
      "ProxyEgressPort"  = "15001"
      "AppPorts"         = "8080"
      "EgressIgnoredIPs" = "169.254.170.2,169.254.169.254"
      "IgnoredUID"       = "1337"
    }
  }

  container_definitions = templatefile(
    "taskdefs/token.tpl",
    {
      aws_region        = local.region
      container_name    = local.task_def_family_token
      container_image   = "${aws_ecr_repository.token.repository_url}:latest"
      app_mesh_node     = "mesh/fargate-microservice-mesh/virtualNode/api-node"
      app_mesh_resource = aws_appmesh_virtual_node.token.arn
      dynamodb_tables   = aws_ssm_parameter.tables.name
      service_endpoints = aws_ssm_parameter.endpoints.name
    }
  )

  provisioner "local-exec" {
    when    = destroy
    command = "sh ${path.module}/scripts/deregister-taskdef.sh ${self.family}"
  }
}

# ----------------------------------------------------------------------------------------------
# ECS Service - Token Service
# ----------------------------------------------------------------------------------------------
resource "aws_ecs_service" "token" {
  name                               = "token_service"
  cluster                            = aws_ecs_cluster.saas.id
  desired_count                      = 1
  launch_type                        = "FARGATE"
  platform_version                   = "1.4.0"
  task_definition                    = "arn:aws:ecs:${local.region}:${local.account_id}:task-definition/${aws_ecs_task_definition.token.family}:${local.task_def_rev_token}"
  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100

  network_configuration {
    assign_public_ip = false
    subnets          = module.vpc.private_subnets
    # security_groups  = var.vpc_security_groups
  }
  scheduling_strategy = "REPLICA"

  # load_balancer {
  #   target_group_arn = aws_lb_target_group.backend_api.arn
  #   container_name   = "onecloud-fargate-backend-api"
  #   container_port   = 8080
  # }

  service_registries {
    registry_arn = aws_service_discovery_service.token.arn
  }

  provisioner "local-exec" {
    when    = destroy
    command = "sh ${path.module}/scripts/servicediscovery-drain.sh ${split("/", self.service_registries[0].registry_arn)[1]}"
  }
}

# ----------------------------------------------------------------------------------------------
# AWS ECS Service - Tenant Service Task Definition
# ----------------------------------------------------------------------------------------------
resource "aws_ecs_task_definition" "tenant" {
  depends_on         = [null_resource.backend_auth]
  family             = local.task_def_family_tenant
  task_role_arn      = aws_iam_role.ecs_task.arn
  execution_role_arn = aws_iam_role.ecs_task_exec.arn
  network_mode       = "awsvpc"
  cpu                = "1024"
  memory             = "2048"

  requires_compatibilities = [
    "FARGATE"
  ]

  proxy_configuration {
    type           = "APPMESH"
    container_name = "envoy"
    properties = {
      "ProxyIngressPort" = "15000"
      "ProxyEgressPort"  = "15001"
      "AppPorts"         = "8080"
      "EgressIgnoredIPs" = "169.254.170.2,169.254.169.254"
      "IgnoredUID"       = "1337"
    }
  }

  container_definitions = templatefile(
    "taskdefs/tenant.tpl",
    {
      aws_region        = local.region
      container_name    = local.task_def_family_tenant
      container_image   = "${aws_ecr_repository.tenant.repository_url}:latest"
      app_mesh_node     = "mesh/fargate-microservice-mesh/virtualNode/api-node"
      app_mesh_resource = aws_appmesh_virtual_node.tenant.arn
      dynamodb_tables   = aws_ssm_parameter.tables.name
      service_endpoints = aws_ssm_parameter.endpoints.name
    }
  )

  provisioner "local-exec" {
    when    = destroy
    command = "sh ${path.module}/scripts/deregister-taskdef.sh ${self.family}"
  }
}

# ----------------------------------------------------------------------------------------------
# ECS Service - Tenant Service
# ----------------------------------------------------------------------------------------------
resource "aws_ecs_service" "tenant" {
  name                               = "tenant_service"
  cluster                            = aws_ecs_cluster.saas.id
  desired_count                      = 1
  launch_type                        = "FARGATE"
  platform_version                   = "1.4.0"
  task_definition                    = "arn:aws:ecs:${local.region}:${local.account_id}:task-definition/${aws_ecs_task_definition.token.family}:${local.task_def_rev_token}"
  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100

  network_configuration {
    assign_public_ip = false
    subnets          = module.vpc.private_subnets
    # security_groups  = var.vpc_security_groups
  }
  scheduling_strategy = "REPLICA"

  # load_balancer {
  #   target_group_arn = aws_lb_target_group.backend_api.arn
  #   container_name   = "onecloud-fargate-backend-api"
  #   container_port   = 8080
  # }

  service_registries {
    registry_arn = aws_service_discovery_service.tenant.arn
  }

  provisioner "local-exec" {
    when    = destroy
    command = "sh ${path.module}/scripts/servicediscovery-drain.sh ${split("/", self.service_registries[0].registry_arn)[1]}"
  }
}


# ----------------------------------------------------------------------------------------------
# AWS ECS Service - User Service Task Definition
# ----------------------------------------------------------------------------------------------
resource "aws_ecs_task_definition" "user" {
  depends_on         = [null_resource.backend_auth]
  family             = local.task_def_family_user
  task_role_arn      = aws_iam_role.ecs_task.arn
  execution_role_arn = aws_iam_role.ecs_task_exec.arn
  network_mode       = "awsvpc"
  cpu                = "1024"
  memory             = "2048"

  requires_compatibilities = [
    "FARGATE"
  ]

  proxy_configuration {
    type           = "APPMESH"
    container_name = "envoy"
    properties = {
      "ProxyIngressPort" = "15000"
      "ProxyEgressPort"  = "15001"
      "AppPorts"         = "8080"
      "EgressIgnoredIPs" = "169.254.170.2,169.254.169.254"
      "IgnoredUID"       = "1337"
    }
  }

  container_definitions = templatefile(
    "taskdefs/user.tpl",
    {
      aws_region        = local.region
      container_name    = local.task_def_family_user
      container_image   = "${aws_ecr_repository.user.repository_url}:latest"
      app_mesh_node     = "mesh/fargate-microservice-mesh/virtualNode/api-node"
      app_mesh_resource = aws_appmesh_virtual_node.user.arn
      dynamodb_tables   = aws_ssm_parameter.tables.name
      service_endpoints = aws_ssm_parameter.endpoints.name
    }
  )

  provisioner "local-exec" {
    when    = destroy
    command = "sh ${path.module}/scripts/deregister-taskdef.sh ${self.family}"
  }
}

# ----------------------------------------------------------------------------------------------
# ECS Service - Token Service
# ----------------------------------------------------------------------------------------------
resource "aws_ecs_service" "user" {
  name                               = "user_service"
  cluster                            = aws_ecs_cluster.saas.id
  desired_count                      = 1
  launch_type                        = "FARGATE"
  platform_version                   = "1.4.0"
  task_definition                    = "arn:aws:ecs:${local.region}:${local.account_id}:task-definition/${aws_ecs_task_definition.token.family}:${local.task_def_rev_token}"
  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100

  network_configuration {
    assign_public_ip = false
    subnets          = module.vpc.private_subnets
    # security_groups  = var.vpc_security_groups
  }
  scheduling_strategy = "REPLICA"

  # load_balancer {
  #   target_group_arn = aws_lb_target_group.backend_api.arn
  #   container_name   = "onecloud-fargate-backend-api"
  #   container_port   = 8080
  # }

  service_registries {
    registry_arn = aws_service_discovery_service.user.arn
  }

  provisioner "local-exec" {
    when    = destroy
    command = "sh ${path.module}/scripts/servicediscovery-drain.sh ${split("/", self.service_registries[0].registry_arn)[1]}"
  }
}

# ----------------------------------------------------------------------------------------------
# AWS ECS Service - Tenant Registry Service Task Definition
# ----------------------------------------------------------------------------------------------
resource "aws_ecs_task_definition" "tenant_reg" {
  depends_on         = [null_resource.backend_auth]
  family             = local.task_def_family_tenant_reg
  task_role_arn      = aws_iam_role.ecs_task.arn
  execution_role_arn = aws_iam_role.ecs_task_exec.arn
  network_mode       = "awsvpc"
  cpu                = "1024"
  memory             = "2048"

  requires_compatibilities = [
    "FARGATE"
  ]

  proxy_configuration {
    type           = "APPMESH"
    container_name = "envoy"
    properties = {
      "ProxyIngressPort" = "15000"
      "ProxyEgressPort"  = "15001"
      "AppPorts"         = "8080"
      "EgressIgnoredIPs" = "169.254.170.2,169.254.169.254"
      "IgnoredUID"       = "1337"
    }
  }

  container_definitions = templatefile(
    "taskdefs/tenant_reg.tpl",
    {
      aws_region        = local.region
      container_name    = local.task_def_family_tenant_reg
      container_image   = "${aws_ecr_repository.tenant_reg.repository_url}:latest"
      app_mesh_node     = "mesh/fargate-microservice-mesh/virtualNode/api-node"
      app_mesh_resource = aws_appmesh_virtual_node.tenant_reg.arn
      dynamodb_tables   = aws_ssm_parameter.tables.name
      service_endpoints = aws_ssm_parameter.endpoints.name
    }
  )

  provisioner "local-exec" {
    when    = destroy
    command = "sh ${path.module}/scripts/deregister-taskdef.sh ${self.family}"
  }
}

# ----------------------------------------------------------------------------------------------
# ECS Service - Tenant Registry Service
# ----------------------------------------------------------------------------------------------
# resource "aws_ecs_service" "tenant_reg" {
#   name                               = "tenant_reg_service"
#   cluster                            = aws_ecs_cluster.saas.id
#   desired_count                      = 1
#   launch_type                        = "FARGATE"
#   platform_version                   = "1.4.0"
#   task_definition                    = "arn:aws:ecs:${local.region}:${local.account_id}:task-definition/${aws_ecs_task_definition.tenant_reg.family}:${local.task_def_rev_tenant_reg}"
#   deployment_maximum_percent         = 200
#   deployment_minimum_healthy_percent = 100

#   network_configuration {
#     assign_public_ip = false
#     subnets          = module.vpc.private_subnets
#     # security_groups  = var.vpc_security_groups
#   }
#   scheduling_strategy = "REPLICA"

#   service_registries {
#     registry_arn = aws_service_discovery_service.tenant_reg.arn
#   }

#   provisioner "local-exec" {
#     when    = destroy
#     command = "sh ${path.module}/scripts/servicediscovery-drain.sh ${split("/", self.service_registries[0].registry_arn)[1]}"
#   }
# }

# ----------------------------------------------------------------------------------------------
# AWS ECS Service - System Registry Service Task Definition
# ----------------------------------------------------------------------------------------------
resource "aws_ecs_task_definition" "system_reg" {
  depends_on         = [null_resource.backend_auth]
  family             = local.task_def_family_system_reg
  task_role_arn      = aws_iam_role.ecs_task.arn
  execution_role_arn = aws_iam_role.ecs_task_exec.arn
  network_mode       = "awsvpc"
  cpu                = "1024"
  memory             = "2048"

  requires_compatibilities = [
    "FARGATE"
  ]

  proxy_configuration {
    type           = "APPMESH"
    container_name = "envoy"
    properties = {
      "ProxyIngressPort" = "15000"
      "ProxyEgressPort"  = "15001"
      "AppPorts"         = "8080"
      "EgressIgnoredIPs" = "169.254.170.2,169.254.169.254"
      "IgnoredUID"       = "1337"
    }
  }

  container_definitions = templatefile(
    "taskdefs/system_reg.tpl",
    {
      aws_region        = local.region
      container_name    = local.task_def_family_system_reg
      container_image   = "${aws_ecr_repository.system_reg.repository_url}:latest"
      app_mesh_node     = "mesh/fargate-microservice-mesh/virtualNode/api-node"
      app_mesh_resource = aws_appmesh_virtual_node.system_reg.arn
      dynamodb_tables   = aws_ssm_parameter.tables.name
      service_endpoints = aws_ssm_parameter.endpoints.name
    }
  )

  provisioner "local-exec" {
    when    = destroy
    command = "sh ${path.module}/scripts/deregister-taskdef.sh ${self.family}"
  }
}

# ----------------------------------------------------------------------------------------------
# ECS Service - Tenant Registry Service
# ----------------------------------------------------------------------------------------------
resource "aws_ecs_service" "system_reg" {
  name                               = "system_reg_service"
  cluster                            = aws_ecs_cluster.saas.id
  desired_count                      = 1
  launch_type                        = "FARGATE"
  platform_version                   = "1.4.0"
  task_definition                    = "arn:aws:ecs:${local.region}:${local.account_id}:task-definition/${aws_ecs_task_definition.system_reg.family}:${local.task_def_rev_system_reg}"
  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100

  network_configuration {
    assign_public_ip = false
    subnets          = module.vpc.private_subnets
    # security_groups  = var.vpc_security_groups
  }
  scheduling_strategy = "REPLICA"

  service_registries {
    registry_arn = aws_service_discovery_service.system_reg.arn
  }

  provisioner "local-exec" {
    when    = destroy
    command = "sh ${path.module}/scripts/servicediscovery-drain.sh ${split("/", self.service_registries[0].registry_arn)[1]}"
  }
}
