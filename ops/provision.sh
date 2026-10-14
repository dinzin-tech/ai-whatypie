#!/usr/bin/env bash
# ==============================================================================
# WhatyPie Server Provisioning Script (Idempotent)
# Target: Ubuntu 22.04 / 24.04 LTS on GCP Compute Engine VM (e2-medium or higher)
# ==============================================================================
set -euo pipefail

echo "========================================================================"
echo ">>> Starting WhatyPie Server Provisioning at $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "========================================================================"

if [ "$(id -u)" -ne 0 ]; then
    echo "ERROR: Please run this script with sudo or as root."
    exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo ">>> [1/7] Updating package repositories and installing core utilities..."
apt-get update -y
apt-get install -y --no-install-recommends \
    curl wget git unzip build-essential \
    software-properties-common ca-certificates gnupg \
    ufw fail2ban nginx certbot python3-certbot-nginx redis-server python3

echo ">>> [2/7] Installing Node.js v22 LTS & PM2..."
if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
fi

# Ensure npm and PM2
npm install -g pm2
pm2 install pm2-logrotate 2>/dev/null || true
pm2 set pm2-logrotate:max_size 50M 2>/dev/null || true
pm2 set pm2-logrotate:retain 10 2>/dev/null || true

echo "Node.js version: $(node -v)"
echo "NPM version    : $(npm -v)"
echo "PM2 version    : $(pm2 -v)"

echo ">>> [3/7] Installing MongoDB Community Server & Database Tools..."
if ! command -v mongod &>/dev/null; then
    UBUNTU_CODENAME=$(lsb_release -cs)
    curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | gpg --dearmor --yes -o /usr/share/keyrings/mongodb-server-8.0.gpg
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu ${UBUNTU_CODENAME}/mongodb-org/8.0 multiverse" > /etc/apt/sources.list.d/mongodb-org-8.0.list
    apt-get update -y
    apt-get install -y mongodb-org mongodb-database-tools || {
        echo "MongoDB 8.0 fallback to 7.0 for codename ${UBUNTU_CODENAME}..."
        curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor --yes -o /usr/share/keyrings/mongodb-server-7.0.gpg
        echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" > /etc/apt/sources.list.d/mongodb-org-7.0.list
        apt-get update -y
        apt-get install -y mongodb-org mongodb-database-tools
    }
fi

systemctl daemon-reload
systemctl enable mongod
systemctl restart mongod

echo ">>> [4/7] Configuring and enabling Redis Server..."
systemctl enable redis-server
systemctl restart redis-server

echo ">>> [5/7] Preparing application directory and web permissions..."
mkdir -p /var/www/whatypie
mkdir -p /var/log/whatypie

# Add current SUDO_USER to www-data if available
ACTUAL_USER="${SUDO_USER:-$(whoami)}"
usermod -aG www-data "$ACTUAL_USER" 2>/dev/null || true

chown -R "$ACTUAL_USER:www-data" /var/www/whatypie
chmod -R 775 /var/www/whatypie
chown -R www-data:www-data /var/log/whatypie

echo ">>> [6/7] Configuring Firewall (UFW)..."
ufw allow 22/tcp || true
ufw allow 80/tcp || true
ufw allow 443/tcp || true
ufw --force enable || true

echo ">>> [7/7] Configuring PM2 startup hooks..."
# Configure PM2 to restart automatically on system reboot
pm2 startup systemd -u "$ACTUAL_USER" --hp "/home/$ACTUAL_USER" || true

echo "========================================================================"
echo ">>> GCP Server Provisioning Complete!"
echo ">>> Status Check:"
echo "    Node.js  : $(node -v)"
echo "    PM2      : $(pm2 -v)"
echo "    MongoDB  : $(systemctl is-active mongod)"
echo "    Redis    : $(systemctl is-active redis-server)"
echo "    Nginx    : $(systemctl is-active nginx)"
echo "========================================================================"
