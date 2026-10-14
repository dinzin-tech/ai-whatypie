#!/usr/bin/env bash
# ==============================================================================
# WhatyPie GCP Restore Script
# Restores MongoDB database, WhatsApp sessions, media uploads, and configs from backup
# ==============================================================================
set -euo pipefail

BACKUP_TARBALL="${1:-}"
APP_DIR="${APP_DIR:-/var/www/whatypie}"

if [ -z "$BACKUP_TARBALL" ]; then
    echo "Usage: sudo bash ops/restore-gcp.sh /path/to/whatypie_aws_backup_YYYYMMDD_HHMMSS.tar.gz"
    exit 1
fi

if [ ! -f "$BACKUP_TARBALL" ]; then
    echo "ERROR: Backup archive $BACKUP_TARBALL does not exist!"
    exit 1
fi

if [ ! -d "$APP_DIR" ]; then
    echo "ERROR: Target application directory $APP_DIR does not exist!"
    echo "Please clone the repo into $APP_DIR or run ops/provision.sh first."
    exit 1
fi

TEMP_EXTRACT_DIR=$(mktemp -d /tmp/whatypie_restore_XXXXXX)
trap 'rm -rf "$TEMP_EXTRACT_DIR"' EXIT

echo "========================================================================"
echo ">>> Starting WhatyPie Restore on GCP at $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo ">>> Archive: $BACKUP_TARBALL"
echo ">>> Destination: $APP_DIR"
echo "========================================================================"

echo ">>> [1/5] Extracting archive..."
tar -xzf "$BACKUP_TARBALL" -C "$TEMP_EXTRACT_DIR"
EXTRACTED_SUBDIR=$(find "$TEMP_EXTRACT_DIR" -mindepth 1 -maxdepth 1 -type d | head -n 1)

if [ -z "$EXTRACTED_SUBDIR" ] || [ ! -d "$EXTRACTED_SUBDIR" ]; then
    echo "ERROR: Malformed backup archive structure!"
    exit 1
fi

# ------------------------------------------------------------------------------
# 1. Restore Environment Configurations
# ------------------------------------------------------------------------------
echo ">>> [2/5] Restoring environment files..."
if [ -f "$EXTRACTED_SUBDIR/configs/Wapto-api.env" ]; then
    if [ ! -f "$APP_DIR/Wapto-api/.env" ]; then
        cp "$EXTRACTED_SUBDIR/configs/Wapto-api.env" "$APP_DIR/Wapto-api/.env"
        echo "  - Restored Wapto-api/.env"
    else
        cp "$EXTRACTED_SUBDIR/configs/Wapto-api.env" "$APP_DIR/Wapto-api/.env.aws_backup"
        echo "  - Wapto-api/.env already exists; saved AWS version as .env.aws_backup"
    fi
fi

if [ -f "$EXTRACTED_SUBDIR/configs/Wapto-frontend.env" ]; then
    if [ ! -f "$APP_DIR/Wapto-frontend/.env" ]; then
        cp "$EXTRACTED_SUBDIR/configs/Wapto-frontend.env" "$APP_DIR/Wapto-frontend/.env"
        echo "  - Restored Wapto-frontend/.env"
    else
        cp "$EXTRACTED_SUBDIR/configs/Wapto-frontend.env" "$APP_DIR/Wapto-frontend/.env.aws_backup"
    fi
fi

if [ -f "$EXTRACTED_SUBDIR/configs/Wapto-admin.env" ]; then
    if [ ! -f "$APP_DIR/Wapto-admin/.env" ]; then
        cp "$EXTRACTED_SUBDIR/configs/Wapto-admin.env" "$APP_DIR/Wapto-admin/.env"
        echo "  - Restored Wapto-admin/.env"
    else
        cp "$EXTRACTED_SUBDIR/configs/Wapto-admin.env" "$APP_DIR/Wapto-admin/.env.aws_backup"
    fi
fi

# ------------------------------------------------------------------------------
# 2. Restore MongoDB Database
# ------------------------------------------------------------------------------
echo ">>> [3/5] Restoring MongoDB database..."
DB_DUMP="$EXTRACTED_SUBDIR/database/mongodb_dump.archive.gz"
if [ -f "$DB_DUMP" ]; then
    MONGO_URI=""
    if [ -f "$APP_DIR/Wapto-api/.env" ]; then
        MONGO_URI=$(grep -E '^\s*(MONGODB_URI|MONGO_URI)=' "$APP_DIR/Wapto-api/.env" | head -n 1 | cut -d '=' -f2- | tr -d ' "\r\47' || true)
    fi

    if command -v mongorestore &>/dev/null; then
        if [ -n "$MONGO_URI" ]; then
            echo "  - Restoring to MongoDB using URI: ${MONGO_URI%/*}/..."
            mongorestore --uri="$MONGO_URI" --gzip --archive="$DB_DUMP" --drop
        else
            echo "  - Restoring to local default MongoDB instance (127.0.0.1:27017)..."
            mongorestore --gzip --archive="$DB_DUMP" --drop
        fi
        echo "  - MongoDB database restored successfully!"
    else
        echo "WARNING: mongorestore tool is not installed! Install mongodb-database-tools and run:"
        echo "  mongorestore --gzip --archive=$DB_DUMP --drop"
    fi
else
    echo "  - No MongoDB archive present in backup. Skipping."
fi

# ------------------------------------------------------------------------------
# 3. Restore WhatsApp Baileys Active Session Data
# ------------------------------------------------------------------------------
echo ">>> [4/5] Restoring WhatsApp sessions..."
if [ -d "$EXTRACTED_SUBDIR/sessions" ] && [ "$(ls -A "$EXTRACTED_SUBDIR/sessions" 2>/dev/null)" ]; then
    mkdir -p "$APP_DIR/Wapto-api/storage/sessions"
    cp -a "$EXTRACTED_SUBDIR/sessions/." "$APP_DIR/Wapto-api/storage/sessions/"
    echo "  - Restored WhatsApp sessions to $APP_DIR/Wapto-api/storage/sessions/"
else
    echo "  - No local sessions found in backup."
fi

# ------------------------------------------------------------------------------
# 4. Restore Uploads and Fix Permissions
# ------------------------------------------------------------------------------
echo ">>> [5/5] Restoring uploads & setting permissions..."
if [ -d "$EXTRACTED_SUBDIR/uploads" ]; then
    if [ -d "$EXTRACTED_SUBDIR/uploads/uploads" ]; then
        mkdir -p "$APP_DIR/Wapto-api/uploads"
        cp -a "$EXTRACTED_SUBDIR/uploads/uploads/." "$APP_DIR/Wapto-api/uploads/"
    fi
    if [ -d "$EXTRACTED_SUBDIR/uploads/public/uploads" ] || [ -d "$EXTRACTED_SUBDIR/uploads/uploads" ]; then
        mkdir -p "$APP_DIR/Wapto-api/public/uploads"
        cp -a "$EXTRACTED_SUBDIR/uploads/"* "$APP_DIR/Wapto-api/public/uploads/" 2>/dev/null || true
    fi
    echo "  - Restored uploaded files."
fi

# Permissions
RUNNING_USER=$(whoami)
chown -R "$RUNNING_USER:www-data" "$APP_DIR" 2>/dev/null || true
chmod -R u+rwX,g+rX "$APP_DIR" 2>/dev/null || true
if [ -d "$APP_DIR/Wapto-api/storage" ]; then
    chmod -R 775 "$APP_DIR/Wapto-api/storage" 2>/dev/null || true
fi

echo "========================================================================"
echo ">>> Restore complete! Database and files are ready on GCP."
echo ">>> Next step: Run 'bash ops/deploy.sh master' to compile and start services."
echo "========================================================================"
