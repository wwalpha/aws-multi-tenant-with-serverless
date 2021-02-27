output "name" {
  value = aws_ecr_repository.saas_auth.repository_url
}

output "sg" {
  value = module.private_link_sg
}
