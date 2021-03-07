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
resource "aws_ecs_task_definition" "backend_auth" {
  depends_on         = [null_resource.backend_auth]
  family             = local.task_def_family_backend_auth
  task_role_arn      = aws_iam_role.ecs_task.arn
  execution_role_arn = aws_iam_role.ecs_task_exec.arn
  network_mode       = "awsvpc"
  cpu                = "1024"
  memory             = "2048"

  requires_compatibilities = [
    "FARGATE"
  ]

  # proxy_configuration {
  #   type           = "APPMESH"
  #   container_name = "envoy"
  #   properties = {
  #     "ProxyIngressPort" = "15000"
  #     "ProxyEgressPort"  = "15001"
  #     "AppPorts"         = "8080"
  #     "EgressIgnoredIPs" = "169.254.170.2,169.254.169.254"
  #     "IgnoredUID"       = "1337"
  #   }
  # }

  container_definitions = templatefile(
    "taskdefs/backend_auth.tpl",
    {
      aws_region      = local.region
      container_name  = local.task_def_family_backend_auth
      container_image = "${aws_ecr_repository.saas_auth.repository_url}:latest"
      # app_mesh_node   = "mesh/fargate-microservice-mesh/virtualNode/api-node"
      # app_mesh_resource = aws_appmesh_virtual_node.api.arn
    }
  )

  # provisioner "local-exec" {
  #   when    = destroy
  #   command = "sh ${path.module}/scripts/deregister-taskdef.sh ${self.family}"
  # }
}

# ----------------------------------------------------------------------------------------------
# ECS Service - Backend Auth
# ----------------------------------------------------------------------------------------------
resource "aws_ecs_service" "backend_auth" {
  name                               = "backend_auth"
  cluster                            = aws_ecs_cluster.saas.id
  desired_count                      = 1
  launch_type                        = "FARGATE"
  platform_version                   = "1.4.0"
  task_definition                    = "arn:aws:ecs:${local.region}:${local.account_id}:task-definition/${aws_ecs_task_definition.backend_auth.family}:${local.task_def_rev_backend_auth}"
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
    registry_arn = aws_service_discovery_service.auth.arn
  }

  provisioner "local-exec" {
    when    = destroy
    command = "sh ${path.module}/scripts/servicediscovery-drain.sh ${split("/", self.service_registries[0].registry_arn)[1]}"
  }
}
