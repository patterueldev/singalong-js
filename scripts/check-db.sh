#!/bin/bash

# Script to check database contents
# Usage: ./scripts/check-db.sh [environment]
# Default: development

ENV=${1:-development}

case $ENV in
  development|dev)
    DB_NAME="singalong-dev"
    PORT=27017
    ;;
  test)
    DB_NAME="singalong-test"
    PORT=27018
    ;;
  production|prod)
    DB_NAME="singalong-prod"
    PORT=27017
    ;;
  *)
    echo "Unknown environment: $ENV"
    echo "Usage: $0 [development|test|production]"
    exit 1
    ;;
esac

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Checking Database: $DB_NAME (port $PORT)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if mongosh is available
if ! command -v mongosh &> /dev/null; then
    echo "❌ mongosh not found. Please install MongoDB Shell:"
    echo "   brew install mongosh"
    exit 1
fi

# Connect and check users collection
echo ""
echo "📊 Users collection:"
mongosh "mongodb://admin:admin@localhost:$PORT/$DB_NAME?authSource=admin" --quiet --eval "
  db.users.countDocuments();
" | tail -1 | xargs -I {} echo "   Total users: {}"

echo ""
echo "👥 Admin users:"
mongosh "mongodb://admin:admin@localhost:$PORT/$DB_NAME?authSource=admin" --quiet --eval "
  db.users.find({ role: 'admin' }).toArray();
" | tail -1

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
