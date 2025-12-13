# Docker Environment Configuration

## Container Naming and Isolation

All Docker containers are explicitly named and grouped by environment to prevent conflicts:

### Environment Prefixes

| Environment | Project Name | Container Prefix | Network Name |
|-------------|--------------|------------------|--------------|
| **Development** | `singalong-dev` | `singalong-dev-*` | `singalong-dev-network` |
| **Test** | `singalong-test` | `singalong-test-*` | `singalong-test-network` |
| **Production** | `singalong-prod` | `singalong-prod-*` | `singalong-prod-network` |

### Port Allocations

To run multiple environments simultaneously, each uses different host ports:

| Service | Development | Test | Production |
|---------|-------------|------|------------|
| **Server** | 3000 | 3100 | 3000 |
| **MongoDB** | 27017 | 27018 | 27017 |
| **MinIO API** | 9000 | 9002 | 9000 |
| **MinIO Console** | 9001 | 9003 | 9001 |
| **Admin App** | 3001 | - | 3001 |
| **Controller App** | 3002 | - | 3002 |
| **Player App** | 3003 | - | 3003 |

## Data Storage Strategy

### Development & Test: Docker Volumes

Named volumes managed by Docker - automatic, isolated, no host path configuration needed.

**Development volumes:**
- `singalong-dev_mongodb-dev-data`
- `singalong-dev_minio-dev-data`

**Test volumes:**
- `singalong-test_mongodb-test-data`
- `singalong-test_minio-test-data`

**Commands:**
```bash
# List all singalong volumes
docker volume ls | grep singalong

# Remove test volumes (clean slate)
docker volume rm singalong-test_mongodb-test-data singalong-test_minio-test-data

# Remove dev volumes
docker volume rm singalong-dev_mongodb-dev-data singalong-dev_minio-dev-data

# Remove all unused volumes
docker volume prune
```

### Production: Host Paths

Configured paths on the host system for easier backups and direct access.

**Default paths (configurable in .env.production):**
- MongoDB: `/var/lib/singalong/mongodb`
- MinIO: `/var/lib/singalong/minio`

**Setup:**
```bash
# Create production directories
sudo mkdir -p /var/lib/singalong/mongodb
sudo mkdir -p /var/lib/singalong/minio

# Set correct permissions
sudo chown -R 999:999 /var/lib/singalong/mongodb  # MongoDB UID
sudo chown -R 1000:1000 /var/lib/singalong/minio  # MinIO UID

# Verify
ls -la /var/lib/singalong/
```

## Running Multiple Environments Simultaneously

You can run dev and test environments at the same time:

```bash
# Start development environment
docker-compose up -d

# Start test environment (different ports)
docker-compose -f docker-compose.test.yml up -d

# Check all running containers
docker ps | grep singalong
```

Output:
```
singalong-dev-mongodb    (port 27017)
singalong-dev-minio      (ports 9000-9001)
singalong-test-mongodb   (port 27018)
singalong-test-minio     (ports 9002-9003)
```

## Managing Containers

### Start/Stop Specific Environment

```bash
# Development
docker-compose up -d                    # Start all dev services
docker-compose up mongodb minio -d      # Start only infrastructure
docker-compose stop                     # Stop dev services
docker-compose down                     # Stop and remove dev containers
docker-compose down -v                  # Also remove volumes

# Test
docker-compose -f docker-compose.test.yml up -d
docker-compose -f docker-compose.test.yml down -v

# Production
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml down
```

### View Logs

```bash
# Development logs
docker-compose logs -f server
docker-compose logs mongodb

# Test logs
docker-compose -f docker-compose.test.yml logs -f mongodb

# Specific container by name
docker logs singalong-dev-mongodb
docker logs singalong-test-server
```

### Inspect Container

```bash
# View container details
docker inspect singalong-dev-mongodb
docker inspect singalong-test-minio

# Check health status
docker ps --format "table {{.Names}}\t{{.Status}}" | grep singalong
```

### Execute Commands in Container

```bash
# MongoDB shell (dev)
docker exec -it singalong-dev-mongodb mongosh -u admin -p admin

# MongoDB shell (test)
docker exec -it singalong-test-mongodb mongosh -u admin -p admin

# MinIO client (dev)
docker exec -it singalong-dev-minio mc alias set local http://localhost:9000 minioadmin minioadmin
```

## Clean Up

### Remove Specific Environment

```bash
# Remove dev environment completely
docker-compose down -v
docker volume rm singalong-dev_mongodb-dev-data singalong-dev_minio-dev-data

# Remove test environment completely
docker-compose -f docker-compose.test.yml down -v
docker volume rm singalong-test_mongodb-test-data singalong-test_minio-test-data
```

### Remove All Singalong Containers

```bash
# Stop and remove all containers
docker stop $(docker ps -a | grep singalong | awk '{print $1}')
docker rm $(docker ps -a | grep singalong | awk '{print $1}')

# Remove all volumes
docker volume rm $(docker volume ls | grep singalong | awk '{print $2}')

# Remove all networks
docker network rm $(docker network ls | grep singalong | awk '{print $1}')
```

### Nuclear Option (Clean Everything)

```bash
# WARNING: This removes ALL Docker resources
docker system prune -a --volumes
```

## Troubleshooting

### Port Already in Use

```bash
# Find what's using the port
lsof -i :27017
lsof -i :9000

# Kill the process
kill -9 <PID>

# Or stop the conflicting container
docker stop singalong-dev-mongodb
```

### Container Won't Start

```bash
# Check logs
docker logs singalong-dev-mongodb

# Inspect container
docker inspect singalong-dev-mongodb

# Remove and recreate
docker-compose down
docker-compose up -d
```

### Volume Permissions Issues

```bash
# Fix MongoDB volume permissions
docker run --rm -v singalong-dev_mongodb-dev-data:/data alpine chown -R 999:999 /data

# Fix MinIO volume permissions
docker run --rm -v singalong-dev_minio-dev-data:/data alpine chown -R 1000:1000 /data
```

### Network Issues

```bash
# Recreate network
docker-compose down
docker network rm singalong-dev_singalong-dev-network
docker-compose up -d
```

## Best Practices

1. **Use named containers** - Makes management easier
2. **Different ports for each environment** - Run multiple environments simultaneously
3. **Docker volumes for dev/test** - Automatic management, no permissions issues
4. **Host paths for production** - Easier backups, data persistence
5. **Clean up test data regularly** - Prevent disk space issues
6. **Use docker-compose down -v** - Complete cleanup including volumes
7. **Check container health** - Use `docker ps` to verify status

## Environment-Specific Notes

### Development
- Use Docker volumes for convenience
- Can be stopped/started frequently
- Data persistence between restarts
- Port 27017 (standard MongoDB port)

### Test
- Uses separate volumes and ports
- Cleaned up automatically by test script
- Isolated from dev data
- Port 27018 (non-standard to avoid conflicts)

### Production
- Uses host paths (configure BEFORE deploying)
- Requires proper permissions setup
- Add monitoring and alerts
- Set up regular backups
- Use strong passwords (change from defaults)

## Migration Between Environments

### Export from Dev, Import to Production

```bash
# Export from dev
docker exec singalong-dev-mongodb mongodump --uri="mongodb://admin:admin@localhost:27017/singalong-dev" --out=/tmp/backup
docker cp singalong-dev-mongodb:/tmp/backup ./backup

# Import to production
docker cp ./backup singalong-prod-mongodb:/tmp/backup
docker exec singalong-prod-mongodb mongorestore --uri="mongodb://admin:PROD_PASSWORD@localhost:27017/singalong" /tmp/backup/singalong-dev
```

### Copy MinIO Data

```bash
# Using mc (MinIO Client)
mc mirror dev/ prod/ --overwrite
```

---

**Remember:** Always use container names (e.g., `singalong-dev-mongodb`) instead of IDs for better clarity and script reliability.
