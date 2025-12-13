# Environment Setup Guide

This document describes the three environments configured for the Singalong server.

## Quick Start

```bash
# Development (default)
pnpm --filter server run dev

# Test environment
pnpm --filter server run dev:test

# Production mode (local)
pnpm --filter server run dev:prod
```

## Docker Container Naming

All containers are prefixed to avoid conflicts between environments:

| Environment | Project Name | Container Prefix | Example |
|-------------|--------------|------------------|---------|
| **Development** | `singalong-dev` | `singalong-dev-*` | `singalong-dev-mongodb` |
| **Test** | `singalong-test` | `singalong-test-*` | `singalong-test-mongodb` |
| **Production** | `singalong-prod` | `singalong-prod-*` | `singalong-prod-mongodb` |

This allows you to run multiple environments simultaneously without conflicts.

**View containers:**
```bash
# List all singalong containers
docker ps -a | grep singalong

# List only dev containers
docker ps | grep singalong-dev

# List only test containers
docker ps | grep singalong-test
```

## Data Storage Strategy

### Development & Test: Docker Volumes
- **Pros:** Automatic management, no host path configuration needed
- **Volumes:**
  - Dev: `mongodb-dev-data`, `minio-dev-data`
  - Test: `mongodb-test-data`, `minio-test-data`

```bash
# View volumes
docker volume ls | grep singalong

# Clean up test volumes
docker volume rm singalong-test_mongodb-test-data
docker volume rm singalong-test_minio-test-data
```

### Production: Host Paths
- **Pros:** Direct access to data, easier backups, persist outside Docker
- **Paths (configurable in .env.production):**
  - MongoDB: `/var/lib/singalong/mongodb`
  - MinIO: `/var/lib/singalong/minio`

**Setup production paths:**
```bash
sudo mkdir -p /var/lib/singalong/mongodb
sudo mkdir -p /var/lib/singalong/minio
sudo chown -R 999:999 /var/lib/singalong/mongodb  # MongoDB user
sudo chown -R 1000:1000 /var/lib/singalong/minio  # MinIO user
```

## Environments

### 1. Test Environment (`NODE_ENV=test`)

**Purpose:** For running integration tests without worrying about data persistence.

**Configuration File:** `.env.test`

**Key Settings:**
- Database: `singalong-test` (separate test database)
- MinIO Bucket: `singalong-test`
- Data Path: `./data/mongodb-test`
- Uses mock API keys for external services

**Usage:**
```bash
# Start services with test configuration
docker-compose -f docker-compose.test.yml up -d

# Run server in test mode
pnpm --filter server run dev:test

# Run integration tests
pnpm --filter server run test:integration
```

**Docker Compose:**  
Use `docker-compose.test.yml` for isolated test environment with separate volumes.

---

### 2. Development Environment (`NODE_ENV=development`)

**Purpose:** For active development and building new features.

**Configuration File:** `.env.development`

**Key Settings:**
- Database: `singalong-dev`
- MinIO Bucket: `singalong-dev`
- Data Path: `./data/mongodb`
- Requires real API keys (or leave empty for limited functionality)

**Usage:**
```bash
# Start MongoDB and MinIO only
docker-compose up mongodb minio -d

# Run server locally
pnpm --filter server run dev

# Or run everything in Docker
docker-compose up
```

**Docker Compose:**  
Use the main `docker-compose.yml` file.

---

### 3. Production Environment (`NODE_ENV=production`)

**Purpose:** For deploying stable, tagged releases.

**Configuration File:** `.env.production`

**Key Settings:**
- Database: `singalong` (production database)
- MinIO Bucket: `singalong`
- **IMPORTANT:** Uses `CHANGE_ME` placeholders - must update before deploying
- Data paths: Absolute paths for production volumes

**Usage:**
```bash
# Build production image
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f server
```

**Security Checklist:**
- [ ] Change `MONGO_ROOT_PASSWORD`
- [ ] Change `DEFAULT_ADMIN_PASSWORD`
- [ ] Change `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY`
- [ ] Add real API keys for `MEDIA_PROVIDER_API_KEY` and `OPENAI_API_KEY`
- [ ] Use HTTPS in production (configure reverse proxy)
- [ ] Set up regular MongoDB backups (see commented backup service in `docker-compose.prod.yml`)

**Docker Compose:**  
Use `docker-compose.prod.yml` with production-hardened settings.

---

## Environment Variables Reference

| Variable | Test | Development | Production | Description |
|----------|------|-------------|------------|-------------|
| `NODE_ENV` | `test` | `development` | `production` | Environment mode |
| `MONGODB_URI` | Uses test DB | Uses dev DB | Uses prod DB | MongoDB connection string |
| `MINIO_BUCKET_NAME` | `singalong-test` | `singalong-dev` | `singalong` | MinIO bucket name |
| `DEFAULT_ADMIN_PASSWORD` | `P@ssw0rd!` | `P@ssw0rd!` | **CHANGE_ME** | Default admin password |
| `MEDIA_PROVIDER_API_KEY` | `test-key` | (your key) | (your key) | YouTube/provider API key |
| `OPENAI_API_KEY` | `test-key` | (your key) | (your key) | OpenAI API key |

## Runtime Tests

Run automated tests to verify the server is working:

```bash
# Start the server first
pnpm --filter server run dev

# In another terminal, run tests
./scripts/test-runtime.sh
```

This tests:
- ✓ Health check endpoint
- ✓ API documentation (Swagger UI)
- ✓ Admin login functionality
- ✓ WebSocket availability

## Integration Tests

Full integration test suite that starts a server, runs tests, and cleans up:

```bash
# Ensure test database is running
docker-compose -f docker-compose.test.yml up mongodb minio -d

# Run integration tests
pnpm --filter server run test:integration
```

## Package Manager

**⚠️ CRITICAL: Always use `pnpm`, never use `npm` or `yarn`**

This is a monorepo managed with pnpm workspaces:
- ✅ `pnpm install` - Install dependencies
- ✅ `pnpm --filter server run dev` - Run server workspace
- ✅ `pnpm run build --workspaces` - Build all workspaces
- ❌ Never use `npm` or `yarn` commands

## Switching Environments

To switch between environments, simply use the appropriate script:

```bash
# Development
pnpm --filter server run dev

# Test
pnpm --filter server run dev:test  

# Production (local testing)
pnpm --filter server run dev:prod
```

The server will automatically load the correct `.env.[environment]` file.

## Troubleshooting

### "Cannot connect to MongoDB"
- Ensure MongoDB is running: `docker ps | grep mongodb`
- Check the `MONGODB_URI` in your `.env.[environment]` file
- Verify credentials match docker-compose configuration

### "Cannot connect to MinIO"
- Ensure MinIO is running: `docker ps | grep minio`
- Check `MINIO_ENDPOINT` and credentials in `.env.[environment]`
- MinIO console: http://localhost:9001

### "Port 3000 already in use"
```bash
# Find and kill the process
lsof -i :3000
kill <PID>
```

### Environment file not loading
- Ensure you're running from the correct directory
- Server looks for `.env.[environment]` in project root
- Check console output: `📄 Config loaded from: ...`

## Next Steps

1. **For Development:**
   - Copy `.env.example` to `.env.development`
   - Add your API keys
   - Start developing!

2. **For Testing:**
   - Use `.env.test` as-is
   - Run `pnpm --filter server run test:integration`

3. **For Production:**
   - Copy `.env.production` to `.env.production.local`
   - Replace all `CHANGE_ME` values
   - Never commit production credentials to git
   - Use secrets management in production (e.g., Docker secrets, Kubernetes secrets)
