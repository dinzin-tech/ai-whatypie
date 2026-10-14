#!/usr/bin/env bash
# ==============================================================================
# WhatyPie AWS Backup Script
# Extracts MongoDB database, WhatsApp Baileys sessions, uploads, and .env files
# ==============================================================================
set -euo pipefail

BACKUP_DATE=$(date +'%Y%m%d_%H%M%S')
BACKUP_DIR="/tmp/whatypie_backup_${BACKUP_DATE}"
OUTPUT_DIR="${OUTPUT_DIR:-/tmp}"
ARCHIVE_NAME="whatypie_aws_backup_${BACKUP_DATE}.tar.gz"
FINAL_TARBALL="${OUTPUT_DIR}/${ARCHIVE_NAME}"

# Detect base application directory (defaults to current dir or /var/www/whatypie)
APP_DIR="${APP_DIR:-$(pwd)}"
if [ ! -d "${APP_DIR}/Wapto-api" ]; then
    if [ -d "/var/www/whatypie/Wapto-api" ]; then
        APP_DIR="/var/www/whatypie"
    else
        echo "ERROR: Could not locate Wapto-api in current directory or /var/www/whatypie"
        echo "Please set APP_DIR=/path/to/project before running."
        exit 1
    fi
fi

echo "========================================================================"
echo ">>> Starting WhatyPie AWS Backup at $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo ">>> Application Directory : ${APP_DIR}"
echo ">>> Temporary Backup Staging: ${BACKUP_DIR}"
echo "========================================================================"

mkdir -p "${BACKUP_DIR}/configs"
mkdir -p "${BACKUP_DIR}/database"
mkdir -p "${BACKUP_DIR}/sessions"
mkdir -p "${BACKUP_DIR}/uploads"

# ------------------------------------------------------------------------------
# 1. Backup Environment Variables & Configuration Files
# ------------------------------------------------------------------------------
echo ">>> [1/5] Backing up environment files..."
if [ -f "${APP_DIR}/Wapto-api/.env" ]; then
    cp "${APP_DIR}/Wapto-api/.env" "${BACKUP_DIR}/configs/Wapto-api.env"
    echo "  - Backed up Wapto-api/.env"
else
    echo "  ! Wapto-api/.env not found, skipping."
fi

if [ -f "${APP_DIR}/Wapto-frontend/.env" ]; then
    cp "${APP_DIR}/Wapto-frontend/.env" "${BACKUP_DIR}/configs/Wapto-frontend.env"
    echo "  - Backed up Wapto-frontend/.env"
fi

if [ -f "${APP_DIR}/Wapto-admin/.env" ]; then
    cp "${APP_DIR}/Wapto-admin/.env" "${BACKUP_DIR}/configs/Wapto-admin.env"
    echo "  - Backed up Wapto-admin/.env"
fi

# ------------------------------------------------------------------------------
# 2. Backup MongoDB Database
# ------------------------------------------------------------------------------
echo ">>> [2/5] Dumping MongoDB database..."
# Extract MONGO_URI or MONGODB_URI from .env if available
MONGO_URI=""
if [ -f "${APP_DIR}/Wapto-api/.env" ]; then
    MONGO_URI=$(grep -E '^\s*(MONGODB_URI|MONGO_URI)=' "${APP_DIR}/Wapto-api/.env" | head -n 1 | cut -d '=' -f2- | tr -d ' "\r\47' || true)
fi

if command -v mongodump &>/dev/null; then
    if [ -n "$MONGO_URI" ]; then
        echo "  - Executing mongodump using URI from .env..."
        mongodump --uri="$MONGO_URI" --gzip --archive="${BACKUP_DIR}/database/mongodb_dump.archive.gz"
    else
        echo "  - Executing mongodump on local default (mongodb://127.0.0.1:27017)..."
        mongodump --gzip --archive="${BACKUP_DIR}/database/mongodb_dump.archive.gz"
    fi
    echo "  - MongoDB dump saved: ${BACKUP_DIR}/database/mongodb_dump.archive.gz"
else
    echo "WARNING: 'mongodump' command not found! Please install mongodb-database-tools."
    echo "Skipping database dump. You can run mongodump manually later."
fi

# ------------------------------------------------------------------------------
# 3. Backup WhatsApp Baileys Active Session Data
# ------------------------------------------------------------------------------
echo ">>> [3/5] Backing up WhatsApp Baileys credentials and session keys..."
# Check potential session paths
SESSION_DIRS=(
    "${APP_DIR}/Wapto-api/storage/sessions"
    "${APP_DIR}/Wapto-api/storage"
    "${APP_DIR}/Wapto-api/sessions"
)

FOUND_SESSIONS=false
for SDIR in "${SESSION_DIRS[@]}"; do
    if [ -d "$SDIR" ] && [ "$(ls -A "$SDIR" 2>/dev/null)" ]; then
        echo "  - Found session directory at: $SDIR"
        cp -a "$SDIR" "${BACKUP_DIR}/sessions/"
        FOUND_SESSIONS=true
        break
    fi
done

if [ "$FOUND_SESSIONS" = false ]; then
    echo "  - No local session directory detected (sessions may be empty or in DB)."
fi

# ------------------------------------------------------------------------------
# 4. Backup Local Uploads / Media Attachments
# ------------------------------------------------------------------------------
echo ">>> [4/5] Backing up uploaded media & static uploads..."
UPLOAD_DIRS=(
    "${APP_DIR}/Wapto-api/uploads"
    "${APP_DIR}/Wapto-api/public/uploads"
)

for UDIR in "${UPLOAD_DIRS[@]}"; do
    if [ -d "$UDIR" ]; then
        echo "  - Archiving uploads from: $UDIR"
        mkdir -p "${BACKUP_DIR}/uploads/$(basename "$UDIR")"
        cp -a "$UDIR/." "${BACKUP_DIR}/uploads/$(basename "$UDIR")/"
    fi
done

# Check if AWS S3 sync is needed
if [ -f "${APP_DIR}/Wapto-api/.env" ]; then
    AWS_BUCKET=$(grep -E '^\s*AWS_S3_BUCKET=' "${APP_DIR}/Wapto-api/.env" | cut -d '=' -f2- | tr -d ' "\r\47' || true)
    if [ -n "$AWS_BUCKET" ] && command -v aws &>/dev/null; then
        echo "  - Found AWS S3 Bucket reference: $AWS_BUCKET"
        echo "  - (Optional) To backup S3 bucket files to local disk, execute:"
        echo "      aws s3 sync s3://${AWS_BUCKET} /path/to/backup/s3_${AWS_BUCKET}/"
    fi
fi

# ------------------------------------------------------------------------------
# 5. Create Final Compressed Tarball
# ------------------------------------------------------------------------------
echo ">>> [5/5] Compressing complete backup archive..."
tar -czf "${FINAL_TARBALL}" -C "/tmp" "whatypie_backup_${BACKUP_DATE}"

# Calculate checksum
CHECKSUM=$(sha256sum "${FINAL_TARBALL}" | awk '{print $1}')
echo "$CHECKSUM  ${ARCHIVE_NAME}" > "${FINAL_TARBALL}.sha256"

# Cleanup staging directory
rm -rf "${BACKUP_DIR}"

echo "========================================================================"
echo ">>> Backup Completed Successfully!"
echo ">>> Archive File : ${FINAL_TARBALL}"
echo ">>> Size         : $(du -sh "${FINAL_TARBALL}" | cut -f1)"
echo ">>> SHA256       : ${CHECKSUM}"
echo "========================================================================"
echo ""
echo "Next step: Copy this archive to your GCP Compute Engine instance:"
echo "scp -i /path/to/gcp-key ${FINAL_TARBALL} username@YOUR_GCP_VM_IP:/tmp/"
echo "========================================================================"
