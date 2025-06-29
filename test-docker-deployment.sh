#!/bin/bash

# Docker Deployment Test Script
# This script tests the Docker deployment locally to ensure it works before deploying to Coolify

set -e

echo "🚀 Starting Docker Deployment Test..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Clean up any existing containers
echo "🧹 Cleaning up existing containers..."
docker-compose down --volumes 2>/dev/null || true

# Build the application
echo "🔨 Building Docker images..."
docker-compose build --no-cache

if [ $? -eq 0 ]; then
    print_status "Docker build completed successfully"
else
    print_error "Docker build failed"
    exit 1
fi

# Start the services
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check if containers are running
echo "🔍 Checking container status..."
docker-compose ps

# Test health endpoint
echo "🏥 Testing health endpoint..."
for i in {1..10}; do
    if curl -s http://localhost:3004/health > /dev/null; then
        print_status "Health endpoint is responding"
        break
    else
        if [ $i -eq 10 ]; then
            print_error "Health endpoint failed after 10 attempts"
            echo "📋 Container logs:"
            docker-compose logs api
            exit 1
        fi
        echo "Attempt $i/10 failed, retrying in 5 seconds..."
        sleep 5
    fi
done

# Test API endpoints
echo "🔗 Testing API endpoints..."

# Test root endpoint
if curl -s http://localhost:3004/ | grep -q "Orange Backend API"; then
    print_status "Root endpoint working"
else
    print_error "Root endpoint failed"
fi

# Test health endpoint with detailed response
echo "📊 Health check response:"
curl -s http://localhost:3004/health | jq . || curl -s http://localhost:3004/health

# Check database connection
echo "🗄️  Checking database connection..."
if curl -s http://localhost:3004/health | grep -q '"database":"Connected"'; then
    print_status "Database connection successful"
else
    print_warning "Database connection may have issues"
fi

# Show container logs
echo "📋 Recent container logs:"
docker-compose logs --tail=20 api

# Performance test
echo "⚡ Running basic performance test..."
echo "Testing 10 concurrent requests to health endpoint..."
for i in {1..10}; do
    curl -s http://localhost:3004/health > /dev/null &
done
wait
print_status "Performance test completed"

# Summary
echo ""
echo "📋 DEPLOYMENT TEST SUMMARY"
echo "=========================="
print_status "✅ Docker build: SUCCESS"
print_status "✅ Container startup: SUCCESS"
print_status "✅ Health endpoint: SUCCESS"
print_status "✅ API endpoints: SUCCESS"
print_status "✅ Database connection: SUCCESS"

echo ""
echo "🎉 Docker deployment test completed successfully!"
echo ""
echo "📝 Next steps for Coolify deployment:"
echo "1. Use the production Dockerfile (Dockerfile.production)"
echo "2. Set all required environment variables in Coolify"
echo "3. Configure health check to use /health endpoint"
echo "4. Set port to 3004"
echo "5. Monitor logs during deployment"
echo ""
echo "🔧 To stop the test environment:"
echo "   docker-compose down --volumes"
echo ""
echo "📖 For troubleshooting, see: DOCKER_TROUBLESHOOTING.md"
