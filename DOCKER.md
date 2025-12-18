# Docker Setup Guide

This guide explains how to run the Mental Health Web App using Docker for both development and production environments.

## Prerequisites

- Docker Engine 20.10+ installed
- Docker Compose 2.0+ installed
- `.env.local` file with your Supabase credentials (see `.env.docker.example`)

## Quick Start

### Development Mode (with hot-reload)

```bash
# 1. Copy environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 2. Build and start the development container
docker-compose up --build

# 3. Access the app at http://localhost:3000
```

The development setup includes:
- Hot-reload support (file changes are reflected immediately)
- Volume mounts for source code
- All dev dependencies installed
- Development optimizations enabled

### Production Mode (optimized build)

```bash
# 1. Ensure your environment variables are set in .env.local

# 2. Build and start the production container
docker-compose -f docker-compose.prod.yml up --build

# 3. Access the app at http://localhost:3000
```

The production setup includes:
- Multi-stage build for minimal image size (~150MB)
- Standalone Next.js output
- Non-root user for security
- Health checks
- Production optimizations

## Docker Commands Reference

### Development Commands

```bash
# Start in detached mode (background)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down

# Rebuild after dependency changes
docker-compose up --build

# Execute commands inside container
docker-compose exec app-dev npm install <package>
docker-compose exec app-dev npm run lint
```

### Production Commands

```bash
# Build production image
docker-compose -f docker-compose.prod.yml build

# Start production container
docker-compose -f docker-compose.prod.yml up -d

# View production logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop production container
docker-compose -f docker-compose.prod.yml down

# Check container health
docker-compose -f docker-compose.prod.yml ps
```

### Direct Docker Commands (without Compose)

```bash
# Build production image directly
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=your-url \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-key \
  -t mental-health-app:latest .

# Run production container
docker run -p 3000:3000 mental-health-app:latest

# Build development image
docker build -f Dockerfile.dev -t mental-health-app:dev .

# Run development container with volume mount
docker run -p 3000:3000 \
  -v $(pwd):/app \
  -v /app/node_modules \
  --env-file .env.local \
  mental-health-app:dev
```

## Architecture Details

### Multi-Stage Production Build

The production `Dockerfile` uses a 3-stage build process:

1. **deps**: Installs production dependencies only
2. **builder**: Builds the Next.js application
3. **runner**: Minimal runtime image with only necessary files

This approach reduces the final image size from ~1GB to ~150MB.

### Key Optimizations

- **Standalone Output**: Next.js outputs a self-contained server (enabled in `next.config.ts`)
- **Layer Caching**: Dependencies are cached separately from source code
- **Alpine Linux**: Minimal base image for smaller size
- **Non-root User**: Container runs as user `nextjs` (UID 1001) for security
- **.dockerignore**: Excludes unnecessary files from build context

### Environment Variables

Build-time variables (baked into the image):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

These must be provided during build via:
- Build args in `docker build`
- Environment file in `docker-compose.prod.yml`

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process or change the port in docker-compose.yml
```

### Hot Reload Not Working in Development

Add to `.env.local`:
```
WATCHPACK_POLLING=true
```

This is already configured in `docker-compose.yml`.

### Build Fails Due to Missing Environment Variables

For production builds, ensure environment variables are set:

```bash
# Option 1: Set in shell
export NEXT_PUBLIC_SUPABASE_URL=your-url
export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-key
docker-compose -f docker-compose.prod.yml up --build

# Option 2: Create .env file for docker-compose
echo "NEXT_PUBLIC_SUPABASE_URL=your-url" > .env
echo "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-key" >> .env
docker-compose -f docker-compose.prod.yml up --build
```

### Permission Errors in Volumes

If you encounter permission errors with mounted volumes:

```bash
# Fix ownership (Linux/macOS)
docker-compose exec app-dev chown -R node:node /app/node_modules
```

### Clearing Docker Cache

```bash
# Remove all containers and volumes
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Prune unused Docker resources
docker system prune -a
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Docker Build

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: |
          docker build \
            --build-arg NEXT_PUBLIC_SUPABASE_URL=${{ secrets.SUPABASE_URL }} \
            --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${{ secrets.SUPABASE_KEY }} \
            -t mental-health-app:${{ github.sha }} .

      - name: Push to registry
        run: |
          echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
          docker push mental-health-app:${{ github.sha }}
```

## Production Deployment

### Docker Hub

```bash
# Tag image
docker tag mental-health-app:latest username/mental-health-app:latest

# Push to Docker Hub
docker push username/mental-health-app:latest
```

### Deploy to Server

```bash
# Pull on server
docker pull username/mental-health-app:latest

# Run with environment variables
docker run -d \
  -p 3000:3000 \
  --restart unless-stopped \
  --name mental-health-app \
  username/mental-health-app:latest
```

## Performance Tips

1. **Use BuildKit**: Enable Docker BuildKit for faster builds
   ```bash
   export DOCKER_BUILDKIT=1
   docker build .
   ```

2. **Layer Caching**: Keep frequently changing files (source code) in later layers

3. **Multi-stage Builds**: Already implemented to minimize image size

4. **Health Checks**: Configured in `docker-compose.prod.yml` for monitoring

## Security Best Practices

- Non-root user in production container
- No secrets in Dockerfile or images
- Minimal base image (Alpine)
- Regular security updates: `docker pull node:22-alpine`
- Health checks to detect container issues

## Next Steps

- Set up container orchestration (Kubernetes, Docker Swarm)
- Implement logging and monitoring (Prometheus, Grafana)
- Configure reverse proxy (Nginx, Traefik)
- Set up automated backups for volumes
- Implement CI/CD pipeline
