# WhatyPie AWS-to-GCP Migration & Deployment Guide

This guide details the complete process to **backup WhatyPie from AWS** and **deploy it onto Google Cloud Platform (GCP)** using the automated production patterns from the reference project (`skynet-electronics-quizz`).

---

## Architecture Comparison & Analysis

| Component | Architecture & Configuration |
| :--- | :--- |
| **Backend API** | Node.js (v22 LTS, Express, ES Modules) running on port `5000` via PM2 (`whatypie-api`). Handles REST APIs, WebSockets (`socket.io`), and WhatsApp integrations (Baileys & Meta Cloud API). |
| **Tenant Inbox SPA** | Next.js running on port `3000` via PM2 (`whatypie-frontend`). |
| **Super Admin SPA** | Next.js running on port `3001` via PM2 (`whatypie-admin`). |
| **Database** | MongoDB (v7.0/v8.0) storing chats, users, contacts, templates, and billing. |
| **Task Queue** | Redis (BullMQ) running locally on port `6379`. |
| **Reverse Proxy & SSL** | Nginx with Certbot (Let's Encrypt), WebSocket upgrade headers, and multi-subdomain routing. |
| **CI/CD Automation** | GitHub Actions workflow (`deploy.yml`) supporting both SSH deploy and Self-Hosted Runner on the GCP VM. |

---

# SECTION 1: AWS Backup Strategy (Step-by-Step)

Before decommissioning or migrating from AWS, you must backup 4 critical components:
1. **MongoDB Database** (All accounts, message records, tags, campaigns).
2. **WhatsApp Baileys Session Keys** (`storage/sessions/baileys/`) - *if lost, all users will be disconnected from WhatsApp and must re-scan QR codes*.
3. **Uploaded Media Files** (`public/uploads` and `uploads/` or S3 bucket contents).
4. **Environment Secrets** (`.env` files for API, Frontend, and Admin).

### Method A: Automated One-Click Backup Script (Recommended)

1. SSH into your current **AWS EC2 instance**:
   ```bash
   ssh -i /path/to/aws-key.pem ubuntu@YOUR_AWS_EC2_IP
   ```

2. Navigate to your project directory (e.g., `/var/www/whatypie`):
   ```bash
   cd /var/www/whatypie
   ```

3. Run the automated backup script:
   ```bash
   bash ops/backup-aws.sh
   ```

   The script automatically:
   - Dumps your MongoDB database using `mongodump --gzip --archive`.
   - Packages all Baileys WhatsApp authentication session files.
   - Archives user media uploads.
   - Archives all `.env` configurations.
   - Bundles everything into `/tmp/whatypie_aws_backup_YYYYMMDD_HHMMSS.tar.gz` and calculates its SHA256 checksum.

4. (Optional) If you have an AWS S3 Bucket containing uploaded media, sync it to your local machine or directly to GCP Cloud Storage:
   ```bash
   aws s3 sync s3://YOUR_S3_BUCKET_NAME ./s3_media_backup/
   ```

5. Download the backup archive to your local computer (or transfer directly to GCP):
   ```bash
   # Run this on your local machine:
   scp -i /path/to/aws-key.pem ubuntu@YOUR_AWS_EC2_IP:/tmp/whatypie_aws_backup_*.tar.gz ./
   ```

---

### Method B: Manual Backup Commands (If Preferred)

If you prefer executing each step manually on AWS:

```bash
# 1. Create a staging backup folder
mkdir -p /tmp/manual_backup/database /tmp/manual_backup/sessions /tmp/manual_backup/configs /tmp/manual_backup/uploads

# 2. Dump MongoDB
mongodump --gzip --archive=/tmp/manual_backup/database/mongodb_dump.archive.gz

# 3. Copy WhatsApp active Baileys session files
cp -a /var/www/whatypie/Wapto-api/storage/sessions/. /tmp/manual_backup/sessions/ 2>/dev/null || true

# 4. Copy uploaded media
cp -a /var/www/whatypie/Wapto-api/uploads/. /tmp/manual_backup/uploads/ 2>/dev/null || true
cp -a /var/www/whatypie/Wapto-api/public/uploads/. /tmp/manual_backup/uploads/ 2>/dev/null || true

# 5. Copy environment files
cp /var/www/whatypie/Wapto-api/.env /tmp/manual_backup/configs/Wapto-api.env
cp /var/www/whatypie/Wapto-frontend/.env /tmp/manual_backup/configs/Wapto-frontend.env
cp /var/www/whatypie/Wapto-admin/.env /tmp/manual_backup/configs/Wapto-admin.env

# 6. Compress into a single tarball
tar -czvf /tmp/whatypie_aws_backup.tar.gz -C /tmp manual_backup
```

---

# SECTION 2: GCP Setup, Migration & Deployment

### Step 1: Provision Google Cloud Compute Engine VM

1. Open [Google Cloud Console](https://console.cloud.google.com/) -> **Compute Engine** -> **VM instances** -> **Create Instance**.
2. **Machine Specifications**:
   - **Machine type**: `e2-medium` (2 vCPUs, 4 GB RAM) or `e2-standard-2` (2 vCPUs, 8 GB RAM).
   - **Boot disk**: **Ubuntu 22.04 LTS** or **Ubuntu 24.04 LTS** (x86/64), **35 GB SSD** or higher.
   - **Firewall**: Check **Allow HTTP traffic** and **Allow HTTPS traffic**.
3. **Static IP**:
   - Go to **VPC Network** -> **IP addresses** -> Reserve a **Static External IP** and associate it with this VM.
4. **DNS Configuration**:
   - Point your DNS records (A Records) to this new GCP Static IP:
     - `api.yourdomain.com` ➔ `GCP_STATIC_IP`
     - `chat.yourdomain.com` ➔ `GCP_STATIC_IP`
     - `admin.yourdomain.com` ➔ `GCP_STATIC_IP`

---

### Step 2: Provision GCP Server via Automated Script

1. SSH into your newly created GCP VM:
   ```bash
   ssh -i /path/to/gcp-key username@YOUR_GCP_VM_IP
   ```

2. Clone your repository into `/var/www/whatypie`:
   ```bash
   sudo mkdir -p /var/www/whatypie
   sudo chown -R $USER:www-data /var/www/whatypie
   git clone <YOUR_GIT_REPOSITORY_URL> /var/www/whatypie
   cd /var/www/whatypie
   ```

3. Run the automated provisioning script (installs Node.js 22 LTS, PM2, MongoDB, Redis, Nginx, Certbot, UFW, and build tools):
   ```bash
   sudo bash ops/provision.sh
   ```

---

### Step 3: Restore the AWS Backup on GCP

1. Transfer your backup archive from your local machine to the GCP VM:
   ```bash
   # Run on your local computer:
   scp -i /path/to/gcp-key whatypie_aws_backup_*.tar.gz username@YOUR_GCP_VM_IP:/tmp/
   ```

2. On the GCP VM, execute the automated restore script:
   ```bash
   cd /var/www/whatypie
   sudo bash ops/restore-gcp.sh /tmp/whatypie_aws_backup_*.tar.gz
   ```

   The script will:
   - Extract and verify configs.
   - Restore the MongoDB database using `mongorestore --gzip --archive=... --drop`.
   - Restore WhatsApp Baileys session files into `Wapto-api/storage/sessions/baileys/`.
   - Restore media uploads into `public/uploads` and `uploads/`.
   - Re-apply ownership (`chown -R $USER:www-data /var/www/whatypie`) and permissions.

3. Verify environment configurations in:
   - `Wapto-api/.env`
   - `Wapto-frontend/.env`
   - `Wapto-admin/.env`

---

### Step 4: Run Initial Deployment

Deploy and build all services with zero downtime and automatic SSL configuration:

```bash
cd /var/www/whatypie
bash ops/deploy.sh master
```

The deployment script executes 7 stages:
1. `git fetch` and `git checkout` to target branch.
2. Installs backend dependencies (`npm ci --omit=dev`).
3. Builds the Tenant Next.js application (`npm run build`).
4. Builds the Super Admin Next.js application (`npm run build`).
5. Starts / reloads the PM2 cluster with `ops/ecosystem.config.cjs`.
6. Configures Nginx, triggers Certbot for SSL certificates for each subdomain, and reloads Nginx.
7. Executes health check tests on port 5000, 3000, and 3001.

Check the live status anytime:
```bash
pm2 status
pm2 logs
```

---

### Step 5: Automated CI/CD Deployment via GitHub Actions

The repository includes [.github/workflows/deploy.yml](file:///.github/workflows/deploy.yml) matching the reference project, supporting two methods:

#### Method 1: Deploy via SSH (GitHub-Hosted Runner)
Add these secrets in GitHub repository (**Settings** -> **Secrets and variables** -> **Actions**):
- `GCP_VM_HOST`: Your GCP VM External IP.
- `GCP_VM_USER`: Your SSH username (e.g., `ubuntu` or your GCP username).
- `GCP_SSH_PRIVATE_KEY`: Your SSH private key.
- `GCP_VM_PORT`: `22` (default).

Whenever you push to `master` (or trigger manually via `workflow_dispatch`), GitHub Actions logs into GCP, fetches updates, builds Next.js apps, reloads PM2, and verifies health check endpoints.

#### Method 2: Deploy via Self-Hosted Runner (On the GCP VM)
If you prefer running deployments directly on the GCP VM without opening inbound SSH:
1. On your GCP VM, execute the runner setup script:
   ```bash
   sudo bash /var/www/whatypie/ops/setup-runner.sh
   ```
2. Enter your repository URL and runner registration token (obtained from GitHub **Settings** -> **Actions** -> **Runners** -> **New self-hosted runner**).
3. In GitHub Repository Variables, set `DEPLOY_METHOD=self-hosted`.
4. Subsequent pushes trigger the deployment runner locally on the VM.

---

## Operations Cheat Sheet

| Action | Command |
| :--- | :--- |
| **Check PM2 process status** | `pm2 status` |
| **View combined live logs** | `pm2 logs` |
| **View API logs only** | `pm2 logs whatypie-api` |
| **Restart PM2 processes** | `pm2 restart ops/ecosystem.config.cjs` |
| **Reload Nginx** | `sudo nginx -t && sudo systemctl reload nginx` |
| **Check MongoDB status** | `sudo systemctl status mongod` |
| **Check Redis status** | `sudo systemctl status redis-server` |
| **Manual Deploy** | `bash ops/deploy.sh master` |
