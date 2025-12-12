#!/bin/bash

# Singalong Development Helper Script
# Usage: ./scripts/dev.sh [command]

set -e

COLOR_BLUE='\033[0;34m'
COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
NC='\033[0m' # No Color

# Functions
log_info() {
  echo -e "${COLOR_BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${COLOR_GREEN}✓ $1${NC}"
}

log_warning() {
  echo -e "${COLOR_YELLOW}⚠️  $1${NC}"
}

log_error() {
  echo -e "${COLOR_RED}✗ $1${NC}"
}

# Check if Node.js is installed
check_node() {
  if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
  fi
  
  NODE_VERSION=$(node -v)
  log_success "Node.js $NODE_VERSION found"
}

# Check if Docker is installed
check_docker() {
  if ! command -v docker &> /dev/null; then
    log_warning "Docker is not installed. Some services may not work."
    return 1
  fi
  
  log_success "Docker found"
  return 0
}

# Install dependencies
install() {
  log_info "Installing dependencies for all workspaces..."
  npm install
  log_success "Dependencies installed"
}

# Start with Docker Compose
start_docker() {
  log_info "Starting all services with Docker Compose..."
  
  if ! check_docker; then
    log_error "Docker is required for this command"
    exit 1
  fi
  
  docker-compose up
}

# Stop Docker Compose
stop_docker() {
  log_info "Stopping Docker services..."
  docker-compose down
  log_success "Services stopped"
}

# Start services individually
start_local() {
  log_info "Starting local services (requires MongoDB and MinIO)..."
  
  # Start server
  log_info "Starting server..."
  cd server
  npm run dev &
  SERVER_PID=$!
  cd ..
  
  sleep 2
  
  # Start admin app
  log_info "Starting admin app..."
  cd admin-app
  npm run web &
  ADMIN_PID=$!
  cd ..
  
  sleep 2
  
  # Start controller app
  log_info "Starting controller app..."
  cd controller-app
  npm run web &
  CONTROLLER_PID=$!
  cd ..
  
  sleep 2
  
  # Start player app
  log_info "Starting player app..."
  cd player-app
  npm run web &
  PLAYER_PID=$!
  cd ..
  
  log_success "All services started:"
  echo "  Server: http://localhost:3000"
  echo "  Admin: http://localhost:3001"
  echo "  Controller: http://localhost:3002"
  echo "  Player: http://localhost:3003"
  echo ""
  log_info "Press Ctrl+C to stop all services"
  
  # Wait for signals
  trap "kill $SERVER_PID $ADMIN_PID $CONTROLLER_PID $PLAYER_PID 2>/dev/null" EXIT
  wait
}

# Build all workspaces
build() {
  log_info "Building all workspaces..."
  npm run build:all
  log_success "Build complete"
}

# Lint all workspaces
lint() {
  log_info "Linting all workspaces..."
  npm run lint
  log_success "Lint complete"
}

# Run tests
test() {
  log_info "Running tests..."
  npm test
}

# Setup .env file
setup_env() {
  if [ ! -f .env ]; then
    log_info "Creating .env file from .env.example..."
    cp .env.example .env
    log_success ".env file created. Please edit it with your configuration."
  else
    log_warning ".env file already exists"
  fi
}

# Show help
show_help() {
  echo "Singalong Development Helper"
  echo ""
  echo "Usage: ./scripts/dev.sh [command]"
  echo ""
  echo "Commands:"
  echo "  install       Install dependencies for all workspaces"
  echo "  docker        Start all services with Docker Compose"
  echo "  docker:stop   Stop Docker services"
  echo "  local         Start services locally (requires MongoDB and MinIO)"
  echo "  build         Build all workspaces"
  echo "  lint          Lint all workspaces"
  echo "  test          Run tests"
  echo "  env           Setup .env file"
  echo "  help          Show this help message"
  echo ""
  echo "Examples:"
  echo "  ./scripts/dev.sh install"
  echo "  ./scripts/dev.sh docker"
  echo "  ./scripts/dev.sh build"
}

# Main
check_node

case "${1:-help}" in
  install)
    install
    ;;
  docker)
    start_docker
    ;;
  docker:stop)
    stop_docker
    ;;
  local)
    start_local
    ;;
  build)
    build
    ;;
  lint)
    lint
    ;;
  test)
    test
    ;;
  env)
    setup_env
    ;;
  help)
    show_help
    ;;
  *)
    log_error "Unknown command: $1"
    show_help
    exit 1
    ;;
esac
