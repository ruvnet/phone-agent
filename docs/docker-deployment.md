# Docker Deployment Guide

This guide explains how to deploy the Phone Agent application using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose installed on your system
- Git repository cloned locally

## Quick Start

The easiest way to deploy the application is using the provided `docker.sh` script:

```bash
# Make the script executable (if not already)
chmod +x docker.sh

# Build the Docker image
./docker.sh build

# Start the containers
./docker.sh start
```

The application will be available at http://localhost:8787

## Environment Variables

Before deploying, make sure you have a `.env` file with the necessary environment variables. You can create one from the `.env.example` file:

```bash
cp .env.example .env
```

Then edit the `.env` file to add your actual values.

## Available Commands

The `docker.sh` script provides several commands to manage the Docker deployment:

- `./docker.sh build` - Build the Docker image
- `./docker.sh start` - Start the containers
- `./docker.sh stop` - Stop the containers
- `./docker.sh restart` - Restart the containers
- `./docker.sh logs` - View container logs
- `./docker.sh status` - Check container status
- `./docker.sh shell` - Run shell in the container
- `./docker.sh help` - Show help message

## Manual Deployment

If you prefer not to use the script, you can use Docker Compose directly:

```bash
# Build and start the containers
docker-compose up -d

# Stop the containers
docker-compose down

# View logs
docker-compose logs -f
```

## Docker Configuration

The Docker deployment consists of the following files:

- `Dockerfile` - Defines how to build the application image
- `docker-compose.yml` - Defines the services and their configuration
- `.dockerignore` - Specifies files to exclude from the Docker build context
- `docker.sh` - Script to manage the Docker deployment

## Customization

### Changing the Port

If you want to use a different port, edit the `docker-compose.yml` file and change the port mapping:

```yaml
ports:
  - "8080:8787"  # Map port 8080 on the host to 8787 in the container
```

### Persistent Storage

The Docker Compose configuration includes a volume mount for the `public` directory to allow for easy updates to static content without rebuilding the image.

## Troubleshooting

### Container Not Starting

Check the logs for errors:

```bash
./docker.sh logs
```

### Environment Variables Not Working

Make sure your `.env` file is properly formatted and contains all required variables.

### Port Conflicts

If port 8787 is already in use, change the port mapping in `docker-compose.yml`.

## Production Deployment

For production deployment, consider the following:

1. Use a container registry to store your Docker images
2. Set up CI/CD pipelines to automate the build and deployment process
3. Use Docker Swarm or Kubernetes for orchestration
4. Implement proper monitoring and logging
5. Set up HTTPS with a reverse proxy like Nginx or Traefik