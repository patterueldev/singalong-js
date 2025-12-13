# Testing Guide

Quick reference for running tests in the Singalong project.

## Quick Test (Runtime Only)

Fast test of the running server:

```bash
# Start server first
pnpm --filter server run dev

# In another terminal
./scripts/test-runtime.sh
```

Tests basic endpoints (health, login, API docs).

## Full Test Suite

Comprehensive tests with automatic cleanup and setup:

```bash
./scripts/run-tests.sh
```

This script will:
1. ✓ Clean up any previous test containers/processes
2. ✓ Install dependencies
3. ✓ Build TypeScript
4. ✓ Start test infrastructure (MongoDB, MinIO)
5. ✓ Start test server
6. ✓ Run unit tests
7. ✓ Run API runtime tests
8. ✓ Check performance
9. ✓ Clean up everything

**Duration:** ~1-2 minutes

## Running Individual Tests

### Unit Tests Only
```bash
pnpm --filter server run test
```

### Integration Tests Only
```bash
# Start test database first
docker-compose -f docker-compose.test.yml up mongodb minio -d

# Run integration tests
pnpm --filter server run test:integration
```

### Watch Mode (for development)
```bash
pnpm --filter server run test:watch
```

## Test Environments

### Development Testing
```bash
# Use development database
docker-compose up mongodb minio -d
pnpm --filter server run dev
./scripts/test-runtime.sh
```

### Test Environment
```bash
# Use isolated test database
docker-compose -f docker-compose.test.yml up -d
pnpm --filter server run dev:test
./scripts/test-runtime.sh
```

### Production Testing
```bash
# Test production build
docker-compose -f docker-compose.prod.yml up -d
# Wait for services to start, then test endpoints manually
```

## Continuous Integration

For CI/CD pipelines:

```bash
#!/bin/bash
# ci-test.sh
set -e

# Run full test suite
./scripts/run-tests.sh

# Additional checks
pnpm run lint
pnpm run build --workspaces

echo "✅ CI tests passed"
```

## Troubleshooting Tests

### Port Already in Use
```bash
# Kill processes on port 3000
lsof -ti :3000 | xargs kill -9

# Or use the cleanup function
docker-compose down
pkill -f "ts-node.*index.ts"
```

### Docker Containers Won't Start
```bash
# Remove all test containers and volumes
docker-compose -f docker-compose.test.yml down -v

# Restart Docker Desktop (macOS)
# or restart Docker daemon (Linux)
```

### MongoDB Connection Issues
```bash
# Check MongoDB is running
docker ps | grep mongodb

# Check logs
docker logs singalong-js-mongodb-1

# Verify connection string
grep MONGODB_URI .env.test
```

### Tests Timing Out
```bash
# Increase wait time in run-tests.sh
# Edit MAX_WAIT variable (default: 60 seconds)
```

### Stale Test Data
```bash
# Clean test database
docker-compose -f docker-compose.test.yml down -v
docker volume rm singalong-js_mongodb-test-data
docker volume rm singalong-js_minio-test-data
```

## Test Coverage

View test coverage:

```bash
pnpm --filter server run test -- --coverage
```

Coverage report location: `server/coverage/`

## Adding New Tests

### Unit Tests
Create files matching: `server/src/**/*.test.ts`

Example:
```typescript
describe('MyService', () => {
  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

### Integration Tests
Create files matching: `server/src/**/*.integration.test.ts`

Example:
```typescript
import request from 'supertest';

describe('API Integration', () => {
  it('should return 200', async () => {
    const response = await request(BASE_URL).get('/health');
    expect(response.status).toBe(200);
  });
});
```

### Runtime Tests
Add to `scripts/test-runtime.sh`:

```bash
echo -n "Test: My New Feature... "
RESPONSE=$(curl -sf http://localhost:3000/my-endpoint)
if echo "$RESPONSE" | grep -q "expected"; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
    exit 1
fi
```

## Best Practices

1. **Always run tests before committing**
   ```bash
   ./scripts/run-tests.sh && git commit
   ```

2. **Use test environment for destructive tests**
   ```bash
   NODE_ENV=test pnpm --filter server run dev
   ```

3. **Clean up after manual testing**
   ```bash
   docker-compose -f docker-compose.test.yml down -v
   ```

4. **Check logs if tests fail**
   ```bash
   tail -50 /tmp/singalong-test-server.log
   ```

5. **Update tests when adding features**
   - Add unit tests for new services/functions
   - Add integration tests for new endpoints
   - Update runtime tests for critical flows

## Test Scripts Reference

| Script | Purpose | Duration |
|--------|---------|----------|
| `./scripts/run-tests.sh` | Full automated test suite | ~1-2 min |
| `./scripts/test-runtime.sh` | Quick API validation | ~5 sec |
| `pnpm run test` | Unit tests only | ~10 sec |
| `pnpm run test:integration` | Integration tests | ~30 sec |
| `pnpm run test:watch` | Dev mode with auto-rerun | Continuous |

## Exit Codes

- `0` - All tests passed
- `1` - Tests failed or error occurred

Check exit code:
```bash
./scripts/run-tests.sh
echo $?  # 0 = success, 1 = failure
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: ./scripts/run-tests.sh
```

### GitLab CI Example
```yaml
test:
  script:
    - ./scripts/run-tests.sh
  only:
    - main
    - merge_requests
```

---

**Remember:** Always use `pnpm`, never `npm` or `yarn`! 🎵
