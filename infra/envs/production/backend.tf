terraform {
  backend "s3" {
    bucket       = "amz-social-terraform-state"
    key          = "social/production/terraform.tfstate"
    region       = "ap-southeast-1"
    encrypt      = true
    use_lockfile = true
  }
}
