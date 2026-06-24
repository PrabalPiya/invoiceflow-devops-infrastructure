output "server_public_ip" {
  value = aws_instance.k3s_server.public_ip
}

output "app_url" {
  value = "http://${aws_instance.k3s_server.public_ip}"
}

output "ssh_command" {
  value = "ssh -i YOUR_KEY.pem ec2-user@${aws_instance.k3s_server.public_ip}"
}

output "rds_endpoint" {
  value = aws_db_instance.postgres.address
}