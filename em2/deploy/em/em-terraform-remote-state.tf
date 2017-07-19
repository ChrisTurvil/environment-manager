# Write the remote state
terraform {
  backend "s3" {
    bucket = "daveandjake-remote-state"
    key    = "argos"
    region = "eu-west-1"
  }
}

# Use the remote state
data "terraform_remote_state" "remote_state" {
  backend = "s3"

  config {
    bucket = "daveandjake-remote-state"
    key    = "argos"
  }
}
