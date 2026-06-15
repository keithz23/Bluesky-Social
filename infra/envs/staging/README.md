# Staging Terraform

This directory provisions the staging Docker Compose host for the Social app.

## What It Creates

- EC2 instance running Amazon Linux 2023
- Security group allowing SSH, HTTP, and HTTPS
- Elastic IP attached to the EC2 instance
- Docker and Docker Compose plugin installed through user data

The database and Redis still run as Docker Compose services on the same EC2 host.

## Required GitHub Environment Secrets

Create these secrets in the `staging` GitHub Environment:

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
TF_STATE_BUCKET
EC2_KEY_NAME
SSH_CIDR
```

`SSH_CIDR` should usually be your public IP with `/32`, for example:

```text
203.0.113.10/32
```

`TF_STATE_BUCKET` must be an existing S3 bucket in `ap-southeast-1`.

## First Run

1. Create the S3 bucket used by `TF_STATE_BUCKET`.
2. Create or choose an existing EC2 key pair and save its name as `EC2_KEY_NAME`.
3. Add your current public IP as `SSH_CIDR`.
4. Run the `Terraform Staging` workflow manually with `apply = true`.
5. Copy the `public_ip` output into the deploy workflow secret `EC2_HOST`.
6. Run `Deploy Social App to EC2`.

## Local Usage

Copy the example tfvars file:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Then fill in:

```hcl
key_name        = "your-existing-ec2-key-pair"
ssh_cidr_blocks = ["YOUR_PUBLIC_IP/32"]
```

Run:

```bash
terraform init \
  -backend-config="bucket=YOUR_TF_STATE_BUCKET" \
  -backend-config="key=staging/social/terraform.tfstate" \
  -backend-config="region=ap-southeast-1"

terraform plan
```
