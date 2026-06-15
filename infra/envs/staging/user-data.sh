#!/bin/bash
set -euxo pipefail

dnf update -y
dnf install -y docker

systemctl enable docker
systemctl start docker

usermod -aG docker ec2-user

mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL "https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-x86_64" -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
ln -sf /usr/local/lib/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose

mkdir -p /home/ec2-user/social
chown -R ec2-user:ec2-user /home/ec2-user/social
