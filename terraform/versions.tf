terraform {
  required_version = ">= 1.5"

  backend "s3" {
    bucket                      = "forumline-terraform-state"
    key                         = "tunnel/terraform.tfstate"
    region                      = "us-east-1"
    endpoint                    = "https://b4cf6ac20ef4cd693cd7a81113b8d031.r2.cloudflarestorage.com"
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    force_path_style            = true
  }

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}
