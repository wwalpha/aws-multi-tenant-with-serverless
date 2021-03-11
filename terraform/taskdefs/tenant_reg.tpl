[
  {
    "name": "${container_name}",
    "image": "${container_image}",
    "essential": true,
    "portMappings": [
      {
        "containerPort": 80,
        "protocol": "tcp"
      }
    ],
    "environment": [
      {
        "name": "CONTAINER_PORT",
        "value": "80"
      }
    ],
    "secrets":[
      {
        "name": "DYNAMODB_TABLES",
        "valueFrom": "${dynamodb_tables}"
      },
      {
        "name": "SERVICE_ENDPOINTS",
        "valueFrom": "${service_endpoints}"
      }
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "secretOptions": null,
      "options": {
        "awslogs-create-group": "true",
        "awslogs-group": "/ecs/${container_name}",
        "awslogs-region": "${aws_region}",
        "awslogs-stream-prefix": "ecs"
      }
    },
    "healthCheck": {
      "retries": 3,
      "command": [
        "CMD-SHELL",
        "curl -f http://localhost/reg/health || exit 1"
      ],
      "timeout": 2,
      "interval": 5,
      "startPeriod": 10
    }
  },
  {
    "name": "xray-daemon",
    "image": "amazon/aws-xray-daemon",
    "essential": true,
    "cpu": 32,
    "memoryReservation": 256,
    "portMappings": [
      {
        "containerPort": 2000,
        "hostPort": 2000,
        "protocol": "udp"
      }
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "secretOptions": null,
      "options": {
        "awslogs-create-group": "true",
        "awslogs-group": "/ecs/xray-daemon",
        "awslogs-region": "${aws_region}",
        "awslogs-stream-prefix": "ecs"
      }
    }
  },
  {
    "name": "envoy",
    "user": "1337",
    "image": "840364872350.dkr.ecr.${aws_region}.amazonaws.com/aws-appmesh-envoy:v1.16.1.0-prod",
    "essential": true,
    "mountPoints": [],
    "volumesFrom": [],
    "memory": 500,
    "environment": [
      {
        "name": "APPMESH_VIRTUAL_NODE_NAME",
        "value": "${app_mesh_node}"
      },
      {
        "name": "ENABLE_ENVOY_XRAY_TRACING",
        "value": "1"
      }
    ],
    "healthCheck": {
      "retries": 3,
      "command": [
        "CMD-SHELL",
        "curl -s http://localhost:9901/server_info | grep state | grep -q LIVE"
      ],
      "timeout": 2,
      "interval": 5,
      "startPeriod": 10
    }
  }
]