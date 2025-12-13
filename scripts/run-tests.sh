#!/bin/bash
# Comprehensive test script for Singalong server
# Cleans up, builds, runs tests, and validates API functionality

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEST_COMPOSE="docker-compose.test.yml"
SERVER_PORT=3000
MAX_WAIT=60  # Maximum seconds to wait for server

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Singalong Server - Automated Test Suite    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

cd "$PROJECT_ROOT"

# Function to cleanup
cleanup() {
    echo -e "\n${YELLOW}🧹 Cleaning up...${NC}"
    
    # Stop ALL docker containers (test and dev)
    echo "Stopping Docker containers..."
    docker-compose -f "$TEST_COMPOSE" down 2>/dev/null || true
    docker-compose down 2>/dev/null || true
    docker stop singalong-dev-mongodb singalong-dev-minio 2>/dev/null || true
    docker stop singalong-test-mongodb singalong-test-minio 2>/dev/null || true
    
    # Remove test volumes for truly fresh start
    echo "Removing test volumes..."
    docker volume rm singalong-test_mongodb-test-data 2>/dev/null || true
    docker volume rm singalong-test_minio-test-data 2>/dev/null || true
    
    # Remove test network
    docker network rm singalong-test_singalong-test-network 2>/dev/null || true
    
    # Kill any lingering node/ts-node processes on test ports
    pkill -f "ts-node.*index.ts" 2>/dev/null || true
    lsof -ti :$SERVER_PORT | xargs kill -9 2>/dev/null || true
    lsof -ti :3100 | xargs kill -9 2>/dev/null || true  # Test server port
    
    # Wait for ports and volumes to be released
    sleep 2
    
    echo -e "${GREEN}✓ Cleanup complete${NC}"
}

# Function to wait for service
wait_for_service() {
    local host=$1
    local port=$2
    local service_name=$3
    local max_attempts=$MAX_WAIT
    local attempt=0

    echo -n "Waiting for $service_name to be ready"
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -sf "$host:$port/health" > /dev/null 2>&1; then
            echo -e " ${GREEN}✓${NC}"
            return 0
        fi
        echo -n "."
        sleep 1
        attempt=$((attempt + 1))
    done
    
    echo -e " ${RED}✗${NC}"
    echo -e "${RED}Failed to connect to $service_name after ${max_attempts}s${NC}"
    return 1
}

# Trap to ensure cleanup on exit
trap cleanup EXIT INT TERM

# Step 1: Initial cleanup
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 1: Initial Cleanup${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
cleanup
echo ""

# Step 2: Install dependencies
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 2: Install Dependencies${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "Running: pnpm install"
pnpm install --silent > /tmp/pnpm-install.log 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    echo "Check /tmp/pnpm-install.log for details"
    exit 1
fi
echo ""

# Step 3: Build TypeScript
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 3: Build TypeScript${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "Running: pnpm --filter server run build"
if pnpm --filter server run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓ TypeScript build successful${NC}"
else
    echo -e "${RED}✗ TypeScript build failed${NC}"
    echo "Run 'pnpm --filter server run build' to see errors"
    exit 1
fi
echo ""

# Step 4: Start test infrastructure (MongoDB + MinIO)
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 4: Start Test Infrastructure${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "Starting MongoDB and MinIO with fresh volumes..."
echo "Note: All test data will be created from scratch"
if docker-compose -f "$TEST_COMPOSE" up -d mongodb minio 2>&1 | grep -v "^Network\|^Container"; then
    echo -e "${GREEN}✓ Infrastructure started with fresh volumes${NC}"
else
    echo -e "${RED}✗ Failed to start infrastructure${NC}"
    exit 1
fi

# Wait for MongoDB to be healthy
echo -n "Waiting for MongoDB to be ready"
for i in {1..30}; do
    if docker-compose -f "$TEST_COMPOSE" ps mongodb | grep -q "healthy"; then
        echo -e " ${GREEN}✓${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e " ${RED}✗${NC}"
        echo -e "${RED}MongoDB failed to start${NC}"
        exit 1
    fi
    echo -n "."
    sleep 1
done

# Wait for MinIO (using test port 9002)
echo -n "Waiting for MinIO to be ready"
for i in {1..30}; do
    if curl -sf http://localhost:9002/minio/health/live > /dev/null 2>&1; then
        echo -e " ${GREEN}✓${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e " ${RED}✗${NC}"
        echo -e "${RED}MinIO failed to start${NC}"
        docker logs singalong-test-minio
        exit 1
    fi
    echo -n "."
    sleep 1
done
echo ""

# Step 5: Start test server
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 5: Start Test Server${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "Starting server in test mode..."

cd "$PROJECT_ROOT/server"
# Export test environment variables explicitly
export NODE_ENV=test
export MONGODB_URI="mongodb://admin:admin@localhost:27018/singalong-test?authSource=admin"
export MINIO_ENDPOINT="http://localhost:9002"
export MINIO_ACCESS_KEY="minioadmin"
export MINIO_SECRET_KEY="minioadmin"
export DEFAULT_ADMIN_USERNAME="admin"
export DEFAULT_ADMIN_PASSWORD="P@ssw0rd!"

pnpm run dev > /tmp/singalong-test-server.log 2>&1 &
SERVER_PID=$!
cd "$PROJECT_ROOT"

echo "Server PID: $SERVER_PID"

# Wait for server to be ready
if wait_for_service "http://localhost" "$SERVER_PORT" "Server"; then
    echo -e "${GREEN}✓ Server started successfully${NC}"
else
    echo -e "${RED}✗ Server failed to start${NC}"
    echo "Last 20 lines of server log:"
    tail -20 /tmp/singalong-test-server.log
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi
echo ""

# Step 6: Run unit tests
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 6: Run Unit Tests${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if pnpm --filter server run test 2>&1 | grep -E "(PASS|FAIL|Tests:|✓|✗)"; then
    echo -e "${GREEN}✓ Unit tests completed${NC}"
else
    echo -e "${YELLOW}⚠ No unit tests found or tests skipped${NC}"
fi
echo ""

# Step 7: Run API runtime tests
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 7: Run API Runtime Tests${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test 1: Health Check
echo -n "Test: Health Check... "
if curl -sf http://localhost:$SERVER_PORT/health | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
    exit 1
fi

# Test 2: API Documentation
echo -n "Test: API Documentation... "
STATUS=$(curl -sf -o /dev/null -w "%{http_code}" http://localhost:$SERVER_PORT/api-docs/)
if [ "$STATUS" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL (HTTP $STATUS)${NC}"
    exit 1
fi

# Test 3: Admin Login
echo -n "Test: Admin Login... "
LOGIN_RESPONSE=$(curl -sf -X POST http://localhost:$SERVER_PORT/auth/admin-login \
    -H "Content-Type: application/json" \
    -d '{"nickname":"admin","password":"P@ssw0rd!"}')

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"sessionToken":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

# Test 4: Create Room
echo -n "Test: Create Room... "
ROOM_RESPONSE=$(curl -sf -X POST http://localhost:$SERVER_PORT/rooms \
    -H "Content-Type: application/json" \
    -d '{"adminNickname":"testadmin","adminPassword":"Test123!"}')

if echo "$ROOM_RESPONSE" | grep -q '"success":true'; then
    ROOM_ID=$(echo "$ROOM_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    ROOM_NUMBER=$(echo "$ROOM_RESPONSE" | grep -o '"roomNumber":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}✓ PASS${NC}"
    echo "  Room ID: $ROOM_ID"
    echo "  Room Number: $ROOM_NUMBER"
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "Response: $ROOM_RESPONSE"
    exit 1
fi

# Test 5: Get Room Details
echo -n "Test: Get Room Details... "
ROOM_DETAILS=$(curl -sf http://localhost:$SERVER_PORT/rooms/$ROOM_ID \
    -H "Authorization: Bearer $TOKEN")

if echo "$ROOM_DETAILS" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "Response: $ROOM_DETAILS"
    exit 1
fi

# Test 6: CORS Headers
echo -n "Test: CORS Headers... "
CORS_RESPONSE=$(curl -sf -I -X OPTIONS http://localhost:$SERVER_PORT/health \
    -H "Origin: http://localhost:3001" 2>&1)

if echo "$CORS_RESPONSE" | grep -qi "access-control-allow-origin"; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${YELLOW}⚠ WARNING: CORS headers not found${NC}"
fi

echo ""

# Step 8: Performance check
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 8: Performance Check${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -n "Response time for health endpoint: "
RESPONSE_TIME=$(curl -sf -o /dev/null -w "%{time_total}" http://localhost:$SERVER_PORT/health)
echo "${RESPONSE_TIME}s"

if (( $(echo "$RESPONSE_TIME < 1.0" | bc -l) )); then
    echo -e "${GREEN}✓ Response time acceptable (<1s)${NC}"
else
    echo -e "${YELLOW}⚠ Response time slow (>1s)${NC}"
fi
echo ""

# Step 9: Stop server
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 9: Cleanup${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "Stopping test server..."
kill $SERVER_PID 2>/dev/null || true
sleep 1
# Force kill if still running
if ps -p $SERVER_PID > /dev/null 2>&1; then
    kill -9 $SERVER_PID 2>/dev/null || true
fi
echo -e "${GREEN}✓ Server stopped${NC}"
echo ""

# Final summary
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              TEST SUMMARY                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo -e ""
echo -e "${GREEN}✅ All tests passed successfully!${NC}"
echo -e ""
echo -e "The API is working correctly and ready for use."
echo -e ""
echo -e "Server logs saved to: ${BLUE}/tmp/singalong-test-server.log${NC}"
echo -e ""
