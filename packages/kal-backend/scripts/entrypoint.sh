#!/bin/sh
set -e

echo "🚀 Starting Kal Backend..."
echo "================================"

# Run database migrations
echo "📦 Running database migrations..."
cd /app/packages/kal-db

# Check if migrate-mongo is available
if command -v npx > /dev/null 2>&1; then
  npx migrate-mongo up || echo "⚠️  Migration may have already been applied"
else
  echo "⚠️  Skipping migrations - migrate-mongo not available"
fi

# Run safe seeding (only seeds if collection is empty)
echo "🌱 Running safe seed..."
npx tsx scripts/seed-safe.ts || echo "⚠️  Safe seed skipped or failed"

echo "================================"
echo "✅ Database setup complete"

# Start the application
echo "🎯 Starting Node.js application..."
cd /app/packages/kal-backend
exec node dist/index.js
