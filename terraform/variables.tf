variable "aws_region" {
  type    = string
  default = "ap-south-1"
}

variable "project_name" {
  type    = string
  default = "invoiceflow"
}

variable "instance_type" {
  type    = string
  default = "t3.small"
}

variable "key_name" {
  type        = string
  description = "Existing AWS key pair name"
}

variable "ssh_allowed_ip" {
  type        = string
  description = "Your IP in CIDR format, e.g. 27.xx.xx.xx/32"
}

variable "github_raw_argocd_app_url" {
  type        = string
  description = "Raw GitHub URL of argocd/application.yaml"
}

variable "db_name" {
  type    = string
  default = "invoiceflow"
}

variable "db_username" {
  type    = string
  default = "postgres"
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "grafana_admin_password" {
  type      = string
  sensitive = true
}