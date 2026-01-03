#!/bin/bash

# Sentry Setup Automation Script
# This script automates the initial Sentry setup and configuration

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_header "Sentry Frontend Setup Wizard"

echo "This wizard will help you set up Sentry for frontend error tracking."
echo ""

# Step 1: Check if Sentry is running
print_info "Step 1: Checking if Sentry is running..."
if curl -s http://localhost:9000 > /dev/null 2>&1; then
    print_success "Sentry is running on http://localhost:9000"
else
    print_warning "Sentry is not running"
    echo ""
    echo "Would you like to start Sentry now? (y/n)"
    read -r start_sentry
    if [ "$start_sentry" = "y" ]; then
        print_info "Starting Sentry..."
        pnpm run sentry:start
        print_success "Sentry started successfully!"
    else
        print_error "Cannot continue without Sentry running"
        echo ""
        echo "Please run: pnpm run sentry:start"
        echo "Then run this script again."
        exit 1
    fi
fi

echo ""
print_info "Step 2: Configure Sentry DSN"
echo ""
echo "Please follow these steps to get your Sentry DSN:"
echo ""
echo "1. Open http://localhost:9000 in your browser"
echo "2. Login with: admin@vibekanban.local / admin"
echo "3. Create a new project:"
echo "   - Click 'Projects' → 'Create Project'"
echo "   - Select platform: 'JavaScript'"
echo "   - Enter project name: 'vibe-kanban-frontend'"
echo "   - Click 'Create Project'"
echo "4. Copy the DSN from the setup page"
echo "   - It looks like: http://abc123def456@localhost:9000/1"
echo ""
echo "Opening Sentry UI in your browser..."
sleep 2

# Try to open the browser (works on macOS, Linux with xdg-open, WSL)
if command -v open > /dev/null 2>&1; then
    open http://localhost:9000
elif command -v xdg-open > /dev/null 2>&1; then
    xdg-open http://localhost:9000
else
    print_info "Please manually open: http://localhost:9000"
fi

echo ""
echo "Press Enter when you have copied the DSN..."
read -r

echo ""
echo "Please paste your Sentry DSN:"
read -r sentry_dsn

if [ -z "$sentry_dsn" ]; then
    print_error "No DSN provided"
    exit 1
fi

# Validate DSN format (basic check)
if [[ ! "$sentry_dsn" =~ ^http.*@.*:[0-9]+/[0-9]+$ ]]; then
    print_warning "DSN format looks unusual. Expected format: http://KEY@localhost:9000/PROJECT_ID"
    echo "Do you want to continue anyway? (y/n)"
    read -r continue_anyway
    if [ "$continue_anyway" != "y" ]; then
        print_error "Setup cancelled"
        exit 1
    fi
fi

print_info "Step 3: Updating .env file..."

# Check if .env exists
if [ -f .env ]; then
    # Create backup
    cp .env .env.backup
    print_info "Created backup: .env.backup"
    
    # Update VITE_SENTRY_DSN
    if grep -q "^VITE_SENTRY_DSN=" .env; then
        # Update existing line
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|^VITE_SENTRY_DSN=.*|VITE_SENTRY_DSN=$sentry_dsn|" .env
        else
            # Linux
            sed -i "s|^VITE_SENTRY_DSN=.*|VITE_SENTRY_DSN=$sentry_dsn|" .env
        fi
    else
        # Add new line
        echo "VITE_SENTRY_DSN=$sentry_dsn" >> .env
    fi
    
    print_success "Updated .env file"
else
    print_warning ".env file not found"
    echo "Creating new .env file..."
    cat > .env << EOF
# Local Development Environment Variables
BACKEND_PORT=8080
HOST=127.0.0.1

# Frontend Sentry DSN
VITE_SENTRY_DSN=$sentry_dsn

# Backend Sentry DSN (optional)
SENTRY_DSN=$sentry_dsn
EOF
    print_success "Created .env file"
fi

echo ""
print_success "Configuration complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo ""
echo "1. Start the development server:"
echo "   ${GREEN}pnpm run dev${NC}"
echo ""
echo "2. Test Sentry integration:"
echo "   - Open http://localhost:3000/sentry-test in your browser"
echo "   - Or use the browser console:"
echo "     ${BLUE}Sentry.captureMessage('Test message');${NC}"
echo ""
echo "3. Check Sentry UI for captured events:"
echo "   ${BLUE}http://localhost:9000${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_info "For detailed documentation, see: docs/SENTRY_FRONTEND_SETUP.md"
echo ""
