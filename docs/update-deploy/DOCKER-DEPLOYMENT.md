# Docker Deployment Configuration

## Overview

Docker Compose configuration cho deployment với update system support.

## Configuration

### docker-compose.yml

```yaml
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: winform-backend
    env_file:
      - .env
    ports:
      - "${PORT:-3001}:3001"
    networks:
      - winform-network
    restart: unless-stopped
    volumes:
      # Source code (hot reload)
      - ./backend/src:/app/src
      # Update system volumes
      - ./backups:/app/backups
      - ./update-temp:/app/update-temp
      - ./version.json:/app/version.json
      # Exclude node_modules
      - /app/node_modules
    environment:
      - UPDATE_CHECK_ENABLED=${UPDATE_CHECK_ENABLED:-false}
      - UPDATE_CHECK_INTERVAL=${UPDATE_CHECK_INTERVAL:-21600000}
      - GIT_RELEASE_URL=${GIT_RELEASE_URL:-}
      - DEPLOYMENT_TYPE=docker

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: winform-frontend
    environment:
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-http://localhost:3001}
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - winform-network
    restart: unless-stopped

networks:
  winform-network:
    driver: bridge
```

## Usage

### Start containers
```bash
docker-compose up -d
```

### Stop containers
```bash
docker-compose down
```

### Restart containers
```bash
docker-compose restart
```

### View logs
```bash
# All containers
docker-compose logs -f

# Specific container
docker-compose logs -f backend
```

### Rebuild and restart
```bash
docker-compose up -d --build
```

### Check status
```bash
docker-compose ps
```

## Update System Integration

Khi sử dụng Docker, update system sẽ:
1. Auto-detect Docker environment
2. Use `docker-compose restart` để restart containers
3. Preserve volumes và data

### Enable auto-update with Docker

Thêm vào `.env`:
```bash
UPDATE_CHECK_ENABLED=true
GIT_RELEASE_URL=https://github.com/user/repo
GIT_ACCESS_TOKEN=ghp_xxxxx  # For private repos
```

Restart:
```bash
docker-compose restart
```

## Volumes

### Update system volumes

- `./backups:/app/backups` - Backup storage
- `./update-temp:/app/update-temp` - Temporary update files
- `./version.json:/app/version.json` - Current version info

### Development volumes

- `./backend/src:/app/src` - Hot reload backend
- `./frontend/src:/app/src` - Hot reload frontend

## Environment Variables

### Required
- `PORT` - Backend port (default: 3001)
- `DB_HOST` - Database host
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password

### Update system
- `UPDATE_CHECK_ENABLED` - Enable auto-check (true/false)
- `UPDATE_CHECK_INTERVAL` - Check interval in ms (default: 21600000 = 6h)
- `GIT_RELEASE_URL` - Git repository URL
- `GIT_ACCESS_TOKEN` - Access token for private repos
- `DEPLOYMENT_TYPE` - Force deployment type (docker/pm2/native)

## Dockerfile

### Backend Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
```

### Frontend Dockerfile

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
```

## Troubleshooting

### Container not starting
```bash
# Check logs
docker-compose logs backend

# Check container status
docker ps -a

# Restart
docker-compose restart backend
```

### Port already in use
```bash
# Check what's using the port
lsof -i :3001

# Change port in .env
PORT=3002

# Restart
docker-compose up -d
```

### Volume permission issues
```bash
# Fix permissions
sudo chown -R $USER:$USER backups update-temp

# Restart
docker-compose restart
```

### Database connection issues
```bash
# Check database host
# If database is on host machine, use:
DB_HOST=host.docker.internal

# Restart
docker-compose restart backend
```

## Best Practices

1. **Use `.env` file** for configuration
2. **Always use named volumes** for persistent data
3. **Use `docker-compose restart`** instead of `down/up` to preserve data
4. **Monitor logs** regularly: `docker-compose logs -f`
5. **Backup volumes** before major updates
6. **Use health checks** in docker-compose.yml
7. **Keep images updated**: `docker-compose pull && docker-compose up -d`

## Production Deployment

### 1. Prepare environment
```bash
# Copy and configure .env
cp .env.example .env
nano .env
```

### 2. Build and start
```bash
docker-compose up -d --build
```

### 3. Check health
```bash
curl http://localhost:3001/health
```

### 4. Enable auto-update
```bash
# Add to .env
UPDATE_CHECK_ENABLED=true
GIT_RELEASE_URL=https://github.com/user/repo

# Restart
docker-compose restart
```

## See Also

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Update System Documentation](./UPDATE-SYSTEM.md)
- [Deployment Guide](./UPDATE-SYSTEM.md#deployment-types)
