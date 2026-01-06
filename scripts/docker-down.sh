#!/bin/bash
set -e

# Default configuration
COMPOSE_FILE="docker-compose.yml"

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

echo "🛑 Stopping Task Copilot..."

# Parse arguments
REMOVE_VOLUMES=false
while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--volumes)
            REMOVE_VOLUMES=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [-v|--volumes]"
            echo "  -v, --volumes  Remove volumes (deletes all data)"
            exit 1
            ;;
    esac
done

# Stop services
if [ "$REMOVE_VOLUMES" = true ]; then
    echo "⚠️  Stopping services and removing volumes (all data will be deleted)..."
    $DOCKER_COMPOSE -f $COMPOSE_FILE down -v
    echo "✅ Services stopped and volumes removed"
else
    echo "Stopping services (data will be preserved)..."
    $DOCKER_COMPOSE -f $COMPOSE_FILE down
    echo "✅ Services stopped"
fi

echo ""
echo "📝 To start again, run: ./scripts/docker-up.sh"
echo "📝 To remove volumes: ./scripts/docker-down.sh --volumes"
