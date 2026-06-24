#!/bin/bash
set -eux

dnf clean all
dnf makecache -y || true
dnf install -y --allowerasing curl git

# Install K3s. K3s includes Traefik by default.
curl -sfL https://get.k3s.io | sh -

sleep 30

export KUBECONFIG=/etc/rancher/k3s/k3s.yaml

# Allow ec2-user to use kubectl
mkdir -p /home/ec2-user/.kube
cp /etc/rancher/k3s/k3s.yaml /home/ec2-user/.kube/config
chown -R ec2-user:ec2-user /home/ec2-user/.kube
chmod 600 /home/ec2-user/.kube/config

# Create app namespace
kubectl create namespace invoiceflow --dry-run=client -o yaml | kubectl apply -f -

# Create app secret outside Git
kubectl -n invoiceflow create secret generic invoiceflow-secrets \
  --from-literal=DATABASE_URL="postgresql://${db_username}:${db_password}@${db_host}:${db_port}/${db_name}" \
  --from-literal=JWT_SECRET="${jwt_secret}" \
  --from-literal=JWT_EXPIRES_IN="7d" \
  --dry-run=client -o yaml | kubectl apply -f -

# Install ArgoCD
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait until ArgoCD server is ready
kubectl wait --for=condition=available --timeout=180s deployment/argocd-server -n argocd

# Apply your ArgoCD app from GitHub raw URL
kubectl apply -f ${github_raw_argocd_url}