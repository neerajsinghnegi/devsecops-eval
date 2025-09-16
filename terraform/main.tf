terraform {
  required_version = ">= 1.0"
}

provider "google" {
  project = var.project
  region  = var.region
}

# Example: GKE module placeholder (do not use high privileges)
# Ensure least privilege by using specific service account and IAM bindings

variable "project" {}
variable "region" {}