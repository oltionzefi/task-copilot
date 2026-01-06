#!/bin/bash

# Local Sentry Setup Script
# This script helps set up and manage the local Sentry instance for development

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

print_header() {
    echo -e "\n${BLUE}===================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    print_success "Docker found"
    
    if ! command_exists docker compose 2>/dev/null && ! command_exists docker-compose; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    print_success "Docker Compose found"
}

# Start Sentry services
start_sentry() {
    print_header "Starting Local Sentry Services"
    
    echo "Starting containers..."
    docker compose -f docker-compose.dev.yml up -d
    
    print_success "Sentry services started!"
    echo ""
    echo "Waiting for Sentry to be ready (this may take a minute)..."
    sleep 10
    
    # Check if Sentry is responding
    for i in {1..30}; do
        if curl -s http://localhost:9000 > /dev/null 2>&1; then
            print_success "Sentry is ready!"
            break
        fi
        echo -n "."
        sleep 2
    done
    echo ""
}

# Stop Sentry services
stop_sentry() {
    print_header "Stopping Local Sentry Services"
    docker compose -f docker-compose.dev.yml down
    print_success "Sentry services stopped!"
}

# Show Sentry logs
show_logs() {
    print_header "Sentry Logs"
    docker compose -f docker-compose.dev.yml logs -f
}

# Show status
show_status() {
    print_header "Sentry Services Status"
    docker compose -f docker-compose.dev.yml ps
}

# Reset everything
reset_sentry() {
    print_header "Resetting Local Sentry"
    print_warning "This will delete ALL Sentry data including projects, issues, and events!"
    echo -n "Are you sure? (yes/no): "
    read -r confirmation
    
    if [ "$confirmation" != "yes" ]; then
        echo "Reset cancelled."
        exit 0
    fi
    
    echo "Stopping and removing containers and volumes..."
    docker compose -f docker-compose.dev.yml down -v
    print_success "Sentry reset complete!"
}

# Show help
show_help() {
    print_header "Local Sentry Management Script"
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start     Start the local Sentry services"
    echo "  stop      Stop the local Sentry services"
    echo "  restart   Restart the local Sentry services"
    echo "  logs      Show Sentry logs (follow mode)"
    echo "  status    Show status of Sentry services"
    echo "  reset     Reset Sentry (removes all data)"
    echo "  help      Show this help message"
    echo ""
    echo "After starting Sentry:"
    echo "  1. Open http://localhost:9000 in your browser"
    echo "  2. Login with admin@vibekanban.local / admin"
    echo "  3. Create a project and copy the DSN"
    echo "  4. Set SENTRY_DSN and VITE_SENTRY_DSN in your .env file"
    echo ""
}

# Main command handler
case "${1:-}" in
    start)
        check_prerequisites
        start_sentry
        echo ""
        echo -e "${GREEN}🎉 Sentry is running!${NC}"
        echo ""
        echo "Next steps:"
        echo "1. Open http://localhost:9000 in your browser"
        echo "2. Login with: admin@vibekanban.local / admin"
        echo "3. Create a project and copy the DSN"
        echo "4. Add to .env file:"
        echo "   SENTRY_DSN=http://YOUR_KEY@localhost:9000/PROJECT_ID"
        echo "   VITE_SENTRY_DSN=http://YOUR_KEY@localhost:9000/PROJECT_ID"
        echo ""
        echo "View logs: $0 logs"
        echo "Stop Sentry: $0 stop"
        ;;
    stop)
        stop_sentry
        ;;
    restart)
        stop_sentry
        sleep 2
        start_sentry
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    reset)
        reset_sentry
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: ${1:-}"
        echo ""
        show_help
        exit 1
        ;;
esac
