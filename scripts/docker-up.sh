#!/bin/bash
set -e

# Default configuration
COMPOSE_FILE="docker-compose.yml"
SERVICE_NAME="task-copilot"

# Check if docker compose is available
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed or not in PATH"
    exit 1
fi

# Use docker compose (v2) or docker-compose (v1)
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo "Error: Neither 'docker compose' nor 'docker-compose' is available"
    exit 1
fi

echo "🚀 Starting Task Copilot with Docker Compose..."
echo "Using: $DOCKER_COMPOSE"

# Load .env file if it exists
if [ -f .env ]; then
    echo "📝 Loading environment variables from .env"
    export $(grep -v '^#' .env | xargs)
fi

# Pull latest images (optional, comment out if building locally)
# $DOCKER_COMPOSE -f $COMPOSE_FILE pull

# Build and start services
echo "🔨 Building and starting services..."
$DOCKER_COMPOSE -f $COMPOSE_FILE up -d --build

# Wait for service to be healthy
echo "⏳ Waiting for service to be healthy..."
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if $DOCKER_COMPOSE -f $COMPOSE_FILE ps | grep -q "healthy"; then
        echo "✅ Service is healthy!"
        break
    fi
    ATTEMPT=$((ATTEMPT + 1))
    echo "  Attempt $ATTEMPT/$MAX_ATTEMPTS..."
    sleep 2
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo "⚠️  Service did not become healthy in time, but may still be starting..."
fi

# Show status
echo ""
echo "📊 Service Status:"
$DOCKER_COMPOSE -f $COMPOSE_FILE ps

# Show logs
echo ""
echo "📋 Recent Logs:"
$DOCKER_COMPOSE -f $COMPOSE_FILE logs --tail=20 $SERVICE_NAME

echo ""
echo "✅ Task Copilot is running!"
echo "🌐 Access the application at: http://localhost:${PORT:-3000}"
echo ""
echo "📝 Useful commands:"
echo "  View logs:    $DOCKER_COMPOSE -f $COMPOSE_FILE logs -f"
echo "  Stop service: $DOCKER_COMPOSE -f $COMPOSE_FILE down"
echo "  Restart:      $DOCKER_COMPOSE -f $COMPOSE_FILE restart"
