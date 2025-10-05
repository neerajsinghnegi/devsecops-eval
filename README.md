# 🛡️ DevSecOps CI/CD Pipeline — End to End

This repository demonstrates a complete **DevSecOps pipeline** using **GitHub Actions**, **AWS EKS**, **Docker**, and **Terraform**.  
It integrates multiple **security gates** (SAST, IaC scanning, image scanning) and automates deployment through **Helm**.

---

## 🚀 Features

✅ Automated CI/CD workflow with GitHub Actions  
✅ Secure image building, scanning, and pushing  
✅ Terraform IaC scanning using tfsec  
✅ Static code analysis with npm audit and Semgrep  
✅ Image scanning using Trivy  
✅ Deployment on AWS EKS using Helm  
✅ Image management in dockerhub with S3 bucket

---

## 🧩 Project Structure

```
.
├── .github/
│   └── workflows/
│       ├── build-security.yml       # CI pipeline (build, scan, push)
│       └── infra-helm.yml             # TF and Helm deployment pipeline
├── app/
│   ├── Dockerfile                      # Node.js app Dockerfile
│   ├── package.json                    # Dependencies and scripts
│   ├── src/                            # Application source code
│   └── ...
├── terraform/
│   ├── main.tf                         # Infrastructure code
│   ├── backend.tf                      # S3 backend for remote state
│   ├── variables.tf
│   └── outputs.tf
├── semgrep/
│   └── .semgrep.yml                    # Semgrep rules for SAST
├── helm/
│   └── devsecops-chart/                # Helm chart for Kubernetes deployment
└── README.md
```

---

## ⚙️ GitHub Actions Workflow: **CI — Security Gates**

This workflow is responsible for:
- Running code quality and security scans
- Building and pushing Docker images
- Scanning container images for vulnerabilities
- Uploading artifacts for deployment
- Performing IaC scanning

### **Workflow Definition**

```yaml
name: Build and Security Scan

on:
  workflow_dispatch:        # Allows manual triggering
  pull_request:
  push:
    branches: [ main ]

env:
  IMAGE_NAME: ${{ github.repository }}
  AWS_REGION: ${{ vars.AWS_REGION }}

jobs:
  lint-and-sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd app && npm ci
      - name: Run npm audit (fail on high/critical)
        run: cd app && npm audit --audit-level=high || (echo "High/Critical vulnerabilities found" && exit 1)
      - name: Semgrep scan
        uses: returntocorp/semgrep-action@v1
        with:
          config: './semgrep/.semgrep.yml'

  build-scan-and-push-image:
    runs-on: ubuntu-latest
    needs: lint-and-sast
    environment: devsecops-eval
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-qemu-action@v2
      - uses: docker/setup-buildx-action@v2
      - uses: docker/login-action@v2
        with:
          username: ${{ secrets.REGISTRY_USERNAME }}
          password: ${{ secrets.REGISTRY_PASSWORD }}
      - name: Build Docker image
        run: |
          docker build -t ${{ vars.REGISTRY }}/${{ env.IMAGE_NAME }}:pr-${{ github.run_id }} -f app/Dockerfile .
      - name: Scan image with Trivy
        uses: aquasecurity/trivy-action@0.33.1
        with:
          image-ref: ${{ vars.REGISTRY }}/${{ env.IMAGE_NAME }}:pr-${{ github.run_id }}
          format: 'table'
          exit-code: '0'
          severity: 'CRITICAL,HIGH'
      - name: Push image
        run: docker push ${{ vars.REGISTRY }}/${{ env.IMAGE_NAME }}:pr-${{ github.run_id }}
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      - name: Save image tag
        run: echo "pr-${{ github.run_id }}" > image_tag.txt
      - uses: actions/upload-artifact@v4
        with:
          name: image-tag
          path: image_tag.txt
      - name: Save image tag to S3
        run: aws s3 cp image_tag.txt s3://devsecopsartifact-tag/image_tag.txt

  iac-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tfsec
        uses: aquasecurity/tfsec-action@v1.0.3
        with:
          args: --out tfsec-results.sarif
```

---

## ☁️ Terraform Remote Backend (S3)

Terraform uses an **S3 bucket** to store state files securely.

```hcl
terraform {
  backend "s3" {
    bucket         = "devsecops-tfstate"
    key            = "infra/terraform.tfstate"
    region         = "ap-south-1"
    encrypt        = true
  }
}
```

Initialize backend:

```bash
cd terraform
terraform init
```

---

## 🧱 Deploying on AWS EKS with Helm

After the image is pushed successfully, deploy it to EKS:

```bash
helm install devsecops-app ./helm/devsecops-chart   --set image.repository=<your-registry>/<your-repo>   --set image.tag=<tag-from-artifact>
```

### Verify Deployment

```bash
kubectl get pods
kubectl get svc
```

Example output:
```
NAME               READY   STATUS    RESTARTS   AGE
devsecops-app      1/1     Running   0          2m
mongo              1/1     Running   0          2m

NAME            TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)          AGE
devsecops-app   LoadBalancer    10.100.102.125   a71f7cc0ad4c04cdf8b53d16ed4ae71b-1142963895.ap-south-1.elb.amazonaws.com        8080:30080/TCP   2m
```

Access app in browser:
```
http://<LoadBalancer>:8080
```

---

## 🧠 How to Trigger Workflow Manually

To run the workflow **without pushing any code changes**:

1. Go to the **Actions** tab in your GitHub repository.
2. Select **“Build and Security Scan”**.
3. Click the **“Run workflow”** button (top-right).
4. Choose the branch → Click **Run workflow**.

This will start the full pipeline manually.

---

## 🔒 Security Tools Integrated

| Tool | Purpose |
|------|----------|
| **npm audit** | Checks dependencies for known vulnerabilities |
| **Semgrep** | Static Application Security Testing (SAST) |
| **Trivy** | Container image vulnerability scanning |
| **tfsec** | Terraform security misconfiguration scanning |
| **AWS S3 Backend** | Secure Terraform state management |

---

## 🌍 Environment Variables & Secrets

| Type | Key | Description |
|------|-----|-------------|
| Secret | `AWS_ACCESS_KEY_ID` | AWS access key for credentials |
| Secret | `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| Secret | `REGISTRY_USERNAME` | Docker registry username |
| Secret | `REGISTRY_PASSWORD` | Docker registry password |
| Variable | `AWS_REGION` | AWS region (e.g., `ap-south-1`) |
| Variable | `REGISTRY` | Container registry URL |

---

## 🧪 Pipeline Validation Steps

1. Trigger `Build and Security Scan` manually or via PR.  
2. Monitor the GitHub Actions logs:
   - ✅ npm audit (dependency scan)
   - ✅ Semgrep (SAST)
   - ✅ Trivy (container scan)
   - ✅ tfsec (IaC scan)
3. Check that the image is pushed to your registry.
4. Deploy it to EKS using Helm.

---

## 👨‍💻 Author

**Neeraj Singh Negi**  
DevOps Engineer