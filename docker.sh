#!/bin/bash

# docker.sh - Docker deployment script for phone-agent
# This script provides commands to build, run, and manage Docker containers for the application

# Make script exit on error
set -e

# Print colorful messages
print_info() {
  echo -e "\033[0;34m[INFO]\033[0m $1"
}

print_success() {
  echo -e "\033[0;32m[SUCCESS]\033[0m $1"
}

print_error() {
  echo -e "\033[0;31m[ERROR]\033[0m $1"
}

print_warning() {
  echo -e "\033[0;33m[WARNING]\033[0m $1"
}

# Check if Docker is installed
check_docker() {
  if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker to continue."
    exit 1
  fi

  if ! command -v docker-compose &> /dev/null; then
    print_warning "docker-compose is not installed. Some features may not work."
  fi
}

# Check if .env file exists and create it if not
check_env_file() {
  if [ ! -f .env ]; then
    if [ -f .env.example ]; then
      print_info "No .env file found, creating one from .env.example"
      cp .env.example .env
      print_warning "Please update the .env file with your actual values"
    else
      print_error "No .env.example file found. Cannot create .env file."
      exit 1
    fi
  else
    print_info "Using existing .env file"
  fi
}

# Build the Docker image
build_image() {
  print_info "Building Docker image..."
  docker build -t phone-agent:latest .
  print_success "Docker image built successfully"
}

# Start the containers using docker-compose
start_containers() {
  print_info "Starting containers with docker-compose..."
  docker-compose up -d
  print_success "Containers started successfully"
  print_info "Phone Agent is now running at http://localhost:8787"
}

# Stop the containers
stop_containers() {
  print_info "Stopping containers..."
  docker-compose down
  print_success "Containers stopped successfully"
}

# Restart the containers
restart_containers() {
  print_info "Restarting containers..."
  docker-compose restart
  print_success "Containers restarted successfully"
}

# View container logs
view_logs() {
  print_info "Viewing container logs..."
  docker-compose logs -f
}

# Check container status
check_status() {
  print_info "Checking container status..."
  docker-compose ps
}

# Run shell in the container
run_shell() {
  print_info "Opening shell in the container..."
  docker-compose exec phone-agent /bin/sh
}

# Deploy to production (example for future implementation)
deploy_production() {
  print_warning "Production deployment not yet implemented"
  print_info "This would push the image to a registry and deploy to production"
}

# Show usage information
show_usage() {
  echo "Usage: ./docker.sh [COMMAND]"
  echo ""
  echo "Commands:"
  echo "  build       Build the Docker image"
  echo "  start       Start the containers"
  echo "  stop        Stop the containers"
  echo "  restart     Restart the containers"
  echo "  logs        View container logs"
  echo "  status      Check container status"
  echo "  shell       Run shell in the container"
  echo "  deploy      Deploy to production (not implemented yet)"
  echo "  help        Show this help message"
  echo ""
  echo "Examples:"
  echo "  ./docker.sh build      # Build the Docker image"
  echo "  ./docker.sh start      # Start the containers"
  echo "  ./docker.sh logs       # View container logs"
}

# Main script execution
check_docker

# Parse command line arguments
if [ $# -eq 0 ]; then
  show_usage
  exit 0
fi

case $1 in
  build)
    check_env_file
    build_image
    ;;
  start)
    check_env_file
    start_containers
    ;;
  stop)
    stop_containers
    ;;
  restart)
    restart_containers
    ;;
  logs)
    view_logs
    ;;
  status)
    check_status
    ;;
  shell)
    run_shell
    ;;
  deploy)
    deploy_production
    ;;
  help)
    show_usage
    ;;
  *)
    print_error "Unknown command: $1"
    show_usage
    exit 1
    ;;
esac

exit 0