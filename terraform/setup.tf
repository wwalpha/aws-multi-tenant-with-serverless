# ----------------------------------------------------------------------------------------------
# ECR - Auth
# ----------------------------------------------------------------------------------------------
resource "aws_ecr_repository" "saas_auth" {
  name                 = "saas/auth"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false
  }
}

# ----------------------------------------------------------------------------------------------
# Null Resource
# ----------------------------------------------------------------------------------------------
resource "null_resource" "backend_auth" {
  triggers = {
    file_content_md5 = md5(file("${path.module}/scripts/dockerbuild.sh"))
  }

  provisioner "local-exec" {
    command = "sh ${path.module}/scripts/dockerbuild.sh"

    environment = {
      FOLDER_PATH    = "../backend/auth-manager"
      AWS_REGION     = local.region
      AWS_ACCOUNT_ID = local.account_id
      REPO_URL       = aws_ecr_repository.saas_auth.repository_url
    }
  }
}

resource "null_resource" "lambda_build" {
  triggers = {
    file_content_md5 = md5(file("../${path.module}/functions/authorizer/index.ts"))
  }

  provisioner "local-exec" {
    command = "sh ${path.module}/scripts/tscbuild.sh"

    environment = {
      FOLDER_PATH = "../functions/authorizer"
    }
  }
}
