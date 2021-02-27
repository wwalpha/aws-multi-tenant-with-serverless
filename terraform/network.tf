# ----------------------------------------------------------------------------------------------
# AWS VPC
# ----------------------------------------------------------------------------------------------
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name = "saas-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["ap-northeast-2a", "ap-northeast-2b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.3.0/24", "10.0.4.0/24"]

  enable_nat_gateway = true
}

# ----------------------------------------------------------------------------------------------
# AWS Security Group
# ----------------------------------------------------------------------------------------------
module "private_link_sg" {
  source = "terraform-aws-modules/security-group/aws"

  name        = "saas_allow_private"
  description = "saas_allow_private"
  vpc_id      = module.vpc.vpc_id

  ingress_cidr_blocks = ["10.10.0.0/16"]
  ingress_rules       = ["https-443-tcp"]
  ingress_with_cidr_blocks = [
    {
      from_port   = 8080
      to_port     = 8090
      protocol    = "tcp"
      description = "User-service ports"
      cidr_blocks = "10.10.0.0/16"
    },
    {
      rule        = "postgresql-tcp"
      cidr_blocks = "0.0.0.0/0"
    },
  ]
}
