#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEV_ASSETS_DIR="$PROJECT_ROOT/dev_assets"
DOCKER_VOLUME_DATA="task-copilot-data"

echo "🚀 Migrating to Docker..."

# Check if dev_assets exists
if [ ! -d "$DEV_ASSETS_DIR" ]; then
    echo "❌ No dev_assets directory found"
    exit 1
fi

# Stop containers
cd "$PROJECT_ROOT"
docker compose down 2>/dev/null || true

# Build image
echo "📦 Building Docker image..."
docker compose build

# Create volume
docker volume create "$DOCKER_VOLUME_DATA" 2>/dev/null || true

# Copy data to volume
echo "📋 Copying data..."
docker run --rm \
    -v "$DOCKER_VOLUME_DATA:/data" \
    -v "$DEV_ASSETS_DIR:/source:ro" \
    alpine \
    sh -c "cp -r /source/* /data/ && chown -R 1001:1001 /data"

# Start containers
echo "🐳 Starting Docker..."
docker compose up -d

echo "✅ Migration complete! Running at http://localhost:3000"
