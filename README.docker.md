# Docker Deployment Guide

This guide explains how to build and run the CENUSIS-Ops application using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

## Quick Start

### 1. Build and Run All Services

```bash
# From the project root directory
docker-compose up -d
```

This will:
- Start PostgreSQL database on port 5432
- Build and start the Express backend on port 3000
- Build and start the React frontend with nginx on port 80

### 2. Access the Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000
- **PostgreSQL**: localhost:5432

### 3. Initialize the Database

After the containers are running, you need to create the database schema:

```bash
# Run the database creation script
docker-compose exec backend node ./dist/cli/create.js

# Create an admin user
docker-compose exec backend node ./dist/cli/admin.js
```

## Individual Service Commands

### Build Services

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend
```

### Start/Stop Services

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d postgres
docker-compose up -d backend
docker-compose up -d frontend

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: This deletes all data)
docker-compose down -v
```

### View Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Execute Commands in Containers

```bash
# Access backend container shell
docker-compose exec backend sh

# Access PostgreSQL
docker-compose exec postgres psql -U dev -d cenusis_ops

# Run backend commands
docker-compose exec backend node ./dist/cli/create.js
docker-compose exec backend node ./dist/cli/admin.js
```

## Environment Variables

Create a `.env` file in the project root to customize settings:

```env
# JWT Secret (IMPORTANT: Change this in production!)
JWT_SECRET=your-very-secure-secret-key-here

# Database credentials (optional, defaults are in docker-compose.yml)
DB_HOST=postgres
DB_PORT=5432
DB_NAME=cenusis_ops
DB_USER=dev
DB_PASSWORD=12345678
```

## Production Deployment

### Security Considerations

1. **Change default passwords**: Update PostgreSQL and JWT secrets
2. **Use HTTPS**: Set up SSL/TLS certificates with nginx
3. **Environment variables**: Use Docker secrets or external secret management
4. **Database backups**: Set up regular PostgreSQL backups

### Building Production Images

```bash
# Build with no cache for clean production build
docker-compose build --no-cache

# Tag images for registry
docker tag cenusis-backend:latest your-registry/cenusis-backend:v1.0.0
docker tag cenusis-frontend:latest your-registry/cenusis-frontend:v1.0.0

# Push to registry
docker push your-registry/cenusis-backend:v1.0.0
docker push your-registry/cenusis-frontend:v1.0.0
```

### Save Images for Distribution

```bash
# Save backend image
docker save -o cenusis-backend.tar cenusis-backend:latest

# Save frontend image
docker save -o cenusis-frontend.tar cenusis-frontend:latest

# Save all images in one archive
docker save -o cenusis-all-images.tar cenusis-backend:latest cenusis-frontend:latest postgres:16-alpine

# Load images on another machine
docker load -i cenusis-all-images.tar
```

## Troubleshooting

### Backend can't connect to database

```bash
# Check if PostgreSQL is healthy
docker-compose ps

# Check PostgreSQL logs
docker-compose logs postgres

# Restart services
docker-compose restart backend
```

### Frontend can't reach backend

```bash
# Check nginx configuration
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf

# Check backend is running
docker-compose ps backend

# Test backend directly
curl http://localhost:3000/api/public
```

### Database initialization fails

```bash
# Check if database exists
docker-compose exec postgres psql -U dev -l

# Manually create database
docker-compose exec postgres psql -U dev -c "CREATE DATABASE cenusis_ops;"

# Run creation script again
docker-compose exec backend node ./dist/cli/create.js
```

### Port conflicts

If ports 80, 3000, or 5432 are already in use, modify `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "8080:80"  # Change host port to 8080
  backend:
    ports:
      - "3001:3000"  # Change host port to 3001
  postgres:
    ports:
      - "5433:5432"  # Change host port to 5433
```

## Development with Docker

For development, you can use volume mounts to enable hot-reload:

```yaml
# Add to backend service in docker-compose.yml
volumes:
  - ./backend:/app
  - /app/node_modules
command: npm run dev
```

## Maintenance

### Update Dependencies

```bash
# Rebuild images after updating package.json
docker-compose build --no-cache

# Restart services
docker-compose up -d
```

### Database Backup

```bash
# Backup database
docker-compose exec postgres pg_dump -U dev cenusis_ops > backup.sql

# Restore database
docker-compose exec -T postgres psql -U dev cenusis_ops < backup.sql
```

### Clean Up

```bash
# Remove stopped containers
docker-compose rm

# Remove unused images
docker image prune

# Remove all unused Docker resources
docker system prune -a
```

## Architecture

```
┌─────────────────┐
│   User Browser  │
└────────┬────────┘
         │ HTTP :80
         ▼
┌─────────────────┐
│  Nginx (Frontend)│
│  React App      │
└────────┬────────┘
         │ /api/* → :3000
         ▼
┌─────────────────┐
│  Express Backend│
│  Node.js        │
└────────┬────────┘
         │ :5432
         ▼
┌─────────────────┐
│   PostgreSQL    │
│   Database      │
└─────────────────┘
```
