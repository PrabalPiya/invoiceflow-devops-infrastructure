#!/bin/bash
set -euxo pipefail

exec > >(tee /var/log/invoiceflow-userdata.log | logger -t invoiceflow-userdata -s 2>/dev/console) 2>&1

dnf clean all
dnf makecache -y || true
dnf install -y --allowerasing curl git tar gzip

echo "Installing K3s..."
curl -sfL https://get.k3s.io | sh -

export KUBECONFIG=/etc/rancher/k3s/k3s.yaml

echo "Waiting for K3s node..."
until /usr/local/bin/kubectl get nodes; do
  sleep 10
done

echo "Setting kubeconfig for ec2-user..."
mkdir -p /home/ec2-user/.kube
cp /etc/rancher/k3s/k3s.yaml /home/ec2-user/.kube/config
chown -R ec2-user:ec2-user /home/ec2-user/.kube
chmod 600 /home/ec2-user/.kube/config

echo "Creating invoiceflow namespace..."
/usr/local/bin/kubectl create namespace invoiceflow --dry-run=client -o yaml | /usr/local/bin/kubectl apply -f -

echo "Creating app secret..."
/usr/local/bin/kubectl -n invoiceflow create secret generic invoiceflow-secrets \
  --from-literal=DATABASE_URL="postgresql://${db_username}:${db_password}@${db_host}:${db_port}/${db_name}" \
  --from-literal=JWT_SECRET="${jwt_secret}" \
  --from-literal=JWT_EXPIRES_IN="7d" \
  --dry-run=client -o yaml | /usr/local/bin/kubectl apply -f -

echo "Installing ArgoCD..."
/usr/local/bin/kubectl create namespace argocd --dry-run=client -o yaml | /usr/local/bin/kubectl apply -f -
/usr/local/bin/kubectl apply --server-side -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

echo "Waiting for ArgoCD CRD..."
until /usr/local/bin/kubectl get crd applications.argoproj.io; do
  sleep 10
done

echo "Applying ArgoCD Application..."
/usr/local/bin/kubectl apply -f ${github_raw_argocd_url}

echo "User-data completed successfully."