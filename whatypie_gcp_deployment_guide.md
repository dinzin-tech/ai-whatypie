# Deployment Guide: WhatyPie on Google Cloud Platform (GCP) VM

This step-by-step guide explains how to deploy **WhatyPie** (API backend, Tenant Frontend, and Admin Portal) on a Google Cloud Compute Engine VM instance running Ubuntu 22.04 LTS/24.04 LTS.

---

## Architecture Overview

We will host three separate web components on a single VM and proxy traffic to them using **Nginx** based on different domains:
1.  **Backend API** (`WhatyPie-api`): Running on port `5000` (proxied from `api.yourdomain.com`).
2.  **Tenant Inbox App** (`WhatyPie-frontend`): Running on port `3000` (proxied from `chat.yourdomain.com`).
3.  **Super Admin App** (`WhatyPie-admin`): Running on port `3001` (proxied from `admin.yourdomain.com`).
4.  **Database**: MongoDB running locally.
5.  **Queue Broker**: Redis (for BullMQ queues) running locally.

---

## Step 1: GCP Compute Engine VM Setup

1.  Log in to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Navigate to **Compute Engine** -> **VM instances** -> **Create Instance**.
3.  **Configurations**:
    *   **Region/Zone**: Choose one closest to your target clients.
    *   **Machine type**: At least **e2-medium** (2 vCPUs, 4 GB memory) is highly recommended due to Next.js compilation memory requirements and WhatsApp connection processes.
    *   **Boot disk**: Select **Ubuntu 22.04 LTS** or **Ubuntu 24.04 LTS** (x86/64), with a size of **30 GB** or higher (SSD recommended).
4.  **Firewall Rules**:
    *   Check both **Allow HTTP traffic** and **Allow HTTPS traffic**.
5.  Click **Create**.
6.  Once created, note down your **External IP Address** and assign a static reserved IP address to this VM so it does not change.
7.  **DNS Configurations**: Point your domain/subdomains to this VM's External IP via your DNS manager (e.g., Cloudflare, GoDaddy):
    *   `api.yourdomain.com` ➔ VM External IP
    *   `chat.yourdomain.com` ➔ VM External IP
    *   `admin.yourdomain.com` ➔ VM External IP

---

## Step 2: System Setup & Tools Installation

SSH into your GCP VM instance using the SSH button or gcloud command line, and execute the following commands:

```bash
# 1. Update system packages
sudo apt update && sudo apt upgrade -y

# 2. Install essential build tools
sudo apt install curl wget git unzip build-essential nginx certbot python3-certbot-nginx redis-server -y

# 3. Enable and start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

---

## Step 3: Install Node.js & PM2

WhatyPie requires Node.js. We will install Node.js v22 (LTS):

```bash
# Install NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs

# Verify versions
node --version
npm --version

# Install PM2 globally to keep Node.js apps running in the background
sudo npm install -y pm2 -g
```

---

## Step 4: Install MongoDB

WhatyPie uses MongoDB to store chat history, users, configurations, and templates.

```bash
# 1. Import GPG Key
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor

# 2. Add Repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list

# 3. Install MongoDB
sudo apt update
sudo apt install -y mongodb-org

# 4. Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Configure MongoDB Admin Security (Recommended)
Open the MongoDB shell:
```bash
mongosh
```
Switch to the admin db and create a root user:
```javascript
use admin
db.createUser({
  user: "admin",
  pwd: "ChooseAStrongPasswordHere",
  roles: [ { role: "root", db: "admin" } ]
})
exit
```
Enable authentication by editing the config:
```bash
sudo nano /etc/mongod.conf
```
Find the `#security:` line, uncomment it, and configure it as follows:
```yaml
security:
  authorization: "enabled"
```
Restart MongoDB:
```bash
sudo systemctl restart mongod
```

---

## Step 5: Deploy the Codebase

Clone your WhatyPie repository (or upload the project folders using SCP/FTP) into the `/var/www/` directory of the VM:

```bash
sudo mkdir -p /var/www/whatypie
sudo chown -R $USER:$USER /var/www/whatypie
cd /var/www/whatypie

# Clone or move your files here
# Structure should look like:
# /var/www/whatypie/Wapto-api
# /var/www/whatypie/Wapto-frontend
# /var/www/whatypie/Wapto-admin
```

---

## Step 6: Configure & Start Backend (`WhatyPie-api`)

1.  Navigate to the API folder and install dependencies:
    ```bash
    cd /var/www/whatypie/Wapto-api
    npm install --production
    ```
2.  Configure Environment variables:
    ```bash
    cp .env.example .env
    nano .env
    ```
    Add your MongoDB connection string (pointing to localhost with credentials configured in Step 4), Redis details, JWT secret, domain variables, and Meta WABA/Payment API details.
3.  **Seed the Database**:
    ```bash
    npm run seed
    ```
    *(This creates the default super-admin credentials, system settings, currencies, and roles).*
4.  Start the backend with PM2:
    ```bash
    pm2 start server.js --name "whatypie-api"
    ```

---

## Step 7: Configure & Start Frontend components

### 1. Tenant Frontend (`WhatyPie-frontend`)
1.  Navigate to the folder:
    ```bash
    cd /var/www/whatypie/Wapto-frontend
    ```
2.  Configure Environment variables:
    ```bash
    cp .env.example .env
    nano .env
    ```
    Set `NEXT_PUBLIC_API_URL=https://api.yourdomain.com`.
3.  Build and start using PM2:
    ```bash
    npm install
    npm run build
    pm2 start npm --name "whatypie-frontend" -- start -- -p 3000
    ```

### 2. Super Admin Panel (`WhatyPie-admin`)
1.  Navigate to the folder:
    ```bash
    cd /var/www/whatypie/Wapto-admin
    ```
2.  Configure Environment variables:
    ```bash
    cp .env.example .env
    nano .env
    ```
    Set API redirects appropriately to `https://api.yourdomain.com`.
3.  Build and start using PM2:
    ```bash
    npm install
    npm run build
    pm2 start npm --name "whatypie-admin" -- start -- -p 3001
    ```

---

## Step 8: Configure Nginx & SSL

1.  Delete default Nginx configs:
    ```bash
    sudo rm /etc/nginx/sites-enabled/default
    ```
2.  Create a configuration file for WhatyPie:
    ```bash
    sudo nano /etc/nginx/sites-available/whatypie
    ```
3.  Paste the configuration below (replace `yourdomain.com` with your actual domains):

```nginx
# 1. Tenant Inbox Frontend
server {
    listen 80;
    server_name chat.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# 2. Super Admin Panel
server {
    listen 80;
    server_name admin.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# 3. Backend API & WebSockets
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

4.  Link and test Nginx:
    ```bash
    sudo ln -s /etc/nginx/sites-available/whatypie /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```

5.  **Secure with Let's Encrypt SSL Certificates**:
    ```bash
    sudo certbot --nginx -d chat.yourdomain.com -d admin.yourdomain.com -d api.yourdomain.com
    ```
    Select option `2` to redirect all HTTP traffic to HTTPS automatically.

---

## Step 9: Save PM2 Process List

Ensure that your Node apps automatically restart if the GCP VM instance ever reboots:

```bash
pm2 save
pm2 startup
```
Copy and execute the output command generated by `pm2 startup` to configure the systemd service.

**Congratulations! Your WhatyPie SaaS platform is live and running securely on your GCP VM!**
