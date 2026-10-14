#!/usr/bin/env bash
# ==============================================================================
# WhatyPie Deployment Script (Zero-Downtime & Automated SSL)
# Target: Ubuntu 22.04 / 24.04 LTS (GCP Compute Engine VM)
# ==============================================================================
set -euo pipefail

export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"

APP_DIR="${APP_DIR:-/var/www/whatypie}"
TARGET_BRANCH="${1:-master}"

echo "========================================================================"
echo ">>> Starting WhatyPie Deployment at $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo ">>> Target Directory : $APP_DIR"
echo ">>> Target Branch    : $TARGET_BRANCH"
echo ">>> Running User     : $(whoami) (UID: $(id -u))"
echo "========================================================================"

if [ ! -d "$APP_DIR" ]; then
    echo "ERROR: Target directory $APP_DIR does not exist!"
    exit 1
fi

cd "$APP_DIR"

SUDO=""
if [ "$(id -u)" -ne 0 ]; then
    SUDO="sudo"
fi

echo ">>> [1/7] Fetching and synchronizing Git branch: $TARGET_BRANCH..."
git reset --hard HEAD || true
git fetch origin "$TARGET_BRANCH"
git checkout -f "$TARGET_BRANCH"
git reset --hard "origin/$TARGET_BRANCH"

echo ">>> [2/7] Installing production dependencies for Backend API..."
cd "$APP_DIR/Wapto-api"
if [ -f package-lock.json ]; then
    npm ci --omit=dev --silent
else
    npm install --omit=dev --silent
fi

echo ">>> [3/7] Compiling Tenant Frontend (Next.js)..."
cd "$APP_DIR/Wapto-frontend"
if [ -f package-lock.json ]; then
    npm ci --silent
else
    npm install --silent
fi
npm run build

echo ">>> [4/7] Compiling Super Admin Portal (Next.js)..."
cd "$APP_DIR/Wapto-admin"
if [ -f package-lock.json ]; then
    npm ci --silent
else
    npm install --silent
fi
npm run build

echo ">>> [5/7] Managing PM2 processes..."
cd "$APP_DIR"
# If PM2 ecosystem is already running, reload it; otherwise start it
if pm2 describe whatypie-api >/dev/null 2>&1; then
    echo "  - Reloading existing PM2 cluster..."
    pm2 reload ops/ecosystem.config.cjs --update-env
else
    echo "  - Starting PM2 ecosystem..."
    pm2 start ops/ecosystem.config.cjs
fi
pm2 save

echo ">>> [6/7] Configuring Nginx reverse proxy & automated SSL..."
TARGET_CONF="/etc/nginx/sites-available/whatypie.conf"
TMP_CONF=$(mktemp)

if [ -f "$APP_DIR/ops/nginx/render-config.py" ] && [ -d /etc/nginx/sites-available ]; then
    # Generate initial HTTP config
    python3 "$APP_DIR/ops/nginx/render-config.py" --app-dir "$APP_DIR" --ssl-mode auto --output "$TMP_CONF"

    # Extract domains from generated config or .env for certbot checks
    API_DOMAIN=$(grep -E '^\s*server_name\s+' "$TMP_CONF" | head -n 1 | awk '{print $2}' | tr -d ';')
    FRONTEND_DOMAIN=$(grep -E '^\s*server_name\s+' "$TMP_CONF" | sed -n '2p' | awk '{print $2}' | tr -d ';')
    ADMIN_DOMAIN=$(grep -E '^\s*server_name\s+' "$TMP_CONF" | sed -n '3p' | awk '{print $2}' | tr -d ';')

    $SUDO cp "$TMP_CONF" "$TARGET_CONF"
    if [ ! -f /etc/nginx/sites-enabled/whatypie.conf ]; then
        $SUDO ln -sf "$TARGET_CONF" /etc/nginx/sites-enabled/whatypie.conf
    fi
    $SUDO rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

    if $SUDO nginx -t >/dev/null 2>&1; then
        $SUDO systemctl reload nginx
    fi

    # Check Let's Encrypt certificates if real domains are set
    if command -v certbot >/dev/null 2>&1; then
        for DOMAIN in "$API_DOMAIN" "$FRONTEND_DOMAIN" "$ADMIN_DOMAIN"; do
            if [ -n "$DOMAIN" ] && [ "$DOMAIN" != "localhost" ] && [ "$DOMAIN" != "127.0.0.1" ] && [[ ! "$DOMAIN" =~ \.local$ ]] && [[ ! "$DOMAIN" =~ yourdomain\.com ]]; then
                CERT_FILE="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
                if ! $SUDO test -f "$CERT_FILE" 2>/dev/null; then
                    echo ">>> Requesting Let's Encrypt SSL certificate for $DOMAIN..."
                    $SUDO certbot certonly --webroot -w "$APP_DIR/Wapto-api/public" -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email || true
                fi
            fi
        done

        # Re-render with active SSL certificates
        python3 "$APP_DIR/ops/nginx/render-config.py" --app-dir "$APP_DIR" --ssl-mode auto --output "$TMP_CONF"
        if ! cmp -s "$TMP_CONF" "$TARGET_CONF" 2>/dev/null; then
            $SUDO cp "$TMP_CONF" "$TARGET_CONF"
            if $SUDO nginx -t >/dev/null 2>&1; then
                $SUDO systemctl reload nginx
                echo ">>> Nginx SSL configuration reloaded successfully."
            fi
        fi
    fi
    rm -f "$TMP_CONF"
fi

# Set proper directory permissions
$SUDO chown -R "$(whoami):www-data" "$APP_DIR" 2>/dev/null || true
$SUDO chmod -R u+rwX,g+rX "$APP_DIR" 2>/dev/null || true
if [ -d "$APP_DIR/Wapto-api/storage" ]; then
    $SUDO chmod -R 775 "$APP_DIR/Wapto-api/storage" 2>/dev/null || true
fi

echo ">>> [7/7] Verifying health checks..."
sleep 3

# Verify API backend
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5000/ || echo "failed")
echo "  - API Backend (:5000) Health: HTTP $API_STATUS"

# Verify Tenant Frontend
FE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ || echo "failed")
echo "  - Tenant Frontend (:3000) Health: HTTP $FE_STATUS"

# Verify Super Admin
ADMIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/ || echo "failed")
echo "  - Super Admin (:3001) Health: HTTP $ADMIN_STATUS"

echo "========================================================================"
echo ">>> WhatyPie deployment finished successfully!"
echo ">>> Timestamp: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "========================================================================"
